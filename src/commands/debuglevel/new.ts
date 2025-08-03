/* eslint-disable class-methods-use-this */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, type Connection } from '@salesforce/core';
import { select } from '@inquirer/prompts';
import { createDebugLevel } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
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

import type { DebugLevelCreate } from '../../types.js';

export default class DebuglevelNew extends SfCommand<void> {
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
    developername: Flags.string({
      summary: messages.getMessage('flags.developername.summary'),
      char: 'n',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DebuglevelNew);
    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);

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
    } catch (exception) {
      const err = exception instanceof Error ? exception.message : String(exception);
      this.error(`Error to create Debug Level: ${err}`, { exit: 1 });
    }
  }

  private createDebugLevelRecord(developerName: string): DebugLevelCreate {
    return {
      DeveloperName: developerName,
      MasterLabel: developerName,
    };
  }

  private async selectDebugLevel(category: string): Promise<string> {
    const choices = DEBUG_LEVELS.map((level) => ({ value: level }));
    const level = await select({
      message: `Select ${category} debug level`,
      loop: false,
      choices,
    });
    return level;
  }
}
