import { spawn } from 'child_process';
import { Observable, Subscriber } from 'rxjs';
export class ShellCommandObservable extends Observable<string>{

    public constructor(cmd: string, cmdOpts?: any) {
        console.log('ShellCommandObservable');
        super((subscriber: Subscriber<string>) => {
            console.log('exec', cmd);
            

            const dir = spawn('top', [], {shell: true, stdio: 'inherit'});
            const a:string[] = [];
           // dir.stdout.pipe(process.stdout);
           //dir.stdin.pipe(process.stdin);
            process.stdout?.on('data', (data) => {
                console.log('-data-', data.toString());
                a.push(data)
            })
            dir.stderr?.on('data', (data) => {
                console.log('Error: ' + data);
            })
            dir.on('close', (code) => {
                console.log('Process exit code: ' + code);
            })

            /*
            const child = spawn(cmd);

            child.on('message', console.log.bind(console, 'message'));
            child.on('close', console.log.bind(console, 'close'));
            child.on('disconnect', console.log.bind(console, 'disconnect'));
            child.on('error', console.log.bind(console, 'error'));
            child.on('exit', console.log.bind(console, 'exit'));
            

            child.stdout?.on('close', console.log.bind(console, 'stdout: close'));
            child.stdout?.on('data', data=>{
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!')
            });
            child.stdout?.on('end', console.log.bind(console, 'stdout: end'));
            child.stdout?.on('error', console.log.bind(console, 'stdout: error'));
            child.stdout?.on('pause', console.log.bind(console, 'stdout: pause'));
            child.stdout?.on('readable', console.log.bind(console, 'stdout: readable'));
            child.stdout?.on('resume', console.log.bind(console, 'stdout: resume'));

            child.stderr?.on('close', console.log.bind(console, 'stderr: close'));
            child.stderr?.on('data', console.log.bind(console, 'stderr: data'));
            child.stderr?.on('end', console.log.bind(console, 'stderr: end'));
            child.stderr?.on('error', console.log.bind(console, 'stderr: error'));
            child.stderr?.on('pause', console.log.bind(console, 'stderr: pause'));
            child.stderr?.on('readable', console.log.bind(console, 'stderr: readable'));
            child.stderr?.on('resume', console.log.bind(console, 'stderr: resume'));

           /* child.on('message', (a, b) => {
                console.log(a);
            });

            child.on('error', (e) => {
                console.log(e);
            });

            child.on('exit', code => {
                console.log(code);
            });*/
            return () => {
                console.log('unsub', cmd);
                dir.kill(9);
                console.log(a);
            };
        });
    }
}