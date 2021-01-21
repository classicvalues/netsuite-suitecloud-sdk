/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { window, QuickPickItem } from 'vscode';
import { COMMAND, DEPLOY, YES, NO } from '../service/TranslationKeys';
import { actionResultStatus, ApplicationConstants, ProjectInfoServive, CLIConfigurationService } from '../util/ExtensionUtil';
import BaseAction from './BaseAction';
import { EOL } from 'os';

const DEPLOY_COMMAND = {
	NAME: 'project:deploy',
	OPTIONS: {
		ACCOUNT_SPECIFIC_VALUES: 'accountspecificvalues',
	},
	FLAGS: {
		// TODO: change value when new applyinstallationpreferences is integrated in cli
		APPLY_INSTALLATION_PREFS: 'applycontentprotection',
	},
};

const ACCOUNT_SPECIFIC_VALUES = {
	ERROR: 'ERROR',
	WARNING: 'WARNING',
};

interface commandOption extends QuickPickItem {
	value: string;
}

export default class Deploy extends BaseAction {
	constructor() {
		super(DEPLOY_COMMAND.NAME);
	}

	protected async execute() {
		let projectType: string;

		try {
			projectType = this.getProjectType();
		} catch (error) {
			// if error is of "type" CLIException it will have getErrorMessage(), if not just use toString()
			const errorMessage = typeof error.getErrorMessage === 'function' ? error.getErrorMessage() : error.toString();
			this.vsConsoleLogger.error(errorMessage + EOL);
			this.messageService.showCommandError();
			return;
		}

		const deployOptions: { [key: string]: string } = {};

		if (projectType === ApplicationConstants.PROJECT_ACP) {
			const selection = await this.getAccountSpecificValuesOption();
			if (selection === undefined) return;
			deployOptions[DEPLOY_COMMAND.OPTIONS.ACCOUNT_SPECIFIC_VALUES] = selection;
		} else if (projectType === ApplicationConstants.PROJECT_SUITEAPP) {
			const selection = await this.getApplyInstallationPrefsOption();
			if (selection === undefined) return;
			deployOptions[DEPLOY_COMMAND.FLAGS.APPLY_INSTALLATION_PREFS] = selection;
		} else {
			// it should had failed before at catch block
			throw 'Unexpected error while reading manifest.xml';
		}

		const commandActionPromise = this.runSuiteCloudCommand(deployOptions);
		const commandMessage = this.translationService.getMessage(COMMAND.TRIGGERED, this.translationService.getMessage(DEPLOY.COMMAND));
		const statusBarMessage: string = this.translationService.getMessage(DEPLOY.DEPLOYING);
		this.messageService.showInformationMessage(commandMessage, statusBarMessage, commandActionPromise);

		const actionResult = await commandActionPromise;
		if (actionResult.status === actionResultStatus.SUCCESS) {
			this.messageService.showCommandInfo();
		} else {
			this.messageService.showCommandError();
		}
	}

	private getProjectType(): string {
		const cliConfigurationService = new CLIConfigurationService();
		cliConfigurationService.initialize(this.executionPath);
		const projectFolder: string = cliConfigurationService.getProjectFolder(DEPLOY_COMMAND.NAME);
		const projectInfoService = new ProjectInfoServive(projectFolder);

		return projectInfoService.getProjectType();
	}

	private async getAccountSpecificValuesOption(): Promise<string | undefined> {
		const ASVOptions: commandOption[] = [
			{
				label: this.translationService.getMessage(DEPLOY.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.CANCEL_PROCESS),
				value: ACCOUNT_SPECIFIC_VALUES.ERROR,
				picked: true,
			},
			{
				label: this.translationService.getMessage(DEPLOY.QUESTIONS_CHOICES.ACCOUNT_SPECIFIC_VALUES.DISPLAY_WARNING),
				value: ACCOUNT_SPECIFIC_VALUES.WARNING,
			},
		];
		const selection = await window.showQuickPick(ASVOptions, {
			placeHolder: this.translationService.getMessage(DEPLOY.QUESTIONS.ACCOUNT_SPECIFIC_VALUES),
			canPickMany: false,
		});

		return selection ? selection.value : undefined;
	}

	private async getApplyInstallationPrefsOption(): Promise<string | undefined> {
		const applyInstallPrefsOptions: commandOption[] = [
			{
				label: this.translationService.getMessage(NO),
				value: '',
				picked: true,
			},
			{
				label: this.translationService.getMessage(YES),
				value: 'any non falsy string',
			},
		];
		const selection = await window.showQuickPick(applyInstallPrefsOptions, {
			placeHolder: this.translationService.getMessage(DEPLOY.QUESTIONS.APPLY_INSTALLATION_PREFERENCES),
			ignoreFocusOut: true,
			canPickMany: false,
		});

		return selection ? selection.value : undefined;
	}
}
