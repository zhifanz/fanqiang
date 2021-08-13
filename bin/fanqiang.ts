#!/usr/bin/env node

import yargs from "yargs";
import { TunnelProxyFacade } from "../lib/core/TunnelProxyFacade";
import { DEFAULT_REGION as DEFAULT_PROXY_REGION } from "../lib/core/aws/regions";
import { DEFAULT_CONFIG_PATH } from "../lib/core/clash";
import { DEFAULT_REGION as DEFAULT_TUNNEL_REGION } from "../lib/core/aliyun/regions";

async function main(): Promise<void> {
  const facade = new TunnelProxyFacade();

  await yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .options({
      region: {
        type: "string",
        default: DEFAULT_PROXY_REGION,
        description: "AWS lightsail region for proxy deployment",
      },
      tunnelRegion: {
        type: "string",
        description: "Aliyun region for tunnel deployment, for example: " + DEFAULT_TUNNEL_REGION,
      },
      output: {
        type: "string",
        default: DEFAULT_CONFIG_PATH,
        description: "Path for clash config file, only applicable for create command",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      async (args) => {
        await facade.createTunnelProxy(args.region, args.output, args.tunnelRegion);
      }
    )
    .command(
      "destroy",
      "Destroy tunnel proxy infrastructures",
      () => void 0,
      async (args) => {
        await facade.destroyTunnelProxy(args.region, args.tunnelRegion);
      }
    )
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
