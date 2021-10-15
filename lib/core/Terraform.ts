import * as fs from "fs-extra";
import path from "path";
import { execute, executeInherit } from "./process";

export type TerraformVariableType = string | number | boolean;
type ApplyResult = Record<string, TerraformVariableType>;
const StateFile = "terraform.tfstate";
const VariableFile = "terraform.tfvars.json";

export default class Terraform {
  private constructor(private readonly workdir: string, private readonly customEnv: NodeJS.ProcessEnv = {}) {}

  async apply<R extends ApplyResult>(variables: Record<string, TerraformVariableType>): Promise<R> {
    await fs.writeJSON(path.join(this.workdir, VariableFile), variables);
    await executeInherit("terraform", ["apply", "-auto-approve"], this.workdir, this.customEnv);
    return <R>this.convert(JSON.parse(await execute("terraform", ["output", "-json"], this.workdir)));
  }

  private convert(terraformOutputs: any): ApplyResult {
    const result: ApplyResult = {};
    Object.keys(terraformOutputs).forEach((k) => (result[k] = terraformOutputs[k].value));
    return result;
  }

  async destroy(): Promise<void> {
    if (!(await this.provisioned())) {
      console.warn("Never provisioned, skip destroy");
      return;
    }
    await executeInherit("terraform", ["destroy", "-auto-approve"], this.workdir, this.customEnv);
  }

  provisioned(): Promise<boolean> {
    return fs.pathExists(path.join(this.workdir, StateFile));
  }

  static async createInstance(
    configSource: string,
    customEnv: NodeJS.ProcessEnv = {},
    workdir: string = configSource
  ): Promise<Terraform> {
    if (!(await fs.pathExists(path.join(workdir, ".terraform")))) {
      await fs.ensureDir(workdir);
      await executeInherit(
        "terraform",
        workdir == configSource ? ["init"] : ["init", "-from-module=" + configSource],
        workdir
      );
    }
    return new Terraform(workdir, customEnv);
  }
}
