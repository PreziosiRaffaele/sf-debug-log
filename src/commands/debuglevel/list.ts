import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { getDebugLevels } from '../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-debug-log', 'debuglevel.list');

export default class List extends SfCommand<void> {
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
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(List);
    const conn: Connection = flags.targetusername.getConnection(flags['api-version']);
    const debugLevels = await getDebugLevels(conn);
    const data = debugLevels.map((level) => ({
      DeveloperName: level.DeveloperName,
      Workflow: level.Workflow,
      Validation: level.Validation,
      Callout: level.Callout,
      ApexCode: level.ApexCode,
      ApexProfiling: level.ApexProfiling,
      Visualforce: level.Visualforce,
      System: level.System,
      Database: level.Database,
      Wave: level.Wave,
      Nba: level.Nba
    }));
    this.table({ data });
  }
}

