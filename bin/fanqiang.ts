#!/usr/bin/env node

import yargs from "yargs";
import path from "path";
import os from "os";
import TunnelProxyFacade from "../index";

async function main(): Promise<void> {
  const facade = new TunnelProxyFacade();

  await yargs(process.argv.slice(2))
    .usage("Usage: $0 <command> [options]")
    .options({
      region: {
        type: "string",
        default: "us-east-1",
        description: "AWS lightsail region for proxy deployment",
      },
      tunnelRegion: {
        alias: "tunnel-region",
        type: "string",
        description: "Aliyun region for tunnel deployment, for example: cn-shanghai",
      },
      tunnelArch: {
        alias: "tunnel-arch",
        type: "string",
        description: "Deployment architecture for tunnel infrastructures",
        choices: ["PlainEcs", "AutoProvisioning"],
        default: "AutoProvisioning",
      },
      output: {
        type: "string",
        default: path.join(os.homedir(), ".config", "clash", "fanqiang.yaml"),
        description: "Path for clash config file, only applicable for create command",
      },
    })
    .demandCommand(1)
    .strict()
    .command(
      "create",
      "Create new tunnel proxy infrastructures",
      () => void 0,
      (args) =>
        facade.createTunnelProxy(
          args.region,
          args.output,
          args.tunnelRegion ? { region: args.tunnelRegion, arch: args.tunnelArch } : undefined
        )
    )
    .command(
      "destroy",
      "Destroy tunnel proxy infrastructures",
      () => void 0,
      (args) => facade.destroyTunnelProxy(args.region, args.tunnelRegion)
    )
    .help()
    .version()
    .showHelpOnFail(true).argv;
}

main().catch((error) => console.error(error));
