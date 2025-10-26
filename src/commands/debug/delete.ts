import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, type Connection } from '@salesforce/core';
import { getUserId, getLogs, deleteLogs } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'debug.delete');

import type { ApexLog, GetLogsOptions } from '../../types.js';

export default class DebugDelete extends SfCommand<void> {
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
    }),
    time: Flags.integer({
      summary: messages.getMessage('flags.time.summary'),
      char: 't',
    }),
    'all-users': Flags.boolean({
      summary: messages.getMessage('flags.all-users.summary'),
      char: 'a',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DebugDelete);
    if (flags['all-users'] && flags.user) {
      this.error('Cannot use --all-users and --user flags together');
    }

    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const getLogsOptions: GetLogsOptions = {};

    if (!flags['all-users']) {
      const user = flags.user ? flags.user : (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      if (!userId) {
        this.error(`User ${user} not found`);
      }
      getLogsOptions.userId = userId;
    }

    if (flags.time) {
      getLogsOptions.timeOlderThan = flags.time;
    }

    const logs: ApexLog[] = await getLogs(conn, getLogsOptions);
    await deleteLogs(conn, logs);
    this.log(`deleted\t${logs.length}`);
  }
}
