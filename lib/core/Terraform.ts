import { CredentialsProviders } from "./Credentials";
import * as fs from "fs-extra";
import path from "path";
import { execute, executeInherit } from "./process";
import promiseRetry from "promise-retry";

export type TerraformVariableType = string | number | boolean;
type ApplyResult = Record<string, TerraformVariableType>;
const StateFile = "terraform.tfstate";
const VariableFile = "terraform.tfvars.json";

export default class Terraform {
  private constructor(private readonly credentialsProviders: CredentialsProviders, private readonly workdir: string) {
  }

  async apply<R extends ApplyResult>(variables: Record<string, TerraformVariableType>): Promise<R> {
    await fs.writeJSON(path.join(this.workdir, VariableFile), variables);
    await promiseRetry(async (retry) => {
      try {
        await executeInherit("terraform", ["apply", "-auto-approve"], this.workdir, this.credentialsAsEnv());
      } catch (error) {
        retry(error);
      }
    });
    return <R>this.convert(JSON.parse(await execute("terraform", ["output", "-json"], this.workdir)));
  }

  private convert(terraformOutputs: any): ApplyResult {
    const result: ApplyResult = {};
    Object.keys(terraformOutputs).forEach(k => result[k] = terraformOutputs[k].value);
    return result;
  }

  async destroy(): Promise<void> {
    if (!await this.provisioned()) {
      console.warn("Never provisioned, skip destroy");
      return;
    }
    await executeInherit("terraform", ["destroy", "-auto-approve"], this.workdir, this.credentialsAsEnv());
  }

  async deleteWorkspace(): Promise<void> {
    await executeInherit("terraform", ["workspace", "delete"], this.workdir);
  }

  provisioned(): Promise<boolean> {
    return fs.pathExists(path.join(this.workdir, StateFile));
  }

  private credentialsAsEnv(): Record<string, string> {
    return {
      ALICLOUD_ACCESS_KEY: this.credentialsProviders.aliyun.id,
      ALICLOUD_SECRET_KEY: this.credentialsProviders.aliyun.secret,
      AWS_ACCESS_KEY_ID: this.credentialsProviders.aws.id,
      AWS_SECRET_ACCESS_KEY: this.credentialsProviders.aws.secret,
    }
  }

  static async createInstance(credentialsProviders: CredentialsProviders, configSource: string, workdir?: string): Promise<Terraform> {
    if (workdir && workdir != configSource) {
      await fs.ensureDir(workdir);
      await fs.copy(configSource, workdir, { overwrite: true, recursive: true });
    } else {
      workdir = configSource;
    }
    if (!await fs.pathExists(path.join(workdir, ".terraform"))) {
      await executeInherit("terraform", ["init"], workdir);
    }
    return new Terraform(credentialsProviders, workdir);
  }
}

