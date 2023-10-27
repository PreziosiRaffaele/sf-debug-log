import { dirname } from 'path';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs';
import { Connection } from '@salesforce/core';
import { SaveResult, Record } from 'jsforce';
import { TraceNewResult } from './commands/trace/new';

const mkdirPromise = promisify(mkdir);
const writeFilePromise = promisify(writeFile);

const MILLISECONDS_PER_MINUTE = 60000;

export async function createFile(path: string, contents: string): Promise<void> {
  await mkdirPromise(dirname(path), { recursive: true });
  await writeFilePromise(path, contents);
}

export async function getUserId(connection: Connection, inputUser: string): Promise<string> {
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
    throw new Error(`User ${inputUser} not found`);
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

export async function getActiveTraceFlag(conn: Connection, userId: string): Promise<Record | undefined> {
  const results = await conn.tooling.query(
    `SELECT Id, TracedEntityId, DebugLevelId, StartDate, ExpirationDate FROM TraceFlag WHERE TracedEntityId = '${userId}' AND ExpirationDate > ${new Date(
      Date.now()
    ).toISOString()}`
  );
  if (results?.records?.length > 0) {
    return results.records[0];
  } else {
    return undefined;
  }
}

export async function getDebugLevels(conn: Connection): Promise<Record[]> {
  const results = await conn.tooling.query(
    'SELECT Id, DeveloperName, Workflow, Validation, Callout, ApexCode, ApexProfiling, Visualforce, System, Database, Wave, Nba FROM DebugLevel'
  );
  if (results?.records) {
    return results.records;
  } else {
    throw new Error('Error to retrieve Debug Levels');
  }
}

export async function createTraceFlag(
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
