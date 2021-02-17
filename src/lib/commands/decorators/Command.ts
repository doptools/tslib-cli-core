import { Command, flags } from '@oclif/command'

import * as Parser from '@oclif/parser';
import { AlphabetLowercase, AlphabetUppercase } from '@oclif/parser/lib/alphabet';
import { Default, IBooleanFlag, IFlagBase, IOptionFlag } from '@oclif/parser/lib/flags';

import { Class } from 'type-fest';
export interface ICliCommandDescription {
    id?: string;
    hidden?: boolean;
    aliases?: string[];
    description?: string;
    usage?: string | string[];
    examples?: string[];
}
export function CliCommand(desc: ICliCommandDescription): ClassDecorator {
    return (target: any) => {
        const Base = target as Class<Command & { run: () => PromiseLike<any> }>;
        target[cmdArgKeys] ??= [];
        target[cmdFlagKeys] ??= [];
        class Cmd extends Base {
            constructor(...arg: any[]) {
                super(...arg);
                const { args, flags } = this.parse(target);
                const self: any = this;
                for (const key of (target[cmdArgKeys])) {
                    self[key] = args[key];
                }
                for (const key of target[cmdFlagKeys]) {
                    self[key] = (flags as {[key:string]: unknown})[key];
                }
            }
        }

        const newClass = Object.assign(Cmd, desc, { args: target.args, flags: target.flags }) as any;
        return newClass;
    };
}


export interface ICliArgumentDescription {
    name?: string;
    description?: string;
    required?: boolean;
    hidden?: boolean;
    default?: string;
    options?: string[];
    parse?: (input: string) => string | number | undefined,
}

const cmdArgKeys = Symbol.for('registered command arguments');
const cmdFlagKeys = Symbol.for('registered command flags');

export function CliArgument(): PropertyDecorator;
export function CliArgument(desc: ICliArgumentDescription): PropertyDecorator;
export function CliArgument(required: boolean): PropertyDecorator;
export function CliArgument(name: string): PropertyDecorator;
export function CliArgument(name: string, required: boolean): PropertyDecorator;
export function CliArgument(...args: any[]): PropertyDecorator {
    let desc: ICliArgumentDescription = {};
    if (args.length === 1) {
        if (typeof args[0] === 'boolean') {
            desc.required = args[0];
        } else if (typeof args[0] === 'string') {
            desc.name = args[0];
        } else if (typeof args[0] === 'object') {
            desc = args[0];
        }
    } else if (args.length === 2) {
        desc.name = args[0];
        desc.required = args[1];
    }

    return (target, key) => {
        const cfg = { ...desc };
        cfg.name ??= key.toString();
        const Cmd = target.constructor as Class<Command> & { [cmdArgKeys]: (string | symbol)[], args: ICliArgumentDescription[] };

        Cmd.args ??= [];
        Cmd.args.push(cfg);

        Cmd[cmdArgKeys] ??= [];
        Cmd[cmdArgKeys].push(key);
    };
}

/*
export interface ICliFlagDescription {
    type: 'boolean' | 'option';
    name: string;
    required?: boolean;
    char?: string;
    hidden?: boolean;
    description?: string;
    helpLabel?: string;
    allowNo?: boolean;
}

export interface ICliBooleanFlagDescription extends ICliFlagDescription {
    type: 'boolean';
}

export interface ICliOptionFlagDescription extends ICliFlagDescription {
    type: 'option';
    helpValue?: string;
    default?: string;
    options?: string[];
}
*/
/*
export interface ICliFlagDescription {
    name?: string;
    required?: boolean;
    char?: string;
    hidden?: boolean;
    description?: string;
    helpLabel?: string;
    allowNo?: boolean;
}
export interface ICliBooleanFlagDescription extends ICliFlagDescription {
    
}
*/

export interface ICliFlag<TFlag, TInput> {
    name?: string;
    char?: AlphabetLowercase | AlphabetUppercase;
    description?: string;
    helpLabel?: string;
    hidden?: boolean;
    required?: boolean;
    dependsOn?: string[];
    exclusive?: string[];
    env?: string;
    parse?: (input: TInput, context: any) => TFlag;
}

export interface ICliFlagBoolean<TInput = string> extends ICliFlag<boolean, TInput> {
    allowNo?: boolean;
    default?: Default<boolean>;
}


export interface ICliFlagOptions<TFlag, TInput> extends ICliFlag<TFlag, TInput> {
    helpValue?: string;
    default?: Default<TFlag | undefined>;
    multiple?: boolean;
    input?: string[];
    options?: TInput[];
}

export interface ICliFlagString<TInput = string> extends ICliFlagOptions<string, TInput> {

}

export interface ICliFlagInteger<TInput = string> extends ICliFlagOptions<number, TInput> {

}

export interface ICliFlagHelp<TInput = string> extends ICliFlagBoolean<TInput> {

}


function createFlagDecorator<T extends IFlagBase<any, any> & { type: string }>(desc: Partial<T>): PropertyDecorator {
    return (target, key) => {
        const cfg = { ...desc };
        cfg.name ??= key.toString();
        cfg.char ??= cfg.name.charAt(0) as AlphabetLowercase | AlphabetUppercase;
        const Cmd = target.constructor as Class<Command> & { [cmdFlagKeys]: (string | symbol)[], flags: { [key: string]: IFlagBase<any, any> } };
        Cmd[cmdFlagKeys] ??= [];
        Cmd[cmdFlagKeys].push(key);
        Cmd.flags ??= {};

        switch (cfg.type) {
            case 'boolean':
                Cmd.flags[cfg.name!] = flags.boolean(cfg as Partial<IBooleanFlag<any>>);
                break;
            case 'integer':
                Cmd.flags[cfg.name!] = flags.integer(cfg as Partial<IOptionFlag<any>>);
                break;
            case 'help':
                Cmd.flags[cfg.name!] = flags.help(cfg as Partial<IBooleanFlag<any>>);
                break;
            case 'string':
            default:
                Cmd.flags[cfg.name!] = flags.string(cfg as Partial<IOptionFlag<any>>);
                break;
        }
    }
}


function createFlagAnnotation(type: string, config: ICliFlag<any, any>): PropertyDecorator {
    return createFlagDecorator(Object.assign({}, config, { type }));
}


export function FlagBoolean(desc?: ICliFlagBoolean): PropertyDecorator {
    return createFlagAnnotation('boolean', desc ?? {});
}

export function FlagString(desc?: ICliFlagBoolean): PropertyDecorator {
    return createFlagAnnotation('string', desc ?? {});
}

export function FlagHelp(desc?: ICliFlagHelp): PropertyDecorator {
    return createFlagAnnotation('help', desc ?? {});
}

export function FlagInteger(desc?: ICliFlagInteger): PropertyDecorator {
    return createFlagAnnotation('integer', desc ?? {});
}