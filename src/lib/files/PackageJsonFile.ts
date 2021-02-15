import { Class, PackageJson } from "type-fest";
import { JsonFileType, JsonFile } from "./JsonFile";


export class PackageJsonFile extends JsonFileType<PackageJson>() {
    [key: string]: any;
    public constructor();
    public constructor(data: PackageJson);
    public constructor(filename: string);
    public constructor(filename: string, data: PackageJson);
    public constructor(fileOrData?: string | PackageJson, data?: PackageJson) {
        super(fileOrData as string, data);
    }
}

