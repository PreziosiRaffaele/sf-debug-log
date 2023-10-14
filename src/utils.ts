import { dirname } from 'path';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs';
import { Connection } from '@salesforce/core';

const mkdirPromise = promisify(mkdir);
const writeFilePromise = promisify(writeFile);

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
