# sf-debug-log

A Salesforce CLI plugin to make managing debug logs easier.

I built this because I found the official `sf` CLI was missing some commands I regularly need. For example, I wanted to put a specific user under debug and retrieve only their logs, delete logs more easily, or set a new debug level from the command line. This plugin adds those missing pieces and more to make debugging faster.

## Features

*   Create trace flags for any user in the org, selecting the debug level and time.
*   List all debug levels in the org.
*   Retrieve Apex logs for a specific user or all users in the org.
*   Delete Apex logs for a specific user or all users in the org.

## Install

```bash
sf plugins install sf-debug-log
```

## Commands
<!-- commands -->
* [`sf debug delete`](#sf-debug-delete)
* [`sf debug retrieve`](#sf-debug-retrieve)
* [`sf debuglevel list`](#sf-debuglevel-list)
* [`sf debuglevel new`](#sf-debuglevel-new)
* [`sf trace new`](#sf-trace-new)

## `sf debug delete`

Delete Apex log files from a Salesforce org.

```
USAGE
  $ sf debug delete -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-u <value>] [-t <value>]
    [-a]

FLAGS
  -a, --all-users               Retrieve logs for all users in the org.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            Delete logs older than the specified number of minutes.
  -u, --user=<value>            [default: targetusername] Username, Name, or ID of the user for whom you want to delete
                                the logs.
      --api-version=<value>     API version to use.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Delete Apex log files from a Salesforce org.

  Deletes Apex log files from a Salesforce org.

EXAMPLES
  $ sf debug delete -u "Raffaele Preziosi" -t 60

FLAG DESCRIPTIONS
  --api-version=<value>  API version to use.

    Override the api version used for api requests made by this command
```

## `sf debug retrieve`

Retrieve Apex log files from the Salesforce platform.

```
USAGE
  $ sf debug retrieve -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-u <value> | -a] [-t
    <value>] [-l <value> | -q <value>] [-d <value>] [--output-format text|ndjson]

FLAGS
  -a, --all-users               Retrieve logs for all users in the org.
  -d, --folder=<value>          The folder where the retrieved log files will be stored. If omitted, the selected logs
                                are streamed to stdout.
  -l, --limit=<value>           [default: 100] The max number of log files to retrieve. This flag can't be used with
                                `--query`.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -q, --query=<value>           Full SOQL query used to select `ApexLog` records to retrieve. This flag can't be used
                                with `--user`, `--time`, `--all-users`, or `--limit`. The command always replaces the
                                query `SELECT` list with the fields it needs.
  -t, --time=<value>            Retrieve logs created in the last specified number of minutes.
  -u, --user=<value>            [default: targetusername] Username, Name, or ID of the user for whom you want to
                                retrieve the logs.
      --api-version=<value>     API version to use.
      --output-format=<option>  [default: text] How to write logs to stdout when `--folder` is omitted. Use `text` for
                                raw log content or `ndjson` for one JSON object per log.
                                <options: text|ndjson>

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Retrieve Apex log files from the Salesforce platform.

  This command allows you to retrieve Apex log files from a Salesforce org. If you don't specify `--folder`, the
  selected logs are streamed to stdout either as raw text or as NDJSON.

EXAMPLES
  $ sf debug retrieve -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10
  $ sf debug retrieve -o MyDeveloperEdition -q "SELECT Id FROM ApexLog WHERE Operation = 'ApexTestHandler' ORDER BY SystemModstamp DESC LIMIT 1" | rg "EXCEPTION"
  $ sf debug retrieve -o MyDeveloperEdition -q "SELECT Id FROM ApexLog WHERE Operation = 'ApexTestHandler' ORDER BY SystemModstamp DESC LIMIT 1" --output-format ndjson

FLAG DESCRIPTIONS
  --api-version=<value>  API version to use.

    Override the api version used for api requests made by this command
```

## `sf debuglevel list`

List the debug levels in your org.

```
USAGE
  $ sf debuglevel list -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
      --api-version=<value>     API version to use.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  List the debug levels in your org.

  List the debug levels in your org.

EXAMPLES
  $ sf debuglevel list -o MyDeveloperEdition

FLAG DESCRIPTIONS
  --api-version=<value>  API version to use.

    Override the api version used for api requests made by this command
```

## `sf debuglevel new`

Create a new DebugLevel.

```
USAGE
  $ sf debuglevel new -o <value> -n <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -n, --developername=<value>   (required) The developer name of the new DebugLevel.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
      --api-version=<value>     API version to use.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a new DebugLevel.

  Create a new DebugLevel assigning level for each category.

EXAMPLES
  $ sf debuglevel new

FLAG DESCRIPTIONS
  --api-version=<value>  API version to use.

    Override the api version used for api requests made by this command
```

## `sf trace new`

Create a trace flag for a user.

```
USAGE
  $ sf trace new -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-u <value>] [-t <value>]
    [-f] [-d <value>]

FLAGS
  -d, --debuglevel=<value>      The debug level for the trace flag.
  -f, --force                   Force the creation of the trace flag.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            [default: 60] The time for the trace flag.
  -u, --user=<value>            [default: targetusername] Username, Name, or ID of the user for whom you want to
                                retrieve the logs.
      --api-version=<value>     API version to use.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  $ sf trace new -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10

FLAG DESCRIPTIONS
  --api-version=<value>  API version to use.

    Override the api version used for api requests made by this command
```
<!-- commandsstop -->
DESCRIPTION
  Create a new DebugLevel assigning level for each category.

EXAMPLES
  sf debuglevel new -o DeveloperEdition -n "DebugLevel"
```
