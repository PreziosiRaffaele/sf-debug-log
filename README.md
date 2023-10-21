# sf-debug-log

Commands to manage Salesforce debug logs.

## Install

```bash
sf plugins install sf-debug-log
```

## Commands

<!-- commands -->

- [`sf trace new`](#sf-trace-new)
- [`sf debug retrieve`](#sf-debug-retrieve)

## `sf trace new`

Create a new trace flag.

```
USAGE
  $ sf trace new

FLAGS
  -o, --targetusername=<value>  [required] A username or alias for the target org.
  -u, --name=<value> The name of the user to trace.
  -t, --time=<value> [default: 60] The number of minutes to trace.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a new trace flag.

EXAMPLES
  sf trace new -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```

## `sf debug retrieve`

Retrieve apex log files.

```
USAGE
  $ sf debug retrieve

FLAGS
  -o, --targetusername=<value>  [required] A username or alias for the target org.
  -u, --name=<value> The name of the user to trace.
  -t, --time=<value> [default: 60] Minutes to retrieve logs for.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Retrieves apex log files from the Salesforce platform.

EXAMPLES
  sf debug retrieve -o DeveloperEdition -u "Raffaele Preziosi" -t 10
```
