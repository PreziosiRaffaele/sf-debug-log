# summary

Retrieve Apex log files from the Salesforce platform.

# description

This command allows you to retrieve Apex log files from a Salesforce org. If you don't specify `--folder`, the selected logs are streamed to stdout either as raw text or as NDJSON.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.time.summary

Retrieve logs created in the last specified number of minutes.

# flags.limit.summary

The max number of log files to retrieve.

# flags.where.summary

WHERE clause used to filter `ApexLog` records to retrieve. This flag can't be used with `--user`, `--time`, or `--all-users`.

# flags.folder.summary

The folder where the retrieved log files will be stored. If omitted, the selected logs are streamed to stdout.

# flags.output-format.summary

How to write logs to stdout when `--folder` is omitted. Use `text` for raw log content or `ndjson` for one JSON object per log.

# flags.all-users.summary

Retrieve logs for all users in the org.

# flags.api-version.summary

API version to use. 

# error.saveLogs

Failed to save logs: %s.

# examples

sf debug retrieve -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10
sf debug retrieve -o MyDeveloperEdition -w "Operation = 'ApexTestHandler'" -l 1 | rg "EXCEPTION"
sf debug retrieve -o MyDeveloperEdition -w "Operation = 'ApexTestHandler'" -l 1 --output-format ndjson
