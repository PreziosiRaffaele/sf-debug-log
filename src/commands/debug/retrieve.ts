import path from 'path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { getUserId, createFile, getLogs } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'debug.retrieve');

import type { ApexLog, GetLogsOptions } from '../../types.js';

export default class Retrieve extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    targetusername: Flags.requiredOrg({
      summary: messages.getMessage('flags.targetusername.summary'),
      char: 'o',
      required: true,
    }),
    user: Flags.string({
      summary: messages.getMessage('flags.user.summary'),
      char: 'u',
    }),
    time: Flags.integer({
      summary: messages.getMessage('flags.time.summary'),
      char: 't',
    }),
    folder: Flags.directory({
      summary: messages.getMessage('flags.folder.summary'),
      char: 'd',
      default: '.sfdx/tools/debug/logs',
    }),
    'all-users': Flags.boolean({
      summary: messages.getMessage('flags.all-users.summary'),
      char: 'a',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Retrieve);
    if (flags['all-users'] && flags.user) {
      this.error('Cannot use --all-users and --user flags together');
    }

    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const getLogsOptions: GetLogsOptions = {};

    if (!flags['all-users']) {
      // Default to the current user if no user is specified
      const user = flags.user ? flags.user : (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      if (!userId) {
        this.error(`User ${user} not found`);
      }
      getLogsOptions.userId = userId;
    }

    if (flags.time) {
      getLogsOptions.timeLimit = flags.time;
    }

    const logs = await getLogs(conn, getLogsOptions);
    await saveLogs(conn, logs, flags.folder);
    this.log(`saved\t${logs.length}`);
  }
}

async function saveLogs(conn: Connection, logs: ApexLog[], directory: string): Promise<void> {
  // Use Promise.all to parallelize the download and save operations
  await Promise.all(
    logs.map(async (log) => {
      const url = `${conn.instanceUrl}/apexdebug/traceDownload.apexp?id=${log.Id}`;
      const fileName = `${log.Id}.log`;
      const filePath = path.join(directory, fileName);
      try {
        const body = await conn.request(url);
        await createFile(filePath, body as string);
      } catch (err) {
        throw new Error('Error saving debug logs');
      }
    })
  );
}
