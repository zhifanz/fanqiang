import { AxiosInstance } from "axios";
import { AliyunCredentials } from "./credentials";
import OpenApiUtil from "@alicloud/openapi-util";
import Util from "@alicloud/tea-util";
import { findPagedResources } from "../cloudServiceOperations";
import { waitCondition } from "../langUtils";
import { InstanceConfig } from "./InstanceConfig";

type Response = { RequestId: string; Code?: string; Message?: string };
type PagedResponse = { TotalCount: number; PageSize: number; PageNumber: number } & Response;

type ServiceRef = { name: string; version: string };
export const Services: Record<"ECS" | "VPC" | "RESOURCE_MANAGER", ServiceRef> = {
  ECS: { name: "ecs", version: "2014-05-26" },
  VPC: { name: "vpc", version: "2016-04-28" },
  RESOURCE_MANAGER: { name: "resourcemanager", version: "2020-03-31" },
} as const;

export class AliyunOperations {
  constructor(private readonly http: AxiosInstance, private readonly credentials: AliyunCredentials) {}

  async ensureResourceGroup(resourceGroupName: string): Promise<string> {
    let resourceGroupId: string | undefined;
    await waitCondition(async () => {
      const resourceGroups: { Id: string; Name: string; Status: string }[] = await this.findPagedResources(
        Services.RESOURCE_MANAGER,
        "ListResourceGroups",
        (response) => {
          return response.ResourceGroups.ResourceGroup;
        }
      );
      const resourceGroup = resourceGroups.find((g) => g.Name === resourceGroupName);
      if (resourceGroup) {
        switch (resourceGroup.Status) {
          case "Creating":
            return false;
          case "OK":
            resourceGroupId = resourceGroup.Id;
            return true;
          case "Deleting":
          case "PendingDelete":
          default:
            throw new Error(`Resource group ${resourceGroupName} is under invalid status: ${resourceGroup.Status}`);
        }
      }
      await this.doAction(Services.RESOURCE_MANAGER, "resourceGroupName", {
        Name: resourceGroupName,
        DisplayName: "RG-" + resourceGroupName,
      });
      return false;
    });
    return <string>resourceGroupId;
  }

  async findResourceGroup(resourceGroupName: string): Promise<string | undefined> {
    const resourceGroups: { Name: string; Id: string }[] = await this.findPagedResources(
      Services.RESOURCE_MANAGER,
      "ListResourceGroups",
      (response) => response.ResourceGroups.ResourceGroup
    );
    return resourceGroups.find((g) => g.Name === resourceGroupName)?.Id;
  }

  async createVpc(regionId: string, resourceGroupId: string): Promise<string> {
    const vpcId = (
      await this.doAction(Services.VPC, "CreateVpc", {
        RegionId: regionId,
        ResourceGroupId: resourceGroupId,
        CidrBlock: "192.168.0.0/16",
      })
    ).VpcId;
    await waitCondition(async () => {
      return (
        (
          await this.doAction(Services.VPC, "DescribeVpcAttribute", {
            RegionId: regionId,
            VpcId: vpcId,
          })
        ).Status === "Available"
      );
    });
    return vpcId;
  }

  async deleteVpcs(regionId: string, resourceGroupId: string): Promise<void> {
    const vpcs: any[] = await this.findPagedResources(Services.VPC, "DescribeVpcs", (r) => r.Vpcs.Vpc, {
      RegionId: regionId,
      ResourceGroupId: resourceGroupId,
    });

    for (const vpc of vpcs) {
      await this.deleteResources(
        () =>
          this.findPagedResources(
            Services.VPC,
            "DescribeVSwitches",
            (r): any[] => {
              return r.VSwitches.VSwitch;
            },
            {
              VpcId: vpc.VpcId,
              RegionId: regionId,
            }
          ),
        async (t) => {
          if (t.Status === "Available") {
            await this.doAction(Services.VPC, "DeleteVSwitch", { RegionId: regionId, VSwitchId: t.VSwitchId });
          }
        }
      );
      await this.doAction(Services.VPC, "DeleteVpc", { RegionId: regionId, VpcId: vpc.VpcId });
    }
  }

  async createVSwitch(regionId: string, vpcId: string, zoneId: string): Promise<string> {
    const vSwitchId = (
      await this.doAction(Services.VPC, "CreateVSwitch", {
        CidrBlock: "192.168.0.0/24",
        VpcId: vpcId,
        ZoneId: zoneId,
        RegionId: regionId,
      })
    ).VSwitchId;

    await waitCondition(
      async () =>
        (
          await this.doAction(Services.VPC, "DescribeVSwitchAttributes", { RegionId: regionId, VSwitchId: vSwitchId })
        ).Status === "Available"
    );

    return vSwitchId;
  }

  async createSecurityGroup(
    regionId: string,
    resourceGroupId: string,
    vpcId: string,
    ingressPort: number
  ): Promise<string> {
    const securityGroupId = (
      await this.doAction(Services.ECS, "CreateSecurityGroup", {
        RegionId: regionId,
        VpcId: vpcId,
        ResourceGroupId: resourceGroupId,
        SecurityGroupType: "normal",
      })
    ).SecurityGroupId;

    const allowIngressPort = async (port: number, ipProtocol: "tcp" | "udp"): Promise<void> =>
      await this.doAction(Services.ECS, "AuthorizeSecurityGroup", {
        IpProtocol: ipProtocol,
        PortRange: port + "/" + port,
        RegionId: regionId,
        SecurityGroupId: securityGroupId,
        SourceCidrIp: "0.0.0.0/0",
      });

    await allowIngressPort(ingressPort, "tcp");
    await allowIngressPort(ingressPort, "udp");
    await allowIngressPort(22, "tcp");
    return securityGroupId;
  }

  async deleteSecurityGroups(regionId: string, resourceGroupId: string): Promise<void> {
    await this.deleteResources(
      () =>
        this.findPagedResources(
          Services.ECS,
          "DescribeSecurityGroups",
          (r): { SecurityGroupId: string }[] => r.SecurityGroups.SecurityGroup,
          {
            RegionId: regionId,
            ResourceGroupId: resourceGroupId,
          }
        ),
      async (t) =>
        await this.doAction(Services.ECS, "DeleteSecurityGroup", {
          RegionId: regionId,
          SecurityGroupId: t.SecurityGroupId,
        })
    );
  }

  async createEcsInstance(
    regionId: string,
    resourceGroupId: string,
    securityGroupId: string,
    vSwitchId: string,
    cloudInitScript: string,
    instanceConfig: InstanceConfig
  ): Promise<string> {
    const instanceId = (
      await this.doAction(Services.ECS, "CreateInstance", {
        InstanceType: instanceConfig.instanceType,
        RegionId: regionId,
        ImageId: instanceConfig.imageId,
        SecurityGroupId: securityGroupId,
        VSwitchId: vSwitchId,
        InternetChargeType: instanceConfig.internetChargeType,
        InternetMaxBandwidthOut: instanceConfig.internetMaxBandwidthOut,
        "SystemDisk.Size": instanceConfig.systemDiskSize,
        "SystemDisk.Category": instanceConfig.systemDiskCategory,
        InstanceChargeType: instanceConfig.instanceChargeType,
        UserData: Buffer.from(cloudInitScript).toString("base64"),
        KeyPairName: "id_ed25519",
        ResourceGroupId: resourceGroupId,
      })
    ).InstanceId;
    let ipAddress: string | undefined;
    await waitCondition(async () => {
      try {
        ipAddress = (await this.doAction(Services.ECS, "AllocatePublicIpAddress", { InstanceId: instanceId }))
          .IpAddress;
        return true;
      } catch (e) {
        if (e.errorCode.includes("IncorrectInstanceStatus")) {
          return false;
        }
        throw e;
      }
    });
    await this.doAction(Services.ECS, "StartInstance", { InstanceId: instanceId });
    await waitCondition(
      async () =>
        (
          await this.doAction(Services.ECS, "DescribeInstanceStatus", {
            RegionId: regionId,
            "InstanceId.1": instanceId,
          })
        ).InstanceStatuses.InstanceStatus[0].Status === "Running"
    );
    return <string>ipAddress;
  }

  async deleteEcsInstances(regionId: string, resourceGroupId: string): Promise<void> {
    await this.deleteResources(
      (): Promise<{ Status: string; InstanceId: string }[]> =>
        this.findPagedResources(Services.ECS, "DescribeInstances", (r) => r.Instances.Instance, {
          RegionId: regionId,
          ResourceGroupId: resourceGroupId,
        }),
      async (t) => {
        if (t.Status === "Running" || t.Status === "Stopped") {
          await this.doAction(Services.ECS, "DeleteInstance", { InstanceId: t.InstanceId, Force: "true" });
        }
      }
    );
  }

  async determineZoneId(regionId: string, instanceChargeType: string, instanceType: string): Promise<string> {
    const zoneId = (
      await this.doAction(Services.ECS, "DescribeZones", {
        RegionId: regionId,
        InstanceChargeType: instanceChargeType,
      })
    ).Zones.Zone.find((z: any) => z.AvailableInstanceTypes.InstanceTypes.includes(instanceType))?.ZoneId;
    if (!zoneId) {
      throw new Error(`Instance type ${instanceType} is not available in region: ${regionId}`);
    }
    return zoneId;
  }

  private async doAction(service: ServiceRef, action: string, params: Record<string, string> = {}): Promise<any> {
    const finalParams: Record<string, string> = {
      Action: action,
      AccessKeyId: this.credentials.accessKeyId,
      SignatureMethod: "HMAC-SHA1",
      SignatureVersion: "1.0",
      SignatureNonce: Util.getNonce(),
      Timestamp: OpenApiUtil.getTimestamp(),
      Version: service.version,
      Format: "json",
      ...params,
    };

    finalParams["Signature"] = OpenApiUtil.getRPCSignature(finalParams, "GET", this.credentials.accessKeySecret);
    try {
      return (await this.http.get(`https://${service.name}.aliyuncs.com/`, { params: finalParams })).data;
    } catch (e) {
      const errorResponse: Response = e.response.data;
      e.errorCode = errorResponse.Code;
      e.errorMessage = errorResponse.Message;
      e.message = `ErrorCode: ${errorResponse.Code}; ErrorMessage: ${errorResponse.Message}`;
      throw e;
    }
  }

  private async findPagedResources<T, R extends PagedResponse>(
    service: ServiceRef,
    action: string,
    extractor: (response: any) => T[],
    params: Record<string, string> = {}
  ): Promise<T[]> {
    return findPagedResources(
      (pageable) => this.doAction(service, action, { PageNumber: (<number>pageable).toString(), ...params }),
      (previousPageable) => <number>previousPageable + 1,
      (response: R) => response.PageNumber * response.PageSize < response.TotalCount,
      extractor,
      1
    );
  }

  private deleteResources<T>(
    describeResources: () => Promise<T[]>,
    deleteHandler: (target: T) => Promise<true | void>
  ): Promise<void> {
    return waitCondition(async () => {
      const resources = await describeResources();
      let remain = false;
      try {
        for (const resource of resources) {
          const deleted = await deleteHandler(resource);
          if (!deleted) {
            remain = true;
          }
        }
      } catch (e) {
        if (e.errorCode.includes("DependencyViolation")) {
          remain = true;
        } else {
          throw e;
        }
      }
      return !remain;
    });
  }
}
