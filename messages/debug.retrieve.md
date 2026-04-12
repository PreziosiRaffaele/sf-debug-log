# summary

Retrieve Apex log files from the Salesforce platform.

# description

This command allows you to retrieve Apex log files from a Salesforce org. If you don't specify `--folder`, the log contents are streamed to stdout.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.time.summary

Retrieve logs created in the last specified number of minutes.

# flags.limit.summary

The max number of log files to retrieve.

# flags.query.summary

SOQL query used to select `ApexLog` records to retrieve. This flag can't be used with `--user`, `--time`, `--limit`, or `--all-users`.

# flags.folder.summary

The folder where the retrieved log files will be stored. If omitted, the selected logs are streamed to stdout.

# flags.all-users.summary

Retrieve logs for all users in the org.

# flags.api-version.summary

API version to use. 

# error.saveLogs

Failed to save logs: %s.

# examples

sf debug retrieve -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10
sf debug retrieve -o MyDeveloperEdition -q "SELECT Id FROM ApexLog ORDER BY SystemModstamp DESC LIMIT 1" | rg "EXCEPTION"
