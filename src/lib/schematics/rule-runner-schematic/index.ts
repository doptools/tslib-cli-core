import { chain, Rule } from "@angular-devkit/schematics";
import { RuleRunnerOptions } from "./schema";

export default function (options: RuleRunnerOptions): Rule {
  return chain(options.rules);
}
