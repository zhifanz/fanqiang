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
        description: "Aliyun region for tunnel deployment, for example: cn-shanghai",
      },
      "auto-provisioning": {
        boolean: true,
        default: false,
        description: "Whether to apply auto provisioning strategy for instance creation",
      },
      "output-link": {
        boolean: true,
        default: false,
        description: "Whether to save clash config file on cloud storage, only applicable for create command",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      (args) =>
        handlers.create(
          args.region,
          args["output-link"],
          args["tunnel-region"]
            ? {
                region: args["tunnel-region"],
                autoProvisioning: args["auto-provisioning"],
              }
            : undefined
        )
    )
    .command("destroy", "Destroy tunnel proxy infrastructures", () => void 0, handlers.destroy)
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
