/**
 * derived from https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/schematics_cli/bin/schematics.ts
 */

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import chalk from 'chalk';
import { ProcessOutput, createConsoleLogger } from '@angular-devkit/core/node';
import { logging, schema } from '@angular-devkit/core';
import * as inquirer from 'inquirer';
import { Rule, UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';
import path from 'path';
const colors = new chalk.Instance({ level: 3 });



export interface IRuleOptions {
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
    interactive: boolean
    cwd: string;
    mode: 'rw' | 'ro';
}

export interface ISchematicOptions extends IRuleOptions {
    allowPrivate: boolean;
}



export class RuleRunner {
    public static create(options?: Partial<IRuleOptions>): RuleRunner {
        const runner = SchematicRunner.create(path.resolve(__dirname, '../../../../run-rules'), options);
        return new RuleRunner(runner, options);
    }
    private constructor(
        private readonly _runner: SchematicRunner,
        private readonly _options: Partial<IRuleOptions> = {}
    ) { }

    public execute(rules: Rule[]): Promise<boolean> {
        return this._runner.execute({rules});;
    }
}

export class ContextIsReadonlyError extends Error {}

export class SchematicRunner {
    public static create(path: string, options?: Partial<ISchematicOptions>): SchematicRunner {
        return new SchematicRunner(path, options);
    }


    private readonly _collectionName: string;
    private readonly _schematicName: string;
    private readonly _options: ISchematicOptions;
    private readonly _logger: logging.Logger;

    private constructor(
        private readonly _path: string,
        options: Partial<ISchematicOptions> = {}
    ) {
        options = { ...options };
        options.dryRun ??= false;
        options.force ??= options.dryRun;
        options.verbose ??= false;
        options.interactive ??= true;
        options.cwd ??= process.cwd();
        options.mode ??= 'rw';
        this._options = options as ISchematicOptions;

        this._collectionName = path.dirname(_path);
        this._schematicName = path.basename(_path);
        this._logger = createConsoleLogger(options?.verbose, process.stdout, process.stderr, {
            info: s => s,
            debug: s => s,
            warn: s => colors.bold.yellow(s),
            error: s => colors.bold.red(s),
            fatal: s => colors.bold.red(s),
        });
    }

    public execute(options: object): Promise<boolean> {
        return this.createWorkflowRun()(options);
    }

    private createWorkflowRun(): (options: any) => Promise<boolean> {
        let nothingDone = true;
        let error = false;
        let loggingQueue: string[] = [];

        const { cwd, force, dryRun, interactive, allowPrivate } = this._options;

        const workflow = new NodeWorkflow(cwd, {
            force,
            dryRun,
            resolvePaths: [cwd, __dirname],
            schemaValidation: true
        });
        
        workflow.reporter.subscribe((event) => {
            nothingDone = false;
            if(this._options.mode === 'ro'){
                throw new Error('Context is readonly');
            }
            // Strip leading slash to prevent confusion.
            const eventPath = event.path.startsWith('/') ? event.path.substr(1) : event.path;
            switch (event.kind) {
                case 'error':
                    error = true;
                    const desc = event.description === 'alreadyExist' ? 'already exists' : 'does not exist';
                    this._logger.error(`ERROR! ${eventPath} ${desc}.`);
                    break;
                case 'update':
                    loggingQueue.push(`${colors.cyan('UPDATE')} ${eventPath} (${event.content.length} bytes)`);
                    break;
                case 'create':
                    loggingQueue.push(`${colors.green('CREATE')} ${eventPath} (${event.content.length} bytes)`);
                    break;
                case 'delete':
                    loggingQueue.push(`${colors.yellow('DELETE')} ${eventPath}`);
                    break;
                case 'rename':
                    const eventToPath = event.to.startsWith('/') ? event.to.substr(1) : event.to;
                    loggingQueue.push(`${colors.blue('RENAME')} ${eventPath} => ${eventToPath}`);
                    break;
            }
        });

        /**
         * Listen to lifecycle events of the workflow to flush the logs between each phases.
         */
        workflow.lifeCycle.subscribe(event => {
            if (event.kind === 'workflow-end' || event.kind === 'post-tasks-start') {
                if (!error) {
                    // Flush the log queue and clean the error state.
                    loggingQueue.forEach(log => this._logger.info(log));
                }
                loggingQueue = [];
                error = false;
            }
        });

        // Show usage of deprecated options
        workflow.registry.useXDeprecatedProvider(msg => this._logger.warn(msg));

        // Add prompts.
        if (interactive !== false && isTTY()) {
            workflow.registry.usePromptProvider(_createPromptProvider());
        }

        return async (options: any) => {
            /**
             *  Execute the workflow, which will report the dry run events, run the tasks, and complete
             *  after all is done.
             *
             *  The Observable returned will properly cancel the workflow if unsubscribed, error out if ANY
             *  step of the workflow failed (sink or task), with details included, and will only complete
             *  when everything is done.
             */
            options = {
                ...this._options,
                ...options
            }
            try {
                await workflow.execute({
                    collection: this._collectionName,
                    schematic: this._schematicName,
                    options,
                    allowPrivate: allowPrivate,
                    debug: false,
                    logger: this._logger,
                }).toPromise();
                if (nothingDone && this._options.mode === 'rw') {
                    this._logger.info(colors.gray('Nothing to be done.'));
                }

                if (!nothingDone && this._options.mode === 'rw' && this._options.dryRun) {
                    this._logger.info(colors.yellow('Dry run: no changes where made.'))
                }

                return !nothingDone;
            } catch (err) {
                if (err instanceof UnsuccessfulWorkflowExecution) {
                    // "See above" because we already printed the error.
                    this._logger.fatal('The Schematic workflow failed. See above.');
                } else {
                    this._logger.fatal(err.stack || err.message);
                }

                throw err;
            }
        }
    }
}


function isTTY(): boolean {
    const isTruthy = (value: undefined | string) => {
        // Returns true if value is a string that is anything but 0 or false.
        return value !== undefined && value !== '0' && value.toUpperCase() !== 'FALSE';
    };

    // If we force TTY, we always return true.
    const force = process.env['NG_FORCE_TTY'];
    if (force !== undefined) {
        return isTruthy(force);
    }

    return !!process.stdout.isTTY && !isTruthy(process.env['CI']);
}


function _createPromptProvider(): schema.PromptProvider {
    return (definitions) => {
        const questions: inquirer.QuestionCollection = definitions.map(definition => {
            const question: inquirer.Question = {
                name: definition.id,
                message: definition.message,
                default: definition.default,
            };

            const validator = definition.validator;
            if (validator) {
                question.validate = input => validator(input);
            }

            switch (definition.type) {
                case 'confirmation':
                    return { ...question, type: 'confirm' };
                case 'list':
                    return {
                        ...question,
                        type: definition.multiselect ? 'checkbox' : 'list',
                        choices: definition.items && definition.items.map(item => {
                            if (typeof item === 'string') {
                                return item;
                            } else {
                                return {
                                    name: item.label,
                                    value: item.value,
                                };
                            }
                        }),
                    };
                default:
                    return { ...question, type: definition.type };
            }
        });

        return inquirer.prompt(questions);
    };
}