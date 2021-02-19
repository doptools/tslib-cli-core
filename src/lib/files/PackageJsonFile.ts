import { Tree } from "@angular-devkit/schematics";
import { PackageJson } from "type-fest";
import { JsonFileType } from "./JsonFile";


export class PackageJsonFile extends JsonFileType<PackageJson>() {
    [key: string]: any;

    public constructor();
    public constructor(data: PackageJson);
    public constructor(filename: string);
    public constructor(filename: string, data: PackageJson);
    public constructor(tree: Tree);
    public constructor(tree: Tree, data: PackageJson);
    public constructor(tree: Tree, filename: string);
    public constructor(tree: Tree, filename: string, data: PackageJson);
    public constructor(...args: any[]) {
        super(...args);
    }
}
