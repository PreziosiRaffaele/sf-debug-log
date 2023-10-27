import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { Record } from 'jsforce';
import { getUserId, getActiveTraceFlag, getDebugLevels, createTraceFlag } from '../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-debug-log', 'trace.new');

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
    }),
    time: Flags.integer({
      summary: messages.getMessage('flags.time.summary'),
      char: 't',
      default: 60,
    }),
  };

  public async run(): Promise<TraceNewResult> {
    const { flags } = await this.parse(TraceNew);
    const conn: Connection = flags.targetusername.getConnection();
    let result: TraceNewResult;
    let user;

    try {
      this.spinner.start('Retriving debug levels...');
      user = flags.user ? flags.user : (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      const [activeFlag, debugLevels] = await Promise.all([getActiveTraceFlag(conn, userId), getDebugLevels(conn)]);
      this.spinner.stop();
      if (activeFlag?.Id) {
        const shouldProceed = await this.selectToProceed();
        if (!shouldProceed) {
          return { isSuccess: false, error: 'Trace Flag already exists for this user.' };
        } else {
          this.spinner.start('Deleting existing Trace Flag...');
          await conn.tooling.sobject('TraceFlag').delete(activeFlag.Id);
          this.spinner.stop();
        }
      }
      const debuglevel = await this.selectDebugLevel(debugLevels);
      this.spinner.start('Creating Trace Flag...');
      result = await createTraceFlag(conn, userId, debuglevel, flags.time);
      this.spinner.stop();
      if (!result.isSuccess) {
        this.error(`Error to create Trace Flag: ${result.error}`);
      } else {
        this.log(`User Trace Flag successfully created for ${user}`);
      }
      return result;
    } catch (err) {
      return {
        isSuccess: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async selectToProceed(): Promise<boolean> {
    const proceed = await this.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: 'Trace Flag already exists for this user. Do you want to proceed?',
    });

    return proceed.proceed;
  }

  private async selectDebugLevel(debugLevels: Record[]): Promise<string> {
    const debuglevel = await this.prompt<{ debugLevel: string }>({
      type: 'list',
      name: 'debugLevel',
      message: 'Select Debug Level',
      loop: false,
      choices: debugLevels.map((debugLevel) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-template-expressions
        name: `${debugLevel.DeveloperName} (DB:${debugLevel.Database} Callout:${debugLevel.Callout} APEX:${debugLevel.ApexCode} Validation:${debugLevel.Validation} Workflow:${debugLevel.Workflow} Profiling:${debugLevel.ApexProfiling} VF:${debugLevel.Visualforce} System:${debugLevel.System} Wave:${debugLevel.Wave} Nba:${debugLevel.Nba})`,
        value: debugLevel.Id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        short: debugLevel.DeveloperName,
      })),
    });

    return debuglevel.debugLevel;
  }
}
