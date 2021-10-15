#!/usr/bin/env node

import yargs from "yargs";
import * as os from "os";
import { handlers, DefaultRegions } from "../index";

async function main(): Promise<void> {
  await yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .options({
      region: {
        type: "string",
        default: DefaultRegions.proxy,
        description: "AWS lightsail region for proxy deployment",
      },
      "tunnel-region": {
        type: "string",
        default: DefaultRegions.tunnel,
        description: "Aliyun region for tunnel deployment",
      },
      bucket: {
        type: "string",
        default: "fanqiang-" + os.userInfo().username,
        description: "S3 bucket name for storing Clash client config file",
      },
      "aws-credentials": {
        type: "string",
        description: "Must be in format: <ACCESS_KEY_ID>:<ACCESS_KEY_SECRET>",
      },
      "aliyun-credentials": {
        type: "string",
        description: "Must be in format: <ACCESS_KEY_ID>:<ACCESS_KEY_SECRET>",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      (args) =>
        handlers.create(args.region, args["tunnel-region"], args["bucket"], {
          aws: args["aws-credentials"],
          aliyun: args["aliyun-credentials"],
        })
    )
    .command(
      "destroy",
      "Destroy tunnel proxy infrastructures",
      () => void 0,
      (args) =>
        handlers.destroy({
          aws: args["aws-credentials"],
          aliyun: args["aliyun-credentials"],
        })
    )
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
