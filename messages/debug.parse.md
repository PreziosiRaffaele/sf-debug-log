# summary

Analyze a Salesforce debug log file.

# description

Parses a Salesforce debug log file to extract execution details. Currently, this command parses the log and outputs the parsed structure to the console for debugging purposes. Future enhancements may include generating and opening an HTML timeline visualization.

# flags.files.summary

Path to the debug log file to analyze.

# error.saveLogs

Failed to process the debug log: %s

# examples

  - Analyze a specific debug log file:
    sf debug analyze --files /path/to/your/debug.log

