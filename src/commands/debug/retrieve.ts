import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline as nodePipeline, Writable } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { promisify } from 'node:util';
import type { Interfaces } from '@oclif/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { getUserId, getLogs } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'debug.retrieve');

import type { ApexLog, GetLogsOptions } from '../../types.js';

const pipeline = promisify(nodePipeline);
const WHERE_EXCLUSIVE_FLAGS = ['user', 'time', 'all-users'];
const EMPTY_DOWNLOAD_SUMMARY: DownloadSummary = { failedCount: 0, savedCount: 0 };
const OUTPUT_FORMATS = ['text', 'ndjson'] as const;

class PartialNdjsonStreamError extends Error {
  public constructor(message: string, public readonly cause: unknown) {
    super(message);
  }
}

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
    where: Flags.string({
      summary: messages.getMessage('flags.where.summary'),
      char: 'w',
      exclusive: WHERE_EXCLUSIVE_FLAGS,
    }),
    folder: Flags.directory({
      summary: messages.getMessage('flags.folder.summary'),
      char: 'd',
    }),
    'output-format': Flags.string({
      summary: messages.getMessage('flags.output-format.summary'),
      options: [...OUTPUT_FORMATS],
      default: 'text',
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

  private static createNdjsonWriter(log: ApexLog): NdjsonWriter {
    const decoder = new StringDecoder('utf8');
    let started = false;
    let completed = false;
    const recordPrefix = JSON.stringify({
      Id: log.Id,
      Request: log.Request ?? null,
      Operation: log.Operation ?? null,
      LastModifiedDate: log.LastModifiedDate ?? null,
      Status: log.Status ?? null,
      Log: '',
    }).slice(0, -2);
    const writer = new Writable({
      write(chunk: string | Uint8Array, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        const chunkBuffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        const decoded = decoder.write(chunkBuffer);

        if (!started && decoded.length > 0) {
          startRecord();
        }

        if (decoded.length === 0) {
          callback();
          return;
        }

        process.stdout.write(Retrieve.escapeJsonString(decoded), callback);
      },
      final(callback: (error?: Error | null) => void): void {
        const remaining = decoder.end();

        if (!started && remaining.length > 0) {
          startRecord();
        }

        if (remaining.length > 0) {
          process.stdout.write(Retrieve.escapeJsonString(remaining), (error?: Error | null) => {
            if (error) {
              callback(error);
              return;
            }

            endRecord(callback);
          });
          return;
        }

        endRecord(callback);
      },
    }) as NdjsonWriter;

    const startRecord = (): void => {
      if (!started) {
        started = true;
        writer.started = true;
        process.stdout.write(recordPrefix);
      }
    };

    const endRecord = (callback: (error?: Error | null) => void): void => {
      if (!started) {
        startRecord();
      }

      if (!completed) {
        completed = true;
        process.stdout.write('"}\n', callback);
        return;
      }

      callback();
    };

    writer.started = false;
    return writer;
  }

  private static escapeJsonString(value: string): string {
    return JSON.stringify(value).slice(1, -1);
  }

  private static async streamLog(conn: Connection, log: ApexLog, outputFormat: OutputFormat): Promise<void> {
    const request = conn.request<string>(Retrieve.getDownloadUrl(conn, log));
    const destination =
      outputFormat === 'ndjson' ? Retrieve.createNdjsonWriter(log) : Retrieve.createStdoutWriter();

    try {
      await Promise.all([pipeline(request.stream(), destination), request.then(() => undefined)]);
    } catch (err) {
      if (outputFormat === 'ndjson' && (destination as NdjsonWriter).started) {
        throw new PartialNdjsonStreamError(`NDJSON stream failed after output started for ${log.Id}`, err);
      }

      throw err;
    }
  }

  public async run(): Promise<void> {
    const { flags: parsedFlags } = await this.parse(Retrieve);
    const flags = parsedFlags as RetrieveFlags;
    const outputFormat = flags['output-format'] as OutputFormat;

    if (outputFormat === 'ndjson' && flags.folder) {
      this.error('Cannot use --output-format ndjson with --folder.');
    }

    if (outputFormat === 'ndjson' && flags.json) {
      this.error('Cannot use --output-format ndjson with --json.');
    }

    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const logs = await this.getLogsFromFlags(conn, flags);
    const downloadSummary = flags.folder
      ? await this.saveLogs(conn, logs, flags.folder)
      : await this.streamLogsToStdout(conn, logs, outputFormat);

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
    flags: Pick<RetrieveFlags, 'user' | 'time' | 'limit' | 'all-users' | 'where'>
  ): Promise<ApexLog[]> {
    const getLogsOptions: GetLogsOptions = {};

    if (!flags['all-users'] && flags.where === undefined) {
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

    if (flags.where !== undefined) {
      getLogsOptions.whereClause = flags.where;
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

  private async streamLogsToStdout(
    conn: Connection,
    logs: ApexLog[],
    outputFormat: OutputFormat
  ): Promise<DownloadSummary> {
    return logs.reduce<Promise<DownloadSummary>>(async (summaryPromise, log) => {
      const summary = await summaryPromise;

      try {
        await Retrieve.streamLog(conn, log, outputFormat);
        return {
          failedCount: summary.failedCount,
          savedCount: summary.savedCount + 1,
        };
      } catch (err) {
        if (err instanceof PartialNdjsonStreamError) {
          throw err;
        }

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
type OutputFormat = (typeof OUTPUT_FORMATS)[number];
type NdjsonWriter = Writable & { started: boolean };
