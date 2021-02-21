import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { SchematicsSimpleFs } from '../files/simple-filesystem/SchematicsSimpleFs';
import { SimpleFs } from '../files/simple-filesystem/SimpleFs';
import { IRuleOptions, RuleRunner } from '../schematics/runner';
import { CommandBase } from './CommandBase';


export abstract class SchematicsCommandBase extends CommandBase {
    protected fs: SimpleFs = new SchematicsSimpleFs();
    protected readonly readonly: boolean = true;

    protected buildOptions(): Partial<IRuleOptions> {
        return {
            ...this.arguments,
            ...this.flags,
            mode: this.readonly ? 'ro' : 'rw'
        } as Partial<IRuleOptions>;
    }

    private async runRules(rules: Rule[], opts: Partial<IRuleOptions> = {}): Promise<boolean> {
        return RuleRunner.create(opts).execute(rules);
    }

    private async runRule(rule: Rule, opts: Partial<IRuleOptions> = {}): Promise<boolean> {
        return this.runRules([rule], opts);
    }

    public run(): PromiseLike<any> {
        const options = this.buildOptions();
        const r = this.runRule((tree: Tree, context: SchematicContext) => {
            (this.fs as SchematicsSimpleFs).tree = tree;
            return this.execute(tree, context, options);
        }, options);
        (this.fs as SchematicsSimpleFs).tree = null;
        return r;
    }

    protected abstract execute(tree: Tree, context: SchematicContext, options: Partial<IRuleOptions>): Tree | Observable<Tree> | Rule | Promise<void | Rule> | void;
}
