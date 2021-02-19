
import { existsSync } from 'fs'
import { readFile, writeFile, mkdir, unlink, rename, readdir } from 'fs/promises';
import { jsonc } from 'jsonc';
import { posix as Path } from 'path';
import * as yaml from 'yaml';



interface ICommandFileAccess {
    readFile(path: string): Promise<Buffer | null>;
    createFile(path: string, data: string | Buffer): Promise<void>;
    overwriteFile(path: string, data: string | Buffer): Promise<void>;
    fileExists(path: string): Promise<boolean>;
    deleteFile(path: string): Promise<void>;
    renameFile(from: string, to: string): Promise<void>;
    listDir(path: string): Promise<string[]>;
}

export class SimpleFs {
    private _cwd: string = '.';

    public constructor(
        private readonly enforceRootDir: boolean = false
    ) { }

    public get root(): string {
        return Path.normalize(process.cwd() + '/');
    }

    public get cwd(): string {
        return Path.relative(Path.normalize(process.cwd()), this._cwd) || '/';
    }


    public async read(path: string): Promise<Buffer | null> {
        path = this.resolve(path);
        try {
            return await readFile(path);
        } catch {
            return null;
        }
    }
    public async readText(path: string): Promise<string | null> {
        const data = await this.read(path);
        return data ? data.toString('utf-8') : null;
    }

    public async readJson<TData>(path: string): Promise<TData | null> {
        const data = await this.readText(path);
        return data ? jsonc.parse(data, { stripComments: true }) : null;
    }

    public async readYaml<TData>(path: string): Promise<TData | null> {
        const data = await this.readText(path);
        return data ? yaml.parse(data, { prettyErrors: true }) : null;
    }

    public async create(path: string, data: string | Buffer): Promise<void> {
        await this.ensureNotExists(path);

        await mkdir(Path.dirname(path), { recursive: true });
        await writeFile(path, data, typeof data === 'string' ? 'utf-8' : 'binary');
    }

    public async createText(path: string, data: string): Promise<void> {
        await this.create(path, data);
    }

    public async createJson(path: string, data: any): Promise<void> {
        await this.createText(path, this.toJsonString(data));
    }

    protected toJsonString(data: any): string {
        return jsonc.stringify(data, { space: 2, handleCircular: false });
    }

    public async createYaml(path: string, data: any): Promise<void> {
        await this.createText(path, this.toYamlString(data));
    }

    protected toYamlString(data: any): string {
        return yaml.stringify(data, { indent: 2, prettyErrors: true });
    }

    public async overwrite(path: string, data: string | Buffer): Promise<void> {
        await this.ensureExists(path);
        await writeFile(path, data, typeof data === 'string' ? 'utf-8' : 'binary');
    }

    public async overwriteText(path: string, data: string): Promise<void> {
        await this.overwrite(path, data);
    }

    public async overwriteJson(path: string, data: any): Promise<void> {
        await this.overwriteText(path, this.toJsonString(data));
    }

    public async overwriteYaml(path: string, data: any): Promise<void> {
        await this.overwriteText(path, this.toYamlString(data));
    }

    public async delete(path: string): Promise<void> {
        await this.ensureExists(path);
        await unlink(this.resolve(path));
    }

    public async rename(from: string, to: string): Promise<void> {
        await this.ensureExists(from);
        await this.ensureNotExists(to);
        await rename(this.resolve(from), this.resolve(to));
    }

    public exists(path: string): Promise<boolean> {
        return Promise.resolve(this.existsSync(path));
    }

    private existsSync(path: string): boolean {
        return existsSync(this.resolve(path));
    }

    public async list(path: string): Promise<string[]> {
        await this.ensureExists(path);
        return (await readdir(this.resolve(path))).filter(_ => _ !== '.' && _ !== '..');
    }

    public cd(path: string): void {
        this.ensureExistsSync(path);
        path = this.resolve(path);
        this._cwd = path;
    }


    protected buildPath(path: string): string {
        if (Path.isAbsolute(path)) {
            const trueRoot = Path.normalize(process.cwd() + '/');
            let target = Path.join(trueRoot, `./${path}`);
            target = Path.relative(trueRoot, target);
            return target;
        }
        path = Path.normalize(Path.join(this._cwd, path));
        return path;

    }
    protected resolve(path: string): string {
        let target = this.buildPath(path);
        if (target.startsWith('..')) {
            if (this.enforceRootDir || this.root === '/') {
                throw new Error(`Path '${path}' is invalid. Resolves below root : '/${target}'`);
            }
        }
        target = Path.normalize(Path.join(this.root, target));
        target = Path.relative(this.root, target);
        return target || this.root;
    }


    protected async ensureExists(path: string): Promise<void> {
        return Promise.resolve(this.ensureExistsSync(path));
    }

    private ensureExistsSync(path: string): void {
        if (!this.existsSync(path)) {
            throw new Error(`${path} does not exist.`);
        }
    }

    protected async ensureNotExists(path: string): Promise<void> {
        return Promise.resolve(this.ensureNotExistsSync(path));
    }

    private ensureNotExistsSync(path: string): void {
        if (this.existsSync(path)) {
            throw new Error(`${path} already exist.`);
        }
    }

}