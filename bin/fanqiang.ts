#!/usr/bin/env node

import yargs from "yargs";
import { TunnelProxyFacade } from "../lib/core/TunnelProxyFacade";
import { DEFAULT_REGION } from "../lib/core/awsRegions";
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
        const proxyInfo = await facade.createTunnelProxy(args.region);
        console.log("Successfully deploy proxy, connect information ->");
        console.log(proxyInfo);
      }
    )
    .command(
      "destroy",
      "Destroy tunnel proxy infrastructures",
      () => void 0,
      (args) => {
        console.log("Destroying tunnel proxy infrastructures...");
        facade.destroyTunnelProxy(args.region);
        console.log("Successfully destroy tunnel proxy!");
      }
    )
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
