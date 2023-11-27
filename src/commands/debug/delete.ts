import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { Record } from 'jsforce';
import { getUserId, getLogs, deleteLogs } from '../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-debug-log', 'debug.delete');

export type DebugDeleteResult = {
  isSuccess: boolean;
  error?: string;
};

export default class DebugDelete extends SfCommand<DebugDeleteResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
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
  };

  public async run(): Promise<DebugDeleteResult> {
    const { flags } = await this.parse(DebugDelete);
    const conn: Connection = flags.targetusername.getConnection();
    let result: DebugDeleteResult;
    try {
      this.spinner.start('Deleting debug logs...');
      const user = flags.user ? flags.user : (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      const logs: Record[] = await getLogs(conn, userId, flags.time);
      await deleteLogs(conn, logs);
      this.log(`${logs.length} logs deleted successfully`);
      this.spinner.stop();
      return { isSuccess: true };
    } catch (err) {
      result = {
        isSuccess: false,
        error: err instanceof Error ? err.message : String(err),
      };
      throw messages.createError('error.deleteLogs', [result.error]);
    }
  }
}
