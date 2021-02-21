import { spawnSync } from 'child_process';
import { parseArgsStringToArgv } from 'string-argv';

export interface IShellOptions {
    cwd?: string;
}

export class Shell {

    public static exec(command: string, opts: IShellOptions = {}): number {
        const argv = parseArgsStringToArgv(command);
        const cmd = argv.shift();
        const child = spawnSync(cmd!, argv, { stdio: 'inherit', shell: true, cwd: opts.cwd ?? process.cwd() });
        return child.status!;
    }
    public static read(command: string, opts: IShellOptions = {}): string {
        const argv = parseArgsStringToArgv(command);
        const cmd = argv.shift();
        const child = spawnSync(cmd!, argv, { stdio: 'inherit', shell: true, cwd: opts.cwd ?? process.cwd() });
        return child.stdout.toString('utf-8')
    }
}