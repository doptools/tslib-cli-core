import { Tree, HostTree } from '@angular-devkit/schematics';
import { jsonc } from 'jsonc';
import path from 'path';
import { Class } from "type-fest";
import { readFile, writeFile, mkdir } from 'fs/promises'

const filePath = Symbol.for('the path to the file');
const fileName = Symbol.for('the name of the file');
const tree = Symbol.for('virtual file tree');

export class JsonFile<TData = { [key: string]: unknown }>{
    private [filePath]: string;
    private [fileName]: string;
    private [tree]: Tree;

    public constructor();
    public constructor(data: TData);
    public constructor(filename: string);
    public constructor(filename: string, data: TData);
    public constructor(tree: Tree);
    public constructor(tree: Tree, data: TData);
    public constructor(tree: Tree, filename: string);
    public constructor(tree: Tree, filename: string, data: TData);
    public constructor(...args: any[]) {
        if (args.length === 1) {
            if (typeof args[0] === 'string') {
                this.setFilePath(args[0]);
            } else if (args[0] instanceof HostTree) {
                this[tree] = args[0]
            } else {
                this.__applyData(args[0], this);
            }
        } else if (args.length === 2) {
            if (typeof args[0] === 'string') {
                this.setFilePath(args[0]);
                this.__applyData(args[1], this);
            } else if (typeof args[1] === 'string') {
                this[tree] = args[0];
                this.setFilePath(args[1]);
            } else {
                this[tree] = args[0];
                this.__applyData(args[1], this);
            }
        } else if (args.length === 3) {
            this[tree] = args[0];
            this.setFilePath(args[1]);
            this.__applyData(args[2], this);
        }
    }

    public async loadFile(): Promise<this> {
        if (!this.__hasFilePath) {
            throw new Error('Cannot load file with no path')
        }
        let dataStr: string | undefined;
        if (this[tree]) {
            dataStr = this[tree].read(this.getFilePath())?.toString('utf-8')
        } else {
            dataStr = await readFile(this.getFilePath(), { encoding: 'utf-8' })
        }
        if (dataStr) {
            const json = await jsonc.parse(dataStr, { stripComments: true }) as TData;
            this.__applyData(json, this);
        }
        return this;
    }

    public loadFileFrom(file: string): Promise<this> {
        this.setFilePath(file);
        return this.loadFile();
    }

    public async saveFile(): Promise<void> {
        const filename = this[filePath];
        if (!filename) {
            throw new Error('Cannot save without path');
        }
        const data = {};
        this.__applyData(this, data);

        const p = this.getFilePath();
        const dataStr = jsonc.stringify(data, { space: 2 });
        if (this[tree]) {
            if (this[tree].exists(p)) {
                this[tree].overwrite(p, dataStr);
            } else {
                this[tree].create(p, dataStr);
            }
        } else {
            await mkdir(path.dirname(p), { recursive: true });
            await writeFile(p, dataStr, { encoding: 'utf-8' })
        }
    }

    public saveFileAs(file: string): this {
        const copy = this.clone();
        copy.setFilePath(file);
        return copy;
    }

    public clone(): this {
        const copy = new (this.constructor() as Class<this>);
        copy[fileName] = this[fileName];
        copy[filePath] = this[filePath];
        this.__applyData(this, copy);
        return copy;
    }

    public toJSON(): TData {
        return this.__applyData(this, {} as TData);
    }

    public toString(): string {
        return jsonc.stringify(this, { space: 2 });
    }

    public setFilePath(file: string): void {
        this[filePath] = path.dirname(file) ?? '.';
        this[fileName] = path.basename(file);
    }

    public getFilePath(): string {
        return path.join(this[filePath], this[fileName]);
    }

    private get __hasFilePath(): boolean {
        return !!this[filePath];
    }

    private __applyData<TFrom extends this | TData, TTo extends any>(from: TFrom, to: TTo): TTo & TFrom {
        return Object.assign(to, from);
    }
}

export function JsonFileType<T>(): Class<JsonFile<T> & T> {
    return JsonFile as any;
}
