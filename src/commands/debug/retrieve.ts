import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline as nodePipeline, Writable } from 'node:stream';
import { promisify } from 'node:util';
import type { Interfaces } from '@oclif/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { getUserId, getLogs, getLogsByQuery } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'debug.retrieve');

import type { ApexLog, GetLogsOptions } from '../../types.js';

const pipeline = promisify(nodePipeline);
const QUERY_EXCLUSIVE_FLAGS = ['user', 'time', 'limit', 'all-users'];
const EMPTY_DOWNLOAD_SUMMARY: DownloadSummary = { failedCount: 0, savedCount: 0 };

export default class Retrieve extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion({
      summary: messages.getMessage('flags.api-version.summary'),
    }),
    targetusername: Flags.requiredOrg({
      summary: messages.getMessage('flags.targetusername.summary'),
      char: 'o',
      required: true,
    }),
    user: Flags.string({
      summary: messages.getMessage('flags.user.summary'),
      char: 'u',
      exclusive: ['all-users'],
    }),
    time: Flags.integer({
      summary: messages.getMessage('flags.time.summary'),
      char: 't',
    }),
    limit: Flags.integer({
      summary: messages.getMessage('flags.limit.summary'),
      char: 'l',
      default: 100,
    }),
    query: Flags.string({
      summary: messages.getMessage('flags.query.summary'),
      char: 'q',
      exclusive: QUERY_EXCLUSIVE_FLAGS,
    }),
    folder: Flags.directory({
      summary: messages.getMessage('flags.folder.summary'),
      char: 'd',
    }),
    'all-users': Flags.boolean({
      summary: messages.getMessage('flags.all-users.summary'),
      char: 'a',
      default: false,
      exclusive: ['user'],
    }),
  };

  private static async pipeLog(conn: Connection, log: ApexLog, destination: Writable): Promise<void> {
    const request = conn.request<string>(Retrieve.getDownloadUrl(conn, log));

    await Promise.all([pipeline(request.stream(), destination), request.then(() => undefined)]);
  }

  private static getDownloadUrl(conn: Connection, log: ApexLog): string {
    return `${conn.instanceUrl}/apexdebug/traceDownload.apexp?id=${log.Id}`;
  }

  private static createStdoutWriter(): Writable {
    return new Writable({
      write(chunk: string | Uint8Array, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        if (typeof chunk === 'string') {
          process.stdout.write(chunk, encoding, callback);
        } else {
          process.stdout.write(chunk, callback);
        }
      },
    });
  }

  public async run(): Promise<void> {
    const { flags: parsedFlags } = await this.parse(Retrieve);
    const flags = parsedFlags as RetrieveFlags;
    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const logs = flags.query ? await getLogsByQuery(conn, flags.query) : await this.getLogsFromFlags(conn, flags);
    const downloadSummary = flags.folder
      ? await this.saveLogs(conn, logs, flags.folder)
      : await this.streamLogsToStdout(conn, logs);

    if (downloadSummary.failedCount > 0) {
      const label = downloadSummary.failedCount === 1 ? 'log' : 'logs';
      this.error(`Failed to retrieve ${downloadSummary.failedCount} ${label}.`);
    }

    if (flags.folder) {
      this.log(`saved\t${downloadSummary.savedCount}`);
    }
  }

  private async getLogsFromFlags(
    conn: Connection,
    flags: Pick<RetrieveFlags, 'user' | 'time' | 'limit' | 'all-users'>
  ): Promise<ApexLog[]> {
    const getLogsOptions: GetLogsOptions = {};

    if (!flags['all-users']) {
      const user = flags.user ?? (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      if (!userId) {
        this.error(`User ${user} not found`);
      }

      getLogsOptions.userId = userId;
    }

    if (flags.time !== undefined) {
      getLogsOptions.timeLimit = flags.time;
    }

    if (flags.limit !== undefined) {
      getLogsOptions.limit = flags.limit;
    }

    return getLogs(conn, getLogsOptions);
  }

  private async saveLogs(conn: Connection, logs: ApexLog[], directory: string): Promise<DownloadSummary> {
    const results = await Promise.all(
      logs.map(async (log) => {
        const filePath = path.join(directory, `${log.Id}.log`);

        try {
          await mkdir(path.dirname(filePath), { recursive: true });
          await Retrieve.pipeLog(conn, log, createWriteStream(filePath));
          return { failedCount: 0, savedCount: 1 };
        } catch (err) {
          this.warnDownloadError(log, err);
          return { failedCount: 1, savedCount: 0 };
        }
      })
    );

    return results.reduce(
      (summary, result) => ({
        failedCount: summary.failedCount + result.failedCount,
        savedCount: summary.savedCount + result.savedCount,
      }),
      EMPTY_DOWNLOAD_SUMMARY
    );
  }

  private async streamLogsToStdout(conn: Connection, logs: ApexLog[]): Promise<DownloadSummary> {
    return logs.reduce<Promise<DownloadSummary>>(async (summaryPromise, log) => {
      const summary = await summaryPromise;

      try {
        await Retrieve.pipeLog(conn, log, Retrieve.createStdoutWriter());
        return {
          failedCount: summary.failedCount,
          savedCount: summary.savedCount + 1,
        };
      } catch (err) {
        this.warnDownloadError(log, err);
        return {
          failedCount: summary.failedCount + 1,
          savedCount: summary.savedCount,
        };
      }
    }, Promise.resolve(EMPTY_DOWNLOAD_SUMMARY));
  }

  private warnDownloadError(log: ApexLog, err: unknown): void {
    const errorMessage = err instanceof Error ? err.message : '';
    this.warn(`Error downloading log for ${log.Id}: ${errorMessage}`);
  }
}

type RetrieveFlags = Interfaces.InferredFlags<typeof Retrieve.flags>;
type DownloadSummary = { failedCount: number; savedCount: number };


