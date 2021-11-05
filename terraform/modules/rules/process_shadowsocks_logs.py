import base64
import json
import os
import zlib

import boto3

EVENT_LOG_PREFIX = 'DEBUG shadowsocks_service::server::tcprelay established tcp tunnel'


def substring_between(content, start, end):
    start_index = content.find(start)
    if start_index == -1:
        return None
    start_index += len(start)
    end_index = content.find(end, start_index)
    if end_index == -1:
        return None
    return content[start_index:end_index]


def extract_endpoint(log_message):
    if log_message.startswith(EVENT_LOG_PREFIX):
        endpoint = substring_between(log_message, '<->', ':')
        if endpoint:
            return endpoint.strip()
    return None


def decode_events(event):
    compressed_event_data = base64.standard_b64decode(event['awslogs']['data'])
    cloudwatch_logs_message = json.loads(zlib.decompress(compressed_event_data).decode())
    return cloudwatch_logs_message['logEvents']


def handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    for log_event in decode_events(event):
        log_message = log_event['message']
        endpoint = extract_endpoint(log_message)
        if endpoint:
            table.put_item(Item={
                'name': endpoint,
                'lastAccessTimestamp': log_event['timestamp'],
                'requireProxy': True
            })