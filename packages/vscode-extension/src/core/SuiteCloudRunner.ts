/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import VSConsoleLogger from '../loggers/VSConsoleLogger';
import { sdkPath } from './sdksetup/SdkProperties';

const CommandActionExecutor = require('@oracle/suitecloud-cli/src/core/CommandActionExecutor');
const CommandOptionsValidator = require('@oracle/suitecloud-cli/src/core/CommandOptionsValidator');
const CLIConfigurationService = require('@oracle/suitecloud-cli/src/core/extensibility/CLIConfigurationService');
const AuthenticationService = require('@oracle/suitecloud-cli/src/services/AuthenticationService');

export default class SuiteCloudRunner {
	private commandActionExecutor: any;

	constructor(executionPath?: string) {
		this.commandActionExecutor = new CommandActionExecutor({
			//THIS SHOULD BE A FACTORY METHOD INSIDE THE CLI CommandActionExecutorFactory.get({executionPath:executionPath})
			executionPath: executionPath,
			commandOptionsValidator: new CommandOptionsValidator(),
			cliConfigurationService: new CLIConfigurationService(),
			commandsMetadataService: CommandsMetadataSingleton.getInstance(),
			log: new VSConsoleLogger(),
			sdkPath: sdkPath,
		});
	}

	run(options: any) {
		options.runInInteractiveMode = false;
		return this.commandActionExecutor.executeAction(options);
	}
}
