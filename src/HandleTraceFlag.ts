import { Connection } from '@salesforce/core';
import { SaveResult } from 'jsforce';
import { TraceNewResult } from './commands/trace/new';
const MILLISECONDS_PER_MINUTE = 60000;

export async function createTraceFlag(
  conn: Connection,
  user: string,
  debuglevel: string,
  time: number
): Promise<TraceNewResult> {
  try {
    const [userId, debugLevelId] = await Promise.all([getUserId(conn, user), getDebugLevelId(conn, debuglevel)]);
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
  } catch (err) {
    return {
      isSuccess: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  async function getUserId(connection: Connection, inputUser: string): Promise<string> {
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
      throw new Error(`User ${user} not found`);
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

  async function getDebugLevelId(connection: Connection, debugLevelDeveloperName: string): Promise<string> {
    const result = await connection.tooling.sobject('DebugLevel').findOne({ DeveloperName: debugLevelDeveloperName });
    if (result?.Id) {
      return result.Id;
    } else {
      throw new Error(`DebugLevel ${debuglevel} not found`);
    }
  }
}
