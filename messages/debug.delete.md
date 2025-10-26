# summary

Delete Apex log files from a Salesforce org.

# description

Deletes Apex log files from a Salesforce org.

# flags.api-version.summary

API version to use.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to delete the logs.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.time.summary

Delete logs older than the specified number of minutes.

# flags.all-users.summary

Retrieve logs for all users in the org.

# error.deleteLogs

Failed to delete logs: %s.

# examples

sf debug delete -u "Raffaele Preziosi" -t 60
