import { spawnSync } from 'child_process';
import { parseArgsStringToArgv } from 'string-argv';

export class Shell {

    public static exec(command: string): number {
        const argv = parseArgsStringToArgv(command);
        const cmd = argv.shift();
        const child = spawnSync(cmd!, argv, { stdio: 'inherit', shell: true });
        return child.status!;
    }
    public static read(command: string): string {
        const argv = parseArgsStringToArgv(command);
        const cmd = argv.shift();
        const child = spawnSync(cmd!, argv, { shell: true });
        return child.stdout.toString('utf-8')
    }
}