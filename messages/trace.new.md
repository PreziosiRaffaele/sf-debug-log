# summary

Create a trace flag for a user.

# description

This command is used to create a trace flag for a specific user in the Salesforce org.

# flags.targetusername.summary

Username or alias of the target Salesforce org.

# flags.user.summary

[default: targetusername] Username, Name, or ID of the user for whom you want to retrieve the logs.

# flags.time.summary

The time for the trace flag.

# error.createTraceFlag

Create User Trace Flag failed: %s.

# examples

sf trace new -o MyDeveloperEdition -u "Raffaele Preziosi" -t 10
