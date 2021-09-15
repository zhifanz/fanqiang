#!/usr/bin/env node

import yargs from "yargs";
import handlers from "../index";

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
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      (args) => handlers.create(args.region, args["tunnel-region"])
    )
    .command("destroy", "Destroy tunnel proxy infrastructures", () => void 0, handlers.destroy)
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
