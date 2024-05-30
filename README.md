> [!WARNING]
> THIS IS A WIP!
# nuMake for VSCode

This is a VSCode extension that integrates [nuMake](https://github.com/juicermv/numake) with VSCode and its [C/C++ extension](https://github.com/microsoft/vscode-cpptools).

## Features and Commands
* nuMake: Refresh
  * Will read your nuMake script and populate the C/C++ extension configurations according to targets.

* nuMake: Select Target
  * Will prompt you to select a target specified in your script twice. Once for building and again for the C/C++ extension.

* nuMake: Build
  * Will build your selected target.

## Configuration

* numake.path
  * The path to your nuMake executable.

* numake.scriptName
  * The name of your script file.
