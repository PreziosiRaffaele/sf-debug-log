// import { expect } from 'chai';
// import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
// import { Connection } from '@salesforce/core';
// import sinon = require('sinon');
// import TraceNew from '../../../src/commands/trace/new';

// describe('New Trace Flags', () => {
//   const $$ = new TestContext();
//   let testOrg = new MockTestOrgData();

//   beforeEach(() => {
//     testOrg = new MockTestOrgData();
//     testOrg.orgId = '00Dxx0000000000';
//   });

//   it('create User Trace Flag', async () => {
//     await $$.stubAuths(testOrg);
//     sinon.stub(Connection.prototype, 'query').callsFake(async () =>
//       // @ts-expect-error we all know this is not the full type
//       Promise.resolve({
//         totalSize: 1,
//         done: true,
//         records: [
//           {
//             DeveloperName: 'USER_DEBUG',
//             Id: '7dlxx0000000000',
//           },
//         ],
//       })
//     );
//     const result = await TraceNew.run(['--targetusername', testOrg.username, '--user', 'Raffaele Preziosi']);
//     expect(result.isSuccess).to.equal(true);
//   });
// });
