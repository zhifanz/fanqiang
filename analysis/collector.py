#!/usr/bin/env python3

import logging
import sys

from common import default_config, with_queue

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


def parse_log_message(queue):
    logging.info('start parsing shadowsocks log from stdio...')
    for line in sys.stdin:
        endpoint = extract_endpoint(line)
        if endpoint:
            response = queue.send_message(MessageBody=endpoint)
            if logging.root.level == logging.DEBUG:
                logging.debug(
                    f"MessageId: {response.get('MessageId')}, MessageBody: {endpoint}"
                )
    logging.info('reached the end of log, parse completed.')


def main():
    args = default_config()
    with_queue(args.region, args.queue, parse_log_message)


if __name__ == "__main__":
    main()
