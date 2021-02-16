import { jsonc } from 'jsonc';
import path from 'path';
import { Class } from "type-fest";


const filePath = Symbol.for('the path to the file');
const fileName = Symbol.for('the name of the file');


export class JsonFile<TData = { [key: string]: unknown }>{
    private [filePath]: string;
    private [fileName]: string;

    public constructor();
    public constructor(data: TData);
    public constructor(filename: string);
    public constructor(filename: string, data: TData);
    public constructor(fileOrData?: string | TData, data?: TData) {
        if (fileOrData) {
            if (typeof fileOrData === 'string') {
                this.setFilePath(fileOrData);
                if (data) {
                    this.__applyData(data, this);
                }
            } else {
                this.__applyData(fileOrData, this);
            }
        }
    }

    public async loadFile(): Promise<this> {
        if (!this.__hasFilePath) {
            throw new Error('Cannot load file with no path')
        }
        const json = await jsonc.read(this.getFilePath(), { stripComments: true }) as TData;
        this.__applyData(json, this);
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
        await jsonc.write(this.getFilePath(), data, { space: 2, autoPath: true });
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
