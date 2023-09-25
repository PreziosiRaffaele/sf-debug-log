import { expect } from 'chai';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { Connection } from '@salesforce/core';
import TraceNew from '../../../src/commands/trace/new';

describe('New Trace Flags', () => {
  const $$ = new TestContext();
  let testOrg = new MockTestOrgData();

  beforeEach(() => {
    testOrg = new MockTestOrgData();
    testOrg.orgId = '00Dxx0000000000';
    // Stub the ux methods on SfCommand so that you don't get any command output in your tests.
    // You can also make assertions on the ux methods to ensure that they are called with the
    // correct arguments.
  });

  it('create User Trace Flag', async () => {
    await $$.stubAuths(testOrg);

    $$.SANDBOX.stub(Connection.prototype, 'tooling').get(() => ({
      sobject: () => ({
        create: () => ({
          success: true,
          errors: [],
        }),
        findOne: () => ({
          Id: '00Dxx0000000000',
        }),
      }),
    }));

    const result = await TraceNew.run(['--targetusername', testOrg.username, '--user', 'Raffaele Preziosi']);
    expect(result.isSuccess).to.equal(true);
  });
});
