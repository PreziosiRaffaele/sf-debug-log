/* eslint-disable class-methods-use-this */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Connection } from '@salesforce/core';
import { createDebugLevel } from '../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-debug-log', 'debuglevel.new');

const DEBUG_CATEGORIES = [
  'Database',
  'Workflow',
  'Validation',
  'Callout',
  'ApexCode',
  'ApexProfiling',
  'Visualforce',
  'System',
  'Wave',
  'Nba',
];

const DEBUG_LEVELS = ['NONE', 'INTERNAL', 'FINEST', 'FINER', 'FINE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];

export type DebuglevelNewResult = {
  isSuccess: boolean;
  error?: string;
};

interface DebugLevel {
  [key: string]: string | undefined;
  MasterLabel: string;
  DeveloperName: string;
}

export default class DebuglevelNew extends SfCommand<DebuglevelNewResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    targetusername: Flags.requiredOrg({
      summary: messages.getMessage('flags.targetusername.summary'),
      char: 'o',
      required: true,
    }),
    developername: Flags.string({
      summary: messages.getMessage('flags.developerName.summary'),
      char: 'n',
      required: true,
    }),
  };

  public async run(): Promise<DebuglevelNewResult> {
    const { flags } = await this.parse(DebuglevelNew);
    const conn: Connection = flags.targetusername.getConnection();

    try {
      const debugLevel = this.createDebugLevelRecord(flags.developername);

      for (const category of DEBUG_CATEGORIES) {
        // eslint-disable-next-line no-await-in-loop
        const level = await this.selectDebugLevel(category);
        debugLevel[category] = level;
      }

      const result = await createDebugLevel(conn, debugLevel);
      if (!result.isSuccess) {
        this.error(`Error to create Debug Level: ${result.error}`);
      } else {
        this.log(`Debug Level ${flags.developername} created successfully.`);
      }
      return result;
    } catch (exception) {
      const err = exception instanceof Error ? exception.message : String(exception);
      this.log(`Error to create Debug Level: ${err}`);
      return {
        isSuccess: false,
        error: err,
      };
    }
  }

  private createDebugLevelRecord(developerName: string): DebugLevel {
    return {
      DeveloperName: developerName,
      MasterLabel: developerName,
    };
  }

  private async selectDebugLevel(category: string): Promise<string> {
    const levels = DEBUG_LEVELS;
    const level = await this.prompt<{ level: string }>({
      type: 'list',
      name: 'level',
      message: `Select ${category} debug level`,
      loop: false,
      choices: levels,
    });
    return level.level;
  }
}
