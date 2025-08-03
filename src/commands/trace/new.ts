import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { getUserId, getActiveTraceFlag, createTraceFlag, getDebugLevels } from '../../utils.js';
import type { DebugLevel } from '../../types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'trace.new');

export default class TraceNew extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
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
      default: 60,
    }),
    force: Flags.boolean({
      summary: messages.getMessage('flags.force.summary'),
      char: 'f',
      default: false,
    }),
    debuglevel: Flags.string({
      summary: messages.getMessage('flags.debuglevel.summary'),
      char: 'd',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(TraceNew);
    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const user = flags.user ? flags.user : (conn.getUsername() as string);
    const userId = await getUserId(conn, user);
    if (!userId) {
      this.error(`User ${user} not found`);
    }
    const activeFlag = await getActiveTraceFlag(conn, userId);
    if (activeFlag?.Id) {
      if (!flags.force) {
        this.log('Trace Flag already exists for this user.');
        return;
      } else {
        await conn.tooling.sobject('TraceFlag').delete(activeFlag.Id);
      }
    }
    const debugLevels: DebugLevel[] = await getDebugLevels(conn);
    const debugLevelId = debugLevels.find((level) => level.DeveloperName === flags.debuglevel)?.Id;
    if (!debugLevelId) {
      this.error(`Debug Level ${flags.debuglevel} not found`);
    }
    const result = await createTraceFlag(conn, userId, debugLevelId, flags.time);
    if (!result.isSuccess) {
      this.error(`Error to create Trace Flag: ${result.error}`);
    } else {
      this.log(`Trace flag created for ${user}`);
    }
  }
}
