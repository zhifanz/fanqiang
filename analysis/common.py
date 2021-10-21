import argparse
import logging

import boto3


def default_argparser():
    parser = argparse.ArgumentParser()
    parser.add_argument('--region',
                        help='aws sqs region name',
                        default='us-east-1')
    parser.add_argument('--queue',
                        help='aws sqs queue name',
                        default='fanqiang')
    parser.add_argument('--log',
                        help='logging level',
                        default=logging.getLevelName(logging.INFO),
                        choices=[
                            logging.getLevelName(x) for x in [
                                logging.CRITICAL, logging.ERROR,
                                logging.WARNING, logging.INFO, logging.DEBUG
                            ]
                        ])
    return parser


def config_logging(level_name):
    logging.basicConfig(level=getattr(logging, level_name))


def default_config():
    args = default_argparser().parse_args()
    config_logging(args.log)
    return args


def with_queue(region, queue_name, callback, *arguments):
    sqs = boto3.resource('sqs', region_name=region)
    queue = sqs.get_queue_by_name(QueueName=queue_name)
    callback(queue, *arguments)
