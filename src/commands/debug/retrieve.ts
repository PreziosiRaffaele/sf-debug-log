/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { Record } from 'jsforce';
import sanitize from 'sanitize-filename';
import { getUserId, createFile } from '../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-debug-log', 'retrieve');

export type RetrieveResult = {
  isSuccess: boolean;
  error?: string;
};

export default class Retrieve extends SfCommand<RetrieveResult> {
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
    folder: Flags.directory({
      summary: messages.getMessage('flags.folder.summary'),
      char: 'd',
      default: 'tools/debug/logs',
    }),
  };

  public async run(): Promise<RetrieveResult> {
    const { flags } = await this.parse(Retrieve);
    const conn: Connection = flags.targetusername.getConnection();
    let result: RetrieveResult;
    try {
      this.spinner.start('Retriving debug logs...');
      const user = flags.user ? flags.user : (conn.getUsername() as string);
      const userId = await getUserId(conn, user);
      const logs = await getLogs(conn, userId, flags.time);
      await saveLogs(conn, logs, flags.folder);
      this.spinner.stop();
      return { isSuccess: true };
    } catch (err) {
      result = {
        isSuccess: false,
        error: err instanceof Error ? err.message : String(err),
      };
      throw messages.createError('error.saveLogs', [result.error]);
    }
  }
}

async function getLogs(conn: Connection, userId: string, time: number): Promise<Record[]> {
  const dateTime = new Date(Date.now());
  dateTime.setMinutes(dateTime.getMinutes() - time);

  const startTime = dateTime.toISOString();
  const queryResult = await conn.query(`SELECT Id, LogUser.Name, LogLength, Request, Operation,
                                Application, Status, DurationMilliseconds,
                                SystemModstamp, RequestIdentifier
                                FROM ApexLog
                                WHERE SystemModstamp > ${startTime}
                                AND LogUserId = '${userId}'
                                ORDER BY SystemModstamp DESC`);

  if (queryResult.records.length === 0) {
    throw new Error('No debug logs found');
  }

  return queryResult.records;
}

async function saveLogs(conn: Connection, logs: Record[], directory: string): Promise<void> {
  // Use Promise.all to parallelize the download and save operations
  await Promise.all(
    logs.map(async (log) => {
      const url = `${conn.instanceUrl}/apexdebug/traceDownload.apexp?id=${log.Id}`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const date = new Date(log.SystemModstamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
      const fileName = `(${hours}-${minutes}-${seconds}) ${log.DurationMilliseconds}ms ${log.Request} ${log.Operation} ${log.Status}.log`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const sanitizedFileName = sanitize(fileName);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
      const filePath = `${directory}/${log.LogUser.Name}/${sanitizedFileName}`;
      try {
        const body = await conn.request(url);
        await createFile(filePath, body as string);
      } catch (err) {
        throw new Error('Error saving debug logs');
      }
    })
  );
}
