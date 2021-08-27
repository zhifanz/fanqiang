import { AxiosInstance } from "axios";
import { AliyunCredentials } from "./credentials";
import OpenApiUtil from "@alicloud/openapi-util";
import Util from "@alicloud/tea-util";
import { findPagedResources } from "../cloudServiceOperations";

type Response = { RequestId: string; Code?: string; Message?: string };
type PagedResponse = { TotalCount: number; PageSize: number; PageNumber: number } & Response;

export type ParameterType = Record<string, string>;
export type ResourceGroup = { Status: string; Name: string; Id: string };
export type Vpc = { VpcId: string; CidrBlock: string; Status?: string };
export type VSwitch = { VSwitchId: string; Status?: string };
export type Zone = { AvailableInstanceTypes: { InstanceTypes: string[] }; ZoneId: string };
export type Instance = { InstanceId: string; Status?: string };
export type SecurityGroup = { SecurityGroupId: string };
export type Eip = { EipAddress: string; AllocationId: string };
export type Execution = { ExecutionId: string; Status: string };
export type AutoProvisioningGroup = { AutoProvisioningGroupId: string };
export type Policy = { PolicyName: string; PolicyType: string };
export type RamRole = { RoleName: string };
export type User = { UserId: string };

export class AliyunOperations {
  constructor(private readonly http: AxiosInstance, private readonly credentials: AliyunCredentials) {}

  describeSecurityGroups(RegionId: string, params: ParameterType = {}): Promise<SecurityGroup[]> {
    return this.findPagedResources(
      this.callEcs,
      "DescribeSecurityGroups",
      (r: any) => r.SecurityGroups?.SecurityGroup,
      { RegionId, ...params }
    );
  }

  createSecurityGroup(RegionId: string, params: ParameterType = {}): Promise<SecurityGroup> {
    return this.callEcs("CreateSecurityGroup", { RegionId, ...params });
  }

  async authorizeSecurityGroup(
    IpProtocol: string,
    PortRange: string,
    RegionId: string,
    SecurityGroupId: string,
    params: ParameterType = {}
  ): Promise<void> {
    await this.callEcs("AuthorizeSecurityGroup", { IpProtocol, PortRange, RegionId, SecurityGroupId, ...params });
  }

  async deleteSecurityGroup(RegionId: string, SecurityGroupId: string): Promise<void> {
    await this.callEcs("DeleteSecurityGroup", { RegionId, SecurityGroupId });
  }

  async allocatePublicIpAddress(InstanceId: string, params: ParameterType = {}): Promise<string> {
    return (await this.callEcs("AllocatePublicIpAddress", { InstanceId, ...params })).IpAddress;
  }

  describeInstances(RegionId: string, params: ParameterType = {}): Promise<Instance[]> {
    return findPagedResources(
      (p?: { PageNumber: number; NextToken?: string }) => {
        const mergedParams: ParameterType = { RegionId, ...params };
        if (p) {
          mergedParams.PageNumber = p.PageNumber.toString();
        }
        if (p?.NextToken) {
          mergedParams.NextToken = p.NextToken;
        }
        return this.callEcs("DescribeInstances", mergedParams);
      },
      (p, r) => ({ PageNumber: r.PageNumber + 1, NextToken: r.NextToken }),
      (r: any) => r.PageNumber * r.PageSize < r.TotalCount,
      (r: any) => r.Instances.Instance,
      { PageNumber: 1 }
    );
  }

  async describeInstanceStatus(
    RegionId: string,
    InstanceIdN: string[],
    params: ParameterType = {}
  ): Promise<Required<Instance>[]> {
    return this.findPagedResources(
      this.callEcs,
      "DescribeInstanceStatus",
      (r: any) => r.InstanceStatuses?.InstanceStatus,
      { RegionId, ...flatten("InstanceId", InstanceIdN), ...params }
    );
  }

  async createInstance(InstanceType: string, RegionId: string, params: ParameterType = {}): Promise<Instance> {
    return this.callEcs("CreateInstance", { InstanceType, RegionId, ...params });
  }

  async createAutoProvisioningGroup(
    RegionId: string,
    TotalTargetCapacity: string,
    params: ParameterType = {}
  ): Promise<void> {
    await this.callEcs("CreateAutoProvisioningGroup", { RegionId, TotalTargetCapacity, ...params });
  }

  async startInstance(InstanceId: string, params: ParameterType = {}): Promise<void> {
    await this.callEcs("StartInstance", { InstanceId, ...params });
  }

  async deleteInstance(InstanceId: string, params: ParameterType = {}): Promise<void> {
    await this.callEcs("DeleteInstance", { InstanceId, ...params });
  }

  async deleteInstances(InstanceIdN: string[], RegionId: string, params: ParameterType = {}): Promise<void> {
    if (!InstanceIdN.length) {
      return;
    }
    await this.callEcs("DeleteInstances", { RegionId, ...flatten("InstanceId", InstanceIdN), ...params });
  }

  async describeAutoProvisioningGroups(RegionId: string, params: ParameterType = {}): Promise<AutoProvisioningGroup[]> {
    return this.findPagedResources(
      this.callEcs,
      "DescribeAutoProvisioningGroups",
      (r: any) => r.AutoProvisioningGroups.AutoProvisioningGroup,
      { RegionId, ...params }
    );
  }

  async deleteAutoProvisioningGroup(
    AutoProvisioningGroupId: string,
    RegionId: string,
    TerminateInstances: boolean
  ): Promise<void> {
    await this.callEcs("DeleteAutoProvisioningGroup", {
      AutoProvisioningGroupId,
      RegionId,
      TerminateInstances: TerminateInstances.toString(),
    });
  }

  async describeZones(RegionId: string, params: ParameterType = {}): Promise<Zone[]> {
    return (await this.callEcs("DescribeZones", { RegionId, ...params })).Zones.Zone;
  }

  private callEcs(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "ecs", version: "2014-05-26" }, action, params);
  }

  describeVpcAttribute(RegionId: string, VpcId: string, params: ParameterType = {}): Promise<Vpc> {
    return this.callVpc("DescribeVpcAttribute", { RegionId, VpcId, ...params });
  }

  describeVpcs(RegionId: string, params: ParameterType = {}): Promise<Vpc[]> {
    return this.findPagedResources(this.callVpc, "DescribeVpcs", (r: any) => r.Vpcs.Vpc, { RegionId, ...params });
  }

  async createVpc(RegionId: string, params: ParameterType = {}): Promise<Vpc> {
    let cidrBlock = params.CidrBlock;
    if (!cidrBlock) {
      cidrBlock = "172.16.0.0/12";
      params.CidrBlock = cidrBlock;
    }
    const callResult = await this.callVpc("CreateVpc", { RegionId, ...params });
    return {
      CidrBlock: cidrBlock,
      ...callResult,
    };
  }

  deleteVpc(VpcId: string, RegionId: string): Promise<void> {
    return this.callVpc("DeleteVpc", { VpcId, RegionId });
  }

  describeVSwitchAttributes(RegionId: string, VSwitchId: string): Promise<VSwitch> {
    return this.callVpc("DescribeVSwitchAttributes", { RegionId, VSwitchId });
  }

  describeVSwitches(RegionId: string, params: ParameterType = {}): Promise<VSwitch[]> {
    return this.findPagedResources(this.callVpc, "DescribeVSwitches", (r: any) => r.VSwitches.VSwitch, {
      RegionId,
      ...params,
    });
  }

  createVSwitch(
    CidrBlock: string,
    VpcId: string,
    ZoneId: string,
    RegionId: string,
    params: ParameterType = {}
  ): Promise<VSwitch> {
    return this.callVpc("CreateVSwitch", { CidrBlock, VpcId, ZoneId, RegionId, ...params });
  }

  deleteVSwitch(RegionId: string, VSwitchId: string): Promise<void> {
    return this.callVpc("DeleteVSwitch", { RegionId, VSwitchId });
  }

  describeEipAddresses(RegionId: string, params: ParameterType = {}): Promise<Eip[]> {
    return this.findPagedResources(this.callVpc, "DescribeEipAddresses", (r: any) => r.EipAddresses.EipAddress, {
      RegionId,
      ...params,
    });
  }

  allocateEipAddress(RegionId: string, params: ParameterType = {}): Promise<Eip> {
    return this.callVpc("AllocateEipAddress", { RegionId, ...params });
  }

  async releaseEipAddress(AllocationId: string, RegionId: string): Promise<void> {
    await this.callVpc("ReleaseEipAddress", { AllocationId, RegionId });
  }

  private callVpc(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "vpc", version: "2016-04-28" }, action, params);
  }

  async createResourceGroup(Name: string, DisplayName: string): Promise<ResourceGroup> {
    return (await this.callResourceManager("CreateResourceGroup", { Name, DisplayName })).ResourceGroup;
  }

  listResourceGroups(params: ParameterType = {}): Promise<ResourceGroup[]> {
    return this.findPagedResources(
      this.callResourceManager,
      "ListResourceGroups",
      (r: any) => r.ResourceGroups?.ResourceGroup,
      params
    );
  }

  private callResourceManager(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "resourcemanager", version: "2020-03-31" }, action, params);
  }

  async getRole(RoleName: string): Promise<RamRole> {
    return (await this.callRam("GetRole", { RoleName })).Role;
  }

  async createRole(RoleName: string, AssumeRolePolicyDocument: string, params: ParameterType = {}): Promise<void> {
    await this.callRam("CreateRole", { RoleName, AssumeRolePolicyDocument, ...params });
  }

  async deleteRole(RoleName: string): Promise<void> {
    await this.callRam("DeleteRole", { RoleName });
  }

  async listPoliciesForRole(RoleName: string): Promise<Policy[]> {
    return (await this.callRam("ListPoliciesForRole", { RoleName })).Policies.Policy;
  }

  async attachPolicyToRole(PolicyName: string, PolicyType: string, RoleName: string): Promise<void> {
    await this.callRam("AttachPolicyToRole", { PolicyName, PolicyType, RoleName });
  }

  async detachPolicyFromRole(PolicyName: string, PolicyType: string, RoleName: string): Promise<void> {
    await this.callRam("DetachPolicyFromRole", { PolicyName, PolicyType, RoleName });
  }

  private callRam(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "ram", version: "2015-05-01" }, action, params);
  }

  async getUser(): Promise<User> {
    return (await this.callIms("GetUser", { UserAccessKeyId: this.credentials.accessKeyId })).User;
  }

  private callIms(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "ims", version: "2019-08-15" }, action, params);
  }

  listExecutions(RegionId: string, params: ParameterType = {}): Promise<Execution[]> {
    return findPagedResources(
      (NextToken?: string) => {
        const mappedParams: ParameterType = { RegionId, ...params };
        if (NextToken) {
          mappedParams["NextToken"] = NextToken;
        }
        return this.callOos("ListExecutions", mappedParams);
      },
      (p, r) => r.NextToken,
      (r) => !!r.NextToken,
      (r: any) => r.Executions
    );
  }

  async getTemplate(TemplateName: string, RegionId: string, params: ParameterType = {}): Promise<any> {
    return (await this.callOos("GetTemplate", { TemplateName, RegionId, ...params })).Template;
  }

  async createTemplate(
    Content: string,
    TemplateName: string,
    RegionId: string,
    params: ParameterType = {}
  ): Promise<void> {
    await this.callOos("CreateTemplate", { Content, TemplateName, RegionId, ...params });
  }

  async deleteTemplate(TemplateName: string, RegionId: string, params: ParameterType = {}): Promise<void> {
    await this.callOos("DeleteTemplate", { TemplateName, RegionId, ...params });
  }

  async startExecution(RegionId: string, TemplateName: string, params: ParameterType = {}): Promise<Execution> {
    return (await this.callOos("StartExecution", { RegionId, TemplateName, ...params })).Execution;
  }

  async triggerExecution(Content: string, ExecutionId: string, RegionId: string, Type: string): Promise<void> {
    await this.callOos("TriggerExecution", { Content, ExecutionId, RegionId, Type });
  }

  async cancelExecution(ExecutionId: string, RegionId: string): Promise<void> {
    await this.callOos("CancelExecution", { ExecutionId, RegionId });
  }

  async deleteExecutions(ExecutionIds: string[], RegionId: string): Promise<void> {
    await this.callOos("DeleteExecutions", { ExecutionIds: JSON.stringify(ExecutionIds), RegionId });
  }

  private callOos(action: string, params: ParameterType = {}): Promise<any> {
    return this.callRpc({ name: "oos." + params.RegionId, version: "2019-06-01" }, action, params);
  }

  private async callRpc(
    service: { name: string; version: string },
    action: string,
    params: ParameterType = {}
  ): Promise<any> {
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

    finalParams.Signature = OpenApiUtil.getRPCSignature(finalParams, "GET", this.credentials.accessKeySecret);
    try {
      return (await this.http.get(`https://${service.name}.aliyuncs.com/`, { params: finalParams })).data;
    } catch (err) {
      const errorResponse: Response = err.response.data;
      const wrappedError = new Error(`ErrorCode: ${errorResponse.Code}; ErrorMessage: ${errorResponse.Message}`);
      wrappedError.name = <string>errorResponse.Code;
      Error.captureStackTrace(wrappedError);
      throw wrappedError;
    }
  }

  private findPagedResources<T, R extends PagedResponse>(
    callSpec: (action: string, params: ParameterType) => Promise<any>,
    action: string,
    extractor: (response: R) => T[] | undefined,
    params: ParameterType = {}
  ): Promise<T[]> {
    return findPagedResources(
      (pageable) => callSpec.bind(this)(action, { PageNumber: (<number>pageable).toString(), ...params }),
      (previousPageable) => <number>previousPageable + 1,
      (response: R) => response.PageNumber * response.PageSize < response.TotalCount,
      extractor,
      1
    );
  }
}

function flatten(prefix: string, values: string[]): ParameterType {
  return values.reduce((p: ParameterType, c, i) => {
    p[`${prefix}.${i + 1}`] = c;
    return p;
  }, {});
}
