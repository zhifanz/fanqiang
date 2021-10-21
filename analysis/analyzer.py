#!/usr/bin/env python3

import logging
import subprocess

import boto3
import yaml

from common import with_queue, default_argparser, config_logging


class ClashConfig:
    def __init__(self, bucket, rule_object_name):
        self._bucket = bucket
        self._rule_object_name = rule_object_name
        self._s3_client = boto3.client('s3')
        self._domains = []

    def accept(self, domain):
        if domain in self._domains:
            return
        self._domains.append(domain)
        self._s3_client.put_object(Body=yaml.dump({'payload': self._domains}),
                                   Bucket=self._bucket,
                                   Key=self._rule_object_name,
                                   ACL='public-read')


def domain_available(domain):
    if logging.root.level == logging.DEBUG:
        logging.debug(f'analyse network access latency for address: {domain}')
    proc = subprocess.run(['ping', '-c10', '-q', domain])
    return proc.returncode == 0


def process_queue(queue, bucket, object_name):
    cc = ClashConfig(bucket, object_name)
    logging.info('start consuming web access event from aws sqs...')
    while True:
        messages = queue.receive_messages()
        if len(messages) == 0:
            continue
        if logging.root.level == logging.DEBUG:
            logging.debug(f'received {len(messages)} message from aws sqs')
        for message in messages:
            domain = message.body
            available = domain_available(domain)
            if available and True:
                if logging.root.level == logging.DEBUG:
                    logging.debug(
                        f'host {domain} is available from CN domestic, add to direct list'
                    )
                cc.accept(domain)
            message.delete()
    logging.info('stopped running consumer service')


def main():
    parser = default_argparser()
    parser.add_argument('bucket', help='s3 bucket name')
    parser.add_argument('object_name', help='config file path in s3 bucket')
    args = parser.parse_args()
    config_logging(args.log)

    with_queue(args.region, args.queue, process_queue, args.bucket, args.object_name)


if __name__ == '__main__':
    main()
