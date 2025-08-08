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
- [`sf trace new`](#sf-trace-new)
- [`sf debug retrieve`](#sf-debug-retrieve)
- [`sf debug delete`](#sf-debug-delete)
- [`sf debuglevel list`](#sf-debuglevel-list)
- [`sf debuglevel new`](#sf-debuglevel-new)

## `sf trace new`

Create a new trace flag.

```
USAGE
  $ sf trace new -o <value> -d <value> [-u <value>] [-t <value>] [-f]

FLAGS
  -d, --debuglevel=<value>      [default: SFDC_DevConsole] The debug level for the trace flag.
  -f, --force                   Force the creation of a new trace flag, even if one already exists for the user.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            [default: 60] The number of minutes to trace.
  -u, --user=<value>            [default: current user] Username, Name, or ID of the user for whom you want to retrieve the logs.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This command is used to create a trace flag for a specific user in the Salesforce org.

EXAMPLES
  sf trace new -o DeveloperEdition -u "Raffaele Preziosi" -t 10 -d "MyDebugLevel"
```

## `sf debug retrieve`

Retrieve Apex log files from the Salesforce platform.

```
USAGE
  $ sf debug retrieve -o <value> [-u <value>] [-t <value>] [-d <value>] [-a]

FLAGS
  -a, --all-users               Retrieve log files for all users.
  -d, --folder=<value>          [default: .sfdx/tools/debug/logs] The folder where the retrieved log files will be stored.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            The number of minutes to retrieve log files for.
  -u, --user=<value>            [default: current user] Username, Name, or ID of the user for whom you want to retrieve the logs.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  sf debug retrieve -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```

## `sf debug delete`

Delete Apex log files from a Salesforce org.

```
USAGE
  $ sf debug delete -o <value> [--json] [-u <value>] [-t <value>] [-a]

FLAGS
  -a, --all-users               Delete log files for all users.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            The number of minutes to retrieve log files for.
  -u, --user=<value>            [default: current user] Username, Name, or ID of the user for whom you want to retrieve the logs.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  sf debug delete -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```

## `sf debuglevel list`

List all DebugLevels in the org.

```
USAGE
  $ sf debuglevel list -o <value>

FLAGS
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  sf debuglevel list -o DeveloperEdition
```

## `sf debuglevel new`

Create a new DebugLevel.

```
USAGE
  $ sf debuglevel new -o <value> [-n <value>]

FLAGS
  -n, --name=<value>            (required) The developer name of the new DebugLevel.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a new DebugLevel assigning level for each category.

EXAMPLES
  sf debuglevel new -o DeveloperEdition -n "DebugLevel"
```


