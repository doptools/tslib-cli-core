import { Command } from '@oclif/command';
import { SimpleFs } from '../files/simple-filesystem/SimpleFs';
import { PackageJson } from "type-fest";
import { BooleanFlag } from './decorators';

export abstract class CommandBase extends Command {
    protected fs: SimpleFs = new SimpleFs(true);
    protected readonly flags: { [key: string]: string | number | boolean | undefined } = {};
    protected readonly arguments: { [key: string]: string | number | boolean | undefined } = {};

    @BooleanFlag({
        description: ""
    })
    public readonly verbose:boolean = false;

    public get packageJson(): Promise<PackageJson | null> {
        return this.fs.readJson<PackageJson>('/package.json');
    }
}


