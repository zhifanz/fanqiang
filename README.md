# Tunnel Proxy Auto Deployment - `fanqiang`

This project creates a command line tool that helps to automatically deploy a shadowsocks proxy on an AWS lightsail instance.

## Prerequisites

- Has **Nodejs** installed on local machine. See [download link][1] for more details.
- Has an AWS access token. See [manage AWS access token][2] for more details.

[1]: https://nodejs.org/en/
[2]: https://console.aws.amazon.com/iam/home#security_credential

## Installation

```
npm install --global fanqiang
```

## Command Usage

```
# fanqiang <command> [options]

Commands:
  create   Create new tunnel proxy infrastructures
  destroy  Destroy tunnel proxy infrastructures

Options:
  --region   AWS lightsail region for proxy deployment
                                                 [string] [default: "us-east-1"]
  --tunnelRegion  Aliyun region for tunnel deployment, for example: cn-shanghai
                                                                        [string]
  --output   Path for clash config file, only applicable for create command
                             [string] [default: "~/.config/clash/fanqiang.yaml"]
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

## Setup Credentials for AWS Services

You need to configure an AWS IAM user on the local machine before running any command listed above. So far, this tool
supports reading AWS credentials from <code>Shared Credentials File</code>:

- The shared credentials file on Linux, Unix, and macOS: ~/.aws/credentials
- The shared credentials file on Windows: C:\Users\USER_NAME\.aws\credentials

An example of credentials file:

```
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
```

Refer to [AWS SDK documentation][3] for more details on how to set up an AWS credentials file.

[3]: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html

## Setup Credentials for Aliyun Services

You need to configure an Aliyun RAM user on a local machine if you want to use --tunnelRegion option. So far, this tool
supports reading credentials from <code>$HOME/.aliyun/credentials</code>:

- The credentials file on Linux, Unix, and macOS: ~/.aliyun/credentials
- The credentials file on Windows: C:\Users\USER_NAME\.aliyun\credentials

An example of credentials file:

```
accessKeyId=<YOUR_ACCESS_KEY_ID>
accessKeySecret=<YOUR_SECRET_ACCESS_KEY>
```
