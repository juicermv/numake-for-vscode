// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import 'child_process';
import { extensions } from 'vscode';
import { exec } from 'child_process';
import { Interface } from 'mocha';
import { Console } from 'console';

interface NuMakeJSON {
	workspace: string;
	working_directory: string;
	output: string | null;
	toolset_compiler: string | null;
	toolset_linker: string | null;
	targets: { [name: string]: NuMakeTarget };
}

interface NuMakeTarget {
	name: string;
	defines: string[];
	include_paths: string[];
	vscode_properties: NuMakeTargetVSCodeProperties;
}

interface NuMakeTargetVSCodeProperties {
	compiler_path: string;
	default_includes: string[];
	intellisense_mode: string;
}

interface CCPPConfiguration {
	configurations: CCPPConfigurationItem[];
}

interface CCPPConfigurationItem {
	name: string;
	includePath: string[];
	defines: string[];
	compilerPath: string;
	intelliSenseMode: string;
}

let nuMakePath: string | undefined;
let nuMakeScript: string;
let nuMakeConfig: NuMakeJSON | undefined;

let targets: string[];
let selectedTarget: string | undefined;

let output: vscode.OutputChannel;

async function select() {
	inspect(async (targets) => {
		if (targets.length > 0) {
			selectedTarget = await vscode.window.showQuickPick(targets, {
				canPickMany: false,
			});

			await vscode.commands.executeCommand('C_Cpp.ConfigurationSelect', [
				selectedTarget,
			]);
		} else {
			vscode.window.showWarningMessage('No targets were found!');
		}
	});
}

async function build() {
	inspect()
	while (selectedTarget === undefined || !targets.includes(selectedTarget)) {
		await select();
	}

	if (nuMakePath === undefined) {
		vscode.window.showErrorMessage('nuMake executable path not provided!');
		return;
	}

	if (vscode.workspace.workspaceFolders === undefined) {
		return;
	}

	const command =
		nuMakePath +
		' build ' +
		selectedTarget +
		' -w "' +
		vscode.workspace.workspaceFolders[0].uri.fsPath +
		'"' +
		' -f' +
		' "' +
		nuMakeScript +
		'"';

	const terminal = vscode.window.createTerminal('nuMake Build: ' + selectedTarget);
	terminal.sendText(command, true)
	terminal.show()
}

function inspect(
	callback: ((targets: string[]) => void) | undefined = undefined
) {
	if (nuMakePath === undefined) {
		vscode.window.showErrorMessage('nuMake executable path not provided!');
		return;
	}

	if (vscode.workspace.workspaceFolders === undefined) {
		return;
	}

	targets = [];

	exec(
		nuMakePath +
			' inspect -w ' +
			' "' +
			vscode.workspace.workspaceFolders[0].uri.fsPath +
			'"' +
			' -f' +
			' "' +
			nuMakeScript +
			'" -q',
		(err, stdout, stderr) => {
			if (err !== null) {
				vscode.window.showErrorMessage('Error executing nuMake!');
				console.error(err);
			} else {
				//console.log(stdout);
				nuMakeConfig = JSON.parse(stdout);
				console.log(nuMakeConfig);
				let c_cpp_config: CCPPConfiguration = { configurations: [] };
				for (const targetName in nuMakeConfig?.targets) {
					targets.push(targetName);
					let target = nuMakeConfig.targets[targetName];

					let newConfig: CCPPConfigurationItem = {
						name: target.name,
						includePath:
							target.vscode_properties.default_includes.concat(
								target.include_paths
							),
						defines: target.defines,
						compilerPath: target.vscode_properties.compiler_path,
						intelliSenseMode:
							target.vscode_properties.intellisense_mode,
					};

					c_cpp_config.configurations.push(newConfig);
				}

				if (vscode.workspace.workspaceFolders === undefined) {
					return;
				}
				vscode.workspace.fs.writeFile(
					vscode.Uri.joinPath(
						vscode.workspace.workspaceFolders[0].uri,
						'.vscode',
						'c_cpp_properties.json'
					),
					Buffer.from(JSON.stringify(c_cpp_config))
				);

				if (callback !== undefined) {
					callback(targets);
				}
			}
		}
	);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	output = vscode.window.createOutputChannel('nuMake');

	nuMakePath = vscode.workspace.getConfiguration().get('numake.path');
	nuMakeScript = vscode.workspace
		.getConfiguration()
		.get('numake.scriptName', 'project.lua');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "numake" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let numakeRefresh = vscode.commands.registerCommand(
		'numake.refresh',
		() => {
			inspect();
		}
	);

	let numakeSelectTarget = vscode.commands.registerCommand(
		'numake.selectTarget',
		async () => {
			await select();
		}
	);

	let numakeBuild = vscode.commands.registerCommand(
		'numake.build',
		async () => {
			await build();
		}
	);

	context.subscriptions.push(numakeRefresh);
	context.subscriptions.push(numakeSelectTarget);
	context.subscriptions.push(numakeBuild);
}

// This method is called when your extension is deactivated
export function deactivate() {}
