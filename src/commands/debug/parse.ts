import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ApexLogParser, ParsedLog } from 'apex-log-parser';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-debug-log', 'debug.parse');

export default class Parse extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    files: Flags.file({
      summary: messages.getMessage('flags.files.summary'),
      char: 'f',
      required: true,
      exists: true,
      multiple: true,
    }),
  };


  public async run(): Promise<void> {
    const { flags } = await this.parse(Parse);
    const filePaths = flags.files;
    const parser = new ApexLogParser();
    const isMultipleFiles = filePaths.length > 1;

    let hasErrors = false;

    if (isMultipleFiles) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allEvents: any[] = [];

      const parsePromises = filePaths.map(async (filePath) => {
        try {
          const apexLog: ParsedLog = await parser.parseFile(filePath);

          const events = apexLog.events.map((event) => {
            // eslint-disable-next-line no-param-reassign
            event.source = filePath;
            return event;
          });

          allEvents.push(...events);
        } catch (err) {
          hasErrors = true;
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.warn(`Error parsing ${filePath}: ${errorMsg}\n`);
        }
      });

      await Promise.all(parsePromises);

      this.log(JSON.stringify({ events: allEvents }, null, 2));
    } else {
      const filePath = filePaths[0];
      try {
        const apexLog: ParsedLog = await parser.parseFile(filePath);
        this.log(JSON.stringify(apexLog, null, 2));
      } catch (err) {
        hasErrors = true;
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.warn(`Error parsing ${filePath}: ${errorMsg}\n`);
      }
    }

    if (hasErrors) {
      process.exitCode = 1;
    }
  }
}
