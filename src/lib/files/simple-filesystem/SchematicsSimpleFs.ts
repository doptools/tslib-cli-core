import { Tree } from "@angular-devkit/schematics";
import { posix as Path } from 'path';
import { SimpleFs } from "./SimpleFs";

export class SchematicsSimpleFs extends SimpleFs {


    public tree: Tree | null = null;

    public constructor() {
        super(false);
    }

    protected get root(): string {
        if (!this.tree) {
            return super.root;
        }
        return '/';
    }

    public async read(path: string): Promise<Buffer | null> {
        if (!this.tree) {
            return super.read(path);
        }
        return this.tree.read(path);
    }

    public async create(path: string, data: string | Buffer): Promise<void> {
        if (!this.tree) {
            return super.create(path, data);
        }
        this.tree.create(path, data);
    }

    public async overwrite(path: string, data: string | Buffer): Promise<void> {
        if (!this.tree) {
            return super.overwrite(path, data);
        }
        this.tree.overwrite(path, data);

    }

    public async delete(path: string): Promise<void> {
        if (!this.tree) {
            return super.delete(path);
        }
        this.tree.delete(path);
    }

    public async rename(from: string, to: string): Promise<void> {
        if (!this.tree) {
            return super.rename(from, to);
        }
        this.tree.rename(from, to);
    }

    public exists(path: string): Promise<boolean> {
        if (!this.tree) {
            return super.exists(path);
        }
        return Promise.resolve(this.tree.exists(path));
    }

    public async list(path: string): Promise<string[]> {
        if (!this.tree) {
            return super.list(path);
        }
        const dir = this.tree.getDir(path);
        return [...dir.subdirs, ...dir.subfiles];
    }
}