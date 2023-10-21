// import { expect } from 'chai';
// import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
// import { Connection } from '@salesforce/core';
// import Retrieve from '../../src/commands/retrieve';

// describe('Retrieve Logs', () => {
//   const $$ = new TestContext();
//   let testOrg = new MockTestOrgData();

//   beforeEach(() => {
//     testOrg = new MockTestOrgData();
//     testOrg.orgId = '00Dxx0000000000';
//   });

//   it('Retrieve Logs', async () => {
//     await $$.stubAuths(testOrg);

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//     $$.SANDBOX.stub(Connection.prototype, 'query').callsFake(async () => ({
//       records: [
//         {
//           Id: '07Lxx0000000000',
//           Application: 'Salesforce1 for Android',
//           DurationMilliseconds: 0,
//           Location: 'N/A',
//           LogLength: 0,
//           LogUser: {
//             Id: '005xx0000000000',
//             Name: 'Raffaele Preziosi',
//           },
//           Operation: 'API',
//           Request: 'API',
//           StartTime: '2020-05-14T14:05:00.000+0000',
//           Status: 'Success',
//         },
//       ],
//     })
//     );
//     const result = await Retrieve.run(['--targetusername', testOrg.username, '--user', 'Raffaele Preziosi']);
//     expect(result.isSuccess).to.equal(true);
//   });
// });
