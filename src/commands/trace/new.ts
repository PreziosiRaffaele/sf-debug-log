import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { SaveResult, Record } from 'jsforce';
import { getUserId } from '../../utils';

const MILLISECONDS_PER_MINUTE = 60000;

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
      default: 60,
    }),
  };

  public async run(): Promise<TraceNewResult> {
    const { flags } = await this.parse(TraceNew);
    const conn: Connection = flags.targetusername.getConnection();
    let result: TraceNewResult;

    try {
      this.spinner.start('Retriving debug levels...');
      const user = flags.user ? flags.user : (conn.getUsername() as string);
      const [userId, debugLevels] = await Promise.all([getUserId(conn, user), getDebugLevels(conn)]);
      this.spinner.stop();
      const debuglevel = await this.selectDebugLevel(debugLevels);
      this.spinner.start('Creating Trace Flag...');
      result = await createTraceFlag(conn, userId, debuglevel, flags.time);
      this.spinner.stop();
    } catch (err) {
      result = {
        isSuccess: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
    if (!result.isSuccess) {
      throw messages.createError('error.createTraceFlag', [result.error]);
    } else {
      this.log(`User Trace Flag successfully created for ${flags.user}`);
    }
    return result;
  }

  private async selectDebugLevel(debugLevels: Record[]): Promise<string> {
    const debuglevel = await this.prompt<{ debugLevel: string }>({
      type: 'list',
      name: 'debugLevel',
      message: 'Select Debug Level',
      choices: debugLevels.map((debugLevel) => ({
        loop: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-template-expressions
        name: `${debugLevel.DeveloperName}    	(DB:${debugLevel.Database}   Callout:${debugLevel.Callout}   ApexCode:${debugLevel.ApexCode}   Validation:${debugLevel.Validation}  Workflow:${debugLevel.Workflow}    Profiling:${debugLevel.ApexProfiling}  Visualforce:${debugLevel.Visualforce}  System:${debugLevel.System}  Wave:${debugLevel.Wave}  Nba:${debugLevel.Nba})`,
        value: debugLevel.Id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        short: debugLevel.DeveloperName,
      })),
    });

    return debuglevel.debugLevel;
  }
}

async function getDebugLevels(conn: Connection): Promise<Record[]> {
  const results = await conn.tooling.query(
    'SELECT Id, DeveloperName, Workflow, Validation, Callout, ApexCode, ApexProfiling, Visualforce, System, Database, Wave, Nba FROM DebugLevel'
  );
  if (results?.records) {
    return results.records;
  } else {
    throw new Error('Error to retrieve Debug Levels');
  }
}

async function createTraceFlag(
  conn: Connection,
  userId: string,
  debugLevelId: string,
  time: number
): Promise<TraceNewResult> {
  const result: SaveResult = await conn.tooling.sobject('TraceFlag').create({
    TracedEntityId: userId,
    DebugLevelId: debugLevelId,
    StartDate: new Date(Date.now()).toISOString(),
    logtype: 'USER_DEBUG',
    ExpirationDate: new Date(Date.now() + time * MILLISECONDS_PER_MINUTE).toISOString(),
  });
  return {
    isSuccess: result.success,
    error: result.success ? undefined : result.errors[0].message,
  };
}
