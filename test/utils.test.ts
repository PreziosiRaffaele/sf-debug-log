import { expect } from 'chai';
import { rewriteApexLogQueryFields, getLogs } from '../src/utils';

const rewriteQueryFields = rewriteApexLogQueryFields as (query: string, fields: string[]) => string;
const runGetLogs = getLogs as (
  conn: { query: (query: string) => Promise<{ records: never[] }> },
  options: { query: string; limit: number }
) => Promise<unknown>;

describe('utils', () => {
  describe('rewriteApexLogQueryFields', () => {
    it('replaces the select list of an ApexLog query', () => {
      const query = "SELECT Id FROM ApexLog WHERE Operation = 'ExecuteAnonymous'";
      const requiredFields: string[] = ['Id', 'Request', 'Operation', 'LastModifiedDate', 'Status'];

      const result: string = rewriteQueryFields(query, requiredFields);

      expect(result).to.equal(
        "SELECT Id, Request, Operation, LastModifiedDate, Status FROM ApexLog WHERE Operation = 'ExecuteAnonymous'"
      );
    });

    it('ignores fields already provided by the user and uses the provided field list', () => {
      const query =
        'SELECT Id, Foo__c, Bar__c FROM ApexLog ORDER BY LastModifiedDate DESC';
      const requiredFields: string[] = ['Id', 'Request', 'Operation', 'LastModifiedDate', 'Status'];

      const result: string = rewriteQueryFields(query, requiredFields);

      expect(result).to.equal(
        'SELECT Id, Request, Operation, LastModifiedDate, Status FROM ApexLog ORDER BY LastModifiedDate DESC'
      );
    });
  });

  describe('getLogs', () => {
    it('preserves a custom query without appending a CLI limit', async () => {
      let executedQuery = '';
      const conn: { query: (query: string) => Promise<{ records: never[] }> } = {
        query: async (query: string) => {
          executedQuery = query;
          return { records: [] };
        },
      };

      await runGetLogs(conn, {
        query: "SELECT Id FROM ApexLog WHERE Operation = 'API'",
        limit: 5,
      });

      expect(executedQuery).to.equal(
        "SELECT Id, Request, Operation, LastModifiedDate, Status FROM ApexLog WHERE Operation = 'API'"
      );
    });
  });
});
