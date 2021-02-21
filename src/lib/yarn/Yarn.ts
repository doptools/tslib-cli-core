import { Shell } from '../shell';

function cmd(command: string, args: string[] = [], flags: { [key: string]: string | boolean | number } = {}): string {
    let cmd = `yarn ${command}`;

    for (const key in flags) {
        if (Object.prototype.hasOwnProperty.call(flags, key)) {
            let value = flags[key];
            if (typeof value === 'boolean') {
                if (value === true) {
                    cmd += ` --${key}`;
                }
            } else if (typeof value === 'number') {
                cmd += ` --${key}=${value.toString()}`;
            } else {
                cmd += ` --${key}="${value?.toString() ?? ''}"`;
            }
        }
    }
    cmd += args.length ? ' ' + args.join(' ') : '';
    return cmd;
}


export interface IYarnOptions {
    /**
     * The path to run the yarn command in
     * @default proccess.cwd()
     */
    cwd?: string;
}

/**
 * Options for yarn install
 * @link https://yarnpkg.com/cli/install
 */
export interface IYarnInstallOptions extends IYarnOptions {
    /**
     * Format the output as an NDJSON stream
     * @default false
     */
    json?: boolean;
    /**
     * Abort with an error exit code if the lockfile was to be modified
     * @default false
     */
    immutable?: boolean;
    /**
     * Abort with an error exit code if the cache folder was to be modified
     * @default false
     */
    immutableCache?: boolean;
    /**
     * Always refetch the packages and ensure that their checksums are consistent
     * @default false
     */
    checkCache?: boolean;
    /**
     * Verbosely print the output of the build steps of dependencies
     * @default false
     */
    inlineBuilds?: boolean;
    /**
     * Skip the build step altogether
     * @default false
     */
    skipBuilds?: boolean;
}

/**
 * Options for yarn add
 * @link https://yarnpkg.com/cli/add
 */
export interface IYarnAddOptions extends IYarnOptions {
    /**
     * Format the output as an NDJSON stream
     * @default false
     */
    json?: boolean;

    /**
     * Don't use any semver modifier on the resolved range
     * @default false
     */
    exact?: boolean;

    /**
     * Use the ~ semver modifier on the resolved range
     * @default false
     */
    tilde?: boolean;

    /**
     * Use the ^ semver modifier on the resolved range
     * @default false
     */
    caret?: boolean;

    /**
     * Add a package as a dev dependency
     * @default false
     */
    dev?: boolean;

    /**
     * Add a package as a peer dependency
     * @default false
     */
    peer?: boolean;

    /**
     * Add / upgrade a package to an optional regular / peer dependency
     * @default false
     */
    optional?: boolean;

    /**
     * Add / upgrade a package to a dev dependency
     * @default false
     */
    preferDev?: boolean;

    /**
     * Reuse the specified package from other workspaces in the project
     * @default false
     */
    interactive?: boolean;

    /**
     * Reuse the highest version already used somewhere within the project
     * @default false
     */
    cached?: boolean;
}
/**
 * Options for yarn remove
 * @link https://yarnpkg.com/cli/remove
 */
export interface IYarnRemoveOptions extends IYarnOptions {
    /**
     * Apply the operation to all workspaces from the current project
     * @default false
     */
    all?: boolean;
}

/**
 * Options for yarn run
 * @link https://yarnpkg.com/cli/run
 */
export interface IYarnRunOptions extends IYarnOptions {
    /**
     * Forwarded to the underlying Node process when executing a binary
     * @default false
     */
    inspect?: boolean;
    /**
     * Forwarded to the underlying Node process when executing a binary
     * @default false
     */
    inspectBrk?: boolean;
}

/**
 * Partial nodejs wrapper for Yarn cli
 * @link https://yarnpkg.com/cli
 */
export class Yarn {

    /**
     * Install the project dependencies.
     * @param options yarn install options
     * @link https://yarnpkg.com/cli/install
     */
    public static install(options: IYarnInstallOptions = {}): number {
        return Shell.exec(cmd('install', [], {
            'json': options.json ?? false,
            'immutable': options.immutable ?? false,
            'immutable-cache': options.immutableCache ?? false,
            'check-cache': options.checkCache ?? false,
            'inline-builds': options.inlineBuilds ?? false,
            'skip-builds': options.skipBuilds ?? false
        }), { cwd: options.cwd });
    }

    /**
     * Add dependencies to the project.
     * @param packages one or more packages to add
     * @param options yarn add options
     * @link https://yarnpkg.com/cli/add
     */
    public static add(packages: string | string[], options: IYarnAddOptions = {}): number {
        return Shell.exec(cmd('add', Array.isArray(packages) ? packages : [packages], {
            'json': options.json ?? false,
            'exact': options.exact ?? false,
            'tilde': options.tilde ?? false,
            'caret': options.caret ?? false,
            'dev': options.dev ?? false,
            'peer': options.peer ?? false,
            'optional': options.optional ?? false,
            'prefer-dev': options.preferDev ?? false,
            'interactive': options.interactive ?? false,
            'cached': options.cached ?? false,
        }), { cwd: options.cwd });
    }

    /**
     * Remove dependencies from the project.
     * @param packages one or more packages to remove
     * @param options yarn remove options
     * @link https://yarnpkg.com/cli/remove
     */
    public static remove(packages: string | string[], options: IYarnRemoveOptions = {}): number {
        return Shell.exec(cmd('remove', Array.isArray(packages) ? packages : [packages], {
            'all': options.all ?? false,
        }), { cwd: options.cwd });
    }
    /**
     * Run a script defined in the package.json.
     * @param script the script to run
     * @param options yarn run options
     * @link https://yarnpkg.com/cli/run
     */
    public static run(script: string, options: IYarnRunOptions = {}): number {
        return Shell.exec(cmd('run', [script], {
            'inspect': options.inspect ?? false,
            'inspect-brk': options.inspectBrk ?? false,
        }), { cwd: options.cwd });
    }
}

