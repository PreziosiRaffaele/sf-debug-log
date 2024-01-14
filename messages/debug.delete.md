# summary

Delete Apex log files from a Salesforce org.

# description

Deletes Apex log files from a Salesforce org.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to delete the logs.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.time.summary

The number of minutes to retrieve log files for.

# flags.all.summary

Delete log files for all users.

# error.deleteLogs

Failed to delete logs: %s.

# examples

sf debug delete -u "Raffaele Preziosi" -t 60
