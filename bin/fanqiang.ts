#!/usr/bin/env node

import yargs from "yargs";
import handlers from "../index";
import * as os from "os";

async function main(): Promise<void> {
  await yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .options({
      region: {
        type: "string",
        default: "us-east-1",
        description: "AWS lightsail region for proxy deployment",
      },
      "tunnel-region": {
        type: "string",
        default: "cn-shanghai",
        description: "Aliyun region for tunnel deployment",
      },
      bucket: {
        type: "string",
        default: "fanqiang-" + os.userInfo().username,
        description: "S3 bucket name for storing Clash client config file",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      (args) => handlers.create(args.region, args["tunnel-region"], args["bucket"])
    )
    .command("destroy", "Destroy tunnel proxy infrastructures", () => void 0, handlers.destroy)
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
