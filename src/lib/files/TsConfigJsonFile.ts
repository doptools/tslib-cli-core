import { Class, PackageJson, TsConfigJson } from "type-fest";
import { JsonFileType, JsonFile } from "./JsonFile";


export class TsConfigJsonFile extends JsonFileType<TsConfigJson>() {
    [key: string]: any;
    public constructor();
    public constructor(data: TsConfigJson);
    public constructor(filename: string);
    public constructor(filename: string, data: TsConfigJson);
    public constructor(fileOrData?: string | TsConfigJson, data?: TsConfigJson) {
        super(fileOrData as string, data);
    }
}

