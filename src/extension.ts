// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import 'child_process';
import { extensions } from 'vscode';
import { exec } from 'child_process';
import { Interface } from 'mocha';

interface NuMakeJSON {
	workspace: string,
	working_directory: string,
	output: string | null,
	toolset_compiler: string | null,
	toolset_linker: string | null,
	targets: { [name: string]: { [type: string]: NuMakeTarget } }
}

interface NuMakeTarget {
	name: string
	defines: string[],
	include_paths: string[]
}


interface CCPPConfiguration {
	configurations: CCPPConfigurationItem[]
}

interface CCPPConfigurationItem {
	name: string,
	includePath: string[],
	defines: string[]
}

let nuMakePath: string | undefined;
let nuMakeScript: string;
let nuMakeConfig: NuMakeJSON | undefined;
let nuMakeTargets: string[] = [];

let selectedTarget: string;

function inspect() {
	if (nuMakePath === undefined) {
		vscode.window.showErrorMessage("NuMake executable not provided!");
		return;
	}

	if (vscode.workspace.workspaceFolders === undefined) { return; }

	exec(nuMakePath + ' inspect -w ' + ' "' + vscode.workspace.workspaceFolders[0].uri.fsPath + '"' + ' -f' + ' "' + nuMakeScript + '" -q', async (err, stdout, stderr) => {
		if (err !== null) {
			vscode.window.showErrorMessage("Error executing NuMake!");
			console.error(err);
		} else {
			//console.log(stdout);
			nuMakeConfig = JSON.parse(stdout);
			console.log(nuMakeConfig);
			let c_cpp_config: CCPPConfiguration = {configurations:[]};
			for (const targetName in nuMakeConfig?.targets) {
				for (const targetType in nuMakeConfig?.targets[targetName]){
					let target = nuMakeConfig?.targets[targetName][targetType];

					let newConfig: CCPPConfigurationItem = {
						name: target.name,
						includePath: target.include_paths,
						defines: target.defines
					};

					c_cpp_config.configurations.push(newConfig);
				}
			}

			if (vscode.workspace.workspaceFolders === undefined) { return; }
			vscode.workspace.fs.writeFile(
				vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ".vscode", "c_cpp_properties.json"),
				Buffer.from(JSON.stringify(c_cpp_config))
			);
		}
	});
}

function selectTarget(name: string) {
	console.log(name);
	if (name !in nuMakeTargets) {
		vscode.window.showErrorMessage("NuMake target '" + name + "' not found!");
		return;
	}

	for (const key in nuMakeConfig?.targets[name]) {
		let target = nuMakeConfig.targets[name][key];
		
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	nuMakePath = vscode.workspace.getConfiguration().get("numake.path");
	nuMakeScript = vscode.workspace.getConfiguration().get("numake.scriptName", "project.lua");


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "numake" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let numakeRefresh = vscode.commands.registerCommand('numake.refresh', () => {
		inspect();
	});

	/*let numakeSelectTarget = vscode.commands.registerCommand("numake.selectTarget", async () => {
		console.log(nuMakeTargets);
		const selection = await vscode.window.showQuickPick(nuMakeTargets, { canPickMany: false });
		if (selection !== undefined) {
			selectTarget(selection);
		}
	});*/

	context.subscriptions.push(numakeRefresh);
	//context.subscriptions.push(numakeSelectTarget)
}

// This method is called when your extension is deactivated
export function deactivate() { }
