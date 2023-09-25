import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { Connection } from '@salesforce/core';
import { createTraceFlag } from '../../HandleTraceFlag';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('debug-log', 'trace.new');

export type TraceNewResult = {
  isSuccess: boolean;
  error?: string;
};

export default class TraceNew extends SfCommand<TraceNewResult> {
  public static readonly summary = messages.getMessage('summary');
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
      required: true,
    }),
    debuglevel: Flags.string({
      summary: messages.getMessage('flags.debuglevel.summary'),
      default: 'SFDC_DevConsole',
    }),
    time: Flags.integer({
      summary: messages.getMessage('flags.time.summary'),
      default: 60,
    }),
  };

  public async run(): Promise<TraceNewResult> {
    const { flags } = await this.parse(TraceNew);
    this.spinner.start('Creating Trace Flag...');
    const conn: Connection = flags.targetusername.getConnection();
    const result = await createTraceFlag(conn, flags.user, flags.debuglevel, flags.time);
    this.spinner.stop();
    if (!result.isSuccess) {
      throw messages.createError('error.createTraceFlag', [result.error]);
    } else {
      this.log(`User Trace Flag successfully created for ${flags.user}`);
    }
    return result;
  }
}
