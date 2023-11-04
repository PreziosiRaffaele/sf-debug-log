# sf-debug-log

Commands to manage Salesforce debug logs.

Create trace flags for any user in the org selecting the debug level and time.
Retrive Apex logs related to a specific user to analyze them locally.

## Install

```bash
sf plugins install sf-debug-log
```

## Commands

<!-- commands -->

- [`sf trace new`](#sf-trace-new)
- [`sf debug retrieve`](#sf-debug-retrieve)
- [`sf debuglevel new`](#sf-debuglevel-new)

## `sf trace new`

```
USAGE
  $ sf trace new -o <value> [-u <value>] [-t <value>]

FLAGS
  -o, --targetusername=<value>  [required] Username or alias of the target Salesforce org.
  -t, --time=<value> [default: 60] The number of minutes to trace.
  -u, --name=<value> [default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a new trace flag.

  This command is used to create a trace flag for a specific user in the Salesforce org.

EXAMPLES
  sf trace new -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```

## `sf debug retrieve`

```
USAGE
  $  sf debug retrieve -o <value> [-u <value>] [-t <value>] [-d <value>]

FLAGS
  -d, --folder=<value>          [default: .sfdx/tools/debug/logs] The folder where the retrieved log files will be stored.
  -o, --targetusername=<value>  (required) Username or alias of the target Salesforce org.
  -t, --time=<value>            [default: 60] The number of minutes to retrieve log files for.
  -u, --user=<value>            [default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Retrieve Apex log files from the Salesforce platform.

  This command allows you to retrieve Apex log files from a Salesforce org.

EXAMPLES
  sf debug retrieve -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```

## `sf debuglevel new`

```
USAGE
  $ sf debuglevel new -o <value> [-n <value>]

FLAGS
  -o, --targetusername=<value>  [required] Username or alias of the target Salesforce org.
  -n, --name=<value> [required] The developer name of the new DebugLevel.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a new DebugLevel.

  Create a new DebugLevel assigning level for each category.

EXAMPLES
  sf debuglevel new -o DeveloperEdition -n "DebugLevel"
```
