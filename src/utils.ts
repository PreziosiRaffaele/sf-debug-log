import { dirname } from 'path';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs';
import { Connection } from '@salesforce/core';
import type { SaveResult, ApexLog, TraceFlag, DebugLevel, DebugLevelCreate, GetLogsOptions } from './types.js';

const mkdirPromise = promisify(mkdir);
const writeFilePromise = promisify(writeFile);

const MILLISECONDS_PER_MINUTE = 60000;

export async function createFile(path: string, contents: string): Promise<void> {
  await mkdirPromise(dirname(path), { recursive: true });
  await writeFilePromise(path, contents);
}

export async function getUserId(connection: Connection, inputUser: string): Promise<string | undefined> {
  let result;
  if (isValidEmail(inputUser)) {
    result = await connection.tooling.sobject('User').findOne({ Username: inputUser });
  } else if (isId(inputUser)) {
    result = await connection.tooling.sobject('User').findOne({ Id: inputUser });
  } else {
    result = await connection.tooling.sobject('User').findOne({ Name: inputUser });
  }
  if (result?.Id) {
    return result.Id;
  } else {
    return undefined;
  }
}

function isValidEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

function isId(input: string): boolean {
  const idRegex = /[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/;
  return idRegex.test(input);
}

export async function getActiveTraceFlag(conn: Connection, userId: string): Promise<TraceFlag | undefined> {
  const results = await conn.tooling.query(
    `SELECT Id, TracedEntityId, DebugLevelId, StartDate, ExpirationDate FROM TraceFlag WHERE TracedEntityId = '${userId}' AND ExpirationDate > ${new Date(
      Date.now()
    ).toISOString()}`
  );
  if (results?.records?.length > 0) {
    return results.records[0] as TraceFlag;
  } else {
    return undefined;
  }
}

export async function getDebugLevels(conn: Connection): Promise<DebugLevel[]> {
  const results = await conn.tooling.query(
    'SELECT Id, DeveloperName, Workflow, Validation, Callout, ApexCode, ApexProfiling, Visualforce, System, Database, Wave, Nba FROM DebugLevel'
  );
  if (results?.records) {
    return results.records as DebugLevel[];
  } else {
    throw new Error('Error to retrieve Debug Levels');
  }
}

export async function createTraceFlag(
  conn: Connection,
  userId: string,
  debugLevelId: string,
  time: number
): Promise<SaveResult> {
  const result = await conn.tooling.sobject('TraceFlag').create({
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

export async function createDebugLevel(
  conn: Connection,
  debugLevel: DebugLevelCreate
): Promise<SaveResult> {
  const result = await conn.tooling.sobject('DebugLevel').create(debugLevel);
  return {
    isSuccess: result.success,
    error: result.success ? undefined : result.errors[0].message,
  };
}

export async function getLogs(conn: Connection, options: GetLogsOptions): Promise<ApexLog[]> {
  const LOG_FIELDS = [
    'Id',
    'LogUser.Username',
    'LogLength',
    'Request',
    'Operation',
    'Application',
    'Status',
    'DurationMilliseconds',
    'SystemModstamp',
    'RequestIdentifier',
  ];
  let queryString = `SELECT ${LOG_FIELDS.join(',')} FROM ApexLog`;

  const whereConditions = [];

  if (options.timeLimit) {
    const dateTime = new Date(Date.now());
    dateTime.setMinutes(dateTime.getMinutes() - options.timeLimit);
    const startTime = dateTime.toISOString();
    if (startTime) {
      whereConditions.push(`SystemModstamp > ${startTime}`);
    }
  }

  if (options.userId) {
    whereConditions.push(`LogUserId = '${options.userId}'`);
  }

  if (whereConditions.length > 0) {
    queryString += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  queryString += ' ORDER BY SystemModstamp DESC';

  if (options.limit) {
    queryString += ` LIMIT ${options.limit.toString()}`;
  }

  const queryResult = await conn.query(queryString);

  return queryResult.records as ApexLog[];
}

export async function deleteLogs(conn: Connection, logs: ApexLog[]): Promise<void> {
  if (logs && logs.length > 0) {
    const ids = logs.map((log) => log.Id).filter((id): id is string => id !== undefined);
    await conn.sobject('ApexLog').del(ids, { allowRecursive: true });
  }
}
