# summary

Retrieve Apex log files from the Salesforce platform.

# description

This command allows you to retrieve Apex log files from a Salesforce org.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.time.summary

The number of minutes to retrieve log files for.

# flags.folder.summary

The folder where the retrieved log files will be stored.

# flags.all-users.summary

Retrieve logs for all users in the org.

# error.saveLogs

Failed to save logs: %s.

# examples

sf debug retrieve -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10
