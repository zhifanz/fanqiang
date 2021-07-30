#!/usr/bin/env node

import yargs from "yargs";
import { TunnelProxyFacade } from "../lib/core/TunnelProxyFacade";
import { DEFAULT_REGION } from "../lib/core/awsRegions";
import { DEFAULT_CONFIG_PATH } from "../lib/core/clash";

async function main(): Promise<void> {
  const facade = new TunnelProxyFacade();

  await yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .options({
      region: {
        type: "string",
        default: DEFAULT_REGION,
        description: "AWS lightsail region for proxy deployment",
      },
      output: {
        type: "string",
        default: DEFAULT_CONFIG_PATH,
        description:
          "Path for clash config file, only applicable for create command",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      async (args) => {
        console.log(
          `Creating proxy infrastructures for region [${args.region}]...`
        );
        await facade.createTunnelProxy(args.region, args.output);
        console.log("Successfully deploy proxy, saved client config to " + args.output);
      }
    )
    .command(
      "destroy",
      "Destroy tunnel proxy infrastructures",
      () => void 0,
      async (args) => {
        console.log("Destroying tunnel proxy infrastructures...");
        await facade.destroyTunnelProxy(args.region);
        console.log("Successfully destroy tunnel proxy!");
      }
    )
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
