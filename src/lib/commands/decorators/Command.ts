import { Command, flags } from '@oclif/command';
import { AlphabetLowercase, AlphabetUppercase } from '@oclif/parser/lib/alphabet';
import { Default, IBooleanFlag, IFlagBase, IOptionFlag } from '@oclif/parser/lib/flags';
import { Class } from 'type-fest';


const propertyKeyField = Symbol.for('hiden property to store propKey');

export interface ICliCommandDescription {
    id?: string;
    hidden?: boolean;
    aliases?: string[];
    description?: string;
    usage?: string | string[];
    examples?: string[];
}

type HasPropertyKeyField = { [propertyKeyField]: string | symbol };
type KeyData = { arg: Map<string | symbol, IArgumentConfig & HasPropertyKeyField>, flag: Map<string | symbol, IFlagConfig<any, any> & HasPropertyKeyField> };


type CmdClass = Class<Command & { run: () => PromiseLike<any> }> & {
    args?: (IArgumentConfig & HasPropertyKeyField)[]
    flags?: { [key: string]: (IFlagConfig<any, any> & HasPropertyKeyField) }
};

function gatherKeys(target: CmdClass): KeyData {
    const data: KeyData = { arg: new Map(), flag: new Map() };
    const parent = Object.getPrototypeOf(target);
    if (parent && parent.name && parent !== Object) {
        const pdata = gatherKeys(parent);
        // args dont inherit
        pdata.flag.forEach((v, k) => {
            data.flag.set(k, v);
        });
    }

    target.args?.forEach(arg => {
        const pk = arg[propertyKeyField];
        data.arg.set(pk, arg);
    });
    if (target.flags) {
        for (const key in target.flags) {
            if (Object.prototype.hasOwnProperty.call(target.flags, key)) {
                const flag = target.flags[key];
                const pk = flag[propertyKeyField];
                data.flag.set(pk, flag);
            }
        }
    }

    return data;
}


export function CliCommand(desc: ICliCommandDescription): ClassDecorator {
    return (target: any) => {

        const keys = gatherKeys(target);
        const args = Array.from(keys.arg.values());
        const flags = Object.fromEntries(keys.flag.entries());

        const Base = target as Class<Command & { run: () => PromiseLike<any> }>;
        class Cmd extends Base {
            public static args = args;
            public static flags = flags;
            public static aliases = desc.aliases;
            public static description = desc.description;
            public static examples = desc.examples;
            public static hidden = desc.hidden;
            public static id = desc.id;
            public static usage = desc.usage;

            constructor(...arg: any[]) {
                super(...arg);

                const parsed = this.parse(Cmd as any);
                const args = parsed.args;
                const flags = parsed.flags as { [key: string]: IFlagBase<any, any> };
                const self: any = this;
                keys.arg.forEach((arg, key) => {
                    self[key] = args[arg.name!];
                });
                keys.flag.forEach((flag, key) => {
                    self[key] = flags[flag.name!];
                });

                self.arguments = args;
                self.flags = flags;
            }
        }
        return Cmd as any;
    };
}


export interface IArgumentConfig {
    name?: string;
    description?: string;
    required?: boolean;
    hidden?: boolean;
    default?: string;
    options?: string[];
    parse?: (input: string) => string | number | undefined,
}

export function Argument(): PropertyDecorator;
export function Argument(desc: IArgumentConfig): PropertyDecorator;
export function Argument(required: boolean): PropertyDecorator;
export function Argument(name: string): PropertyDecorator;
export function Argument(name: string, required: boolean): PropertyDecorator;
export function Argument(...args: any[]): PropertyDecorator {
    let desc: IArgumentConfig = {};
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
        const cfg = { ...desc, [propertyKeyField]: key };
        cfg.name ??= key.toString();
        const Cmd = target.constructor as Class<Command> & { args: IArgumentConfig[] };
        Cmd.args ??= [];
        Cmd.args.push(cfg);
    };
}


export interface IFlagConfig<TFlag, TInput> {
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

export interface IBooleanFlagConfig<TInput = string> extends IFlagConfig<boolean, TInput> {
    allowNo?: boolean;
    default?: Default<boolean>;
}


export interface IOptionsFlagConfig<TFlag, TInput> extends IFlagConfig<TFlag, TInput> {
    helpValue?: string;
    default?: Default<TFlag | undefined>;
    multiple?: boolean;
    input?: string[];
    options?: TInput[];
}

export interface IStringFlagConfig<TInput = string> extends IOptionsFlagConfig<string, TInput> {

}

export interface IIntegerFlagConfig<TInput = string> extends IOptionsFlagConfig<number, TInput> {

}

export interface IHelpFlagConfig<TInput = string> extends IBooleanFlagConfig<TInput> {

}


function createFlagDecorator<T extends IFlagBase<any, any> & { type: string }>(desc: Partial<T>): PropertyDecorator {
    return (target, key) => {
        const cfg = { ...desc };
        cfg.name ??= key.toString();
        cfg.char ??= cfg.name.charAt(0) as AlphabetLowercase | AlphabetUppercase;
        const Cmd = target.constructor as Class<Command> & { flags: { [key: string]: IFlagBase<any, any> } };
        Cmd.flags ??= {};

        let config: IFlagBase<any, any>;
        switch (cfg.type) {
            case 'boolean':
                config = flags.boolean(cfg as Partial<IBooleanFlag<any>>);
                break;
            case 'integer':
                config = flags.integer(cfg as Partial<IOptionFlag<any>>);
                break;
            case 'help':
                config = flags.help(cfg as Partial<IBooleanFlag<any>>);
                break;
            case 'string':
            default:
                config = flags.string(cfg as Partial<IOptionFlag<any>>);
                break;
        }
        Cmd.flags[cfg.name!] = { ...config, [propertyKeyField]: key } as IFlagBase<any, any>;
    }
}


function createFlagAnnotation(type: string, config: IFlagConfig<any, any>): PropertyDecorator {
    return createFlagDecorator(Object.assign({}, config, { type }));
}


export function BooleanFlag(desc?: IBooleanFlagConfig): PropertyDecorator {
    return createFlagAnnotation('boolean', desc ?? {});
}

export function StringFlag(desc?: IBooleanFlagConfig): PropertyDecorator {
    return createFlagAnnotation('string', desc ?? {});
}

export function HelpFlag(desc?: IHelpFlagConfig): PropertyDecorator {
    return createFlagAnnotation('help', desc ?? {});
}

export function IntegerFlag(desc?: IIntegerFlagConfig): PropertyDecorator {
    return createFlagAnnotation('integer', desc ?? {});
}