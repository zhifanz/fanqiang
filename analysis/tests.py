import logging
import unittest

import yaml

from analyzer import domain_available
from common import default_argparser
from process_shadowsocks_logs import substring_between


class TestMain(unittest.TestCase):
    def test_substring_between(self):
        self.assertEqual('234', substring_between('1,234.5', ',', '.'))
        self.assertEqual('', substring_between('1,.5', ',', '.'))
        self.assertEqual('234', substring_between('1,234,5', ',', ','))
        self.assertIsNone(substring_between('1,234.5', '.', ','))

    def test_argparse(self):
        parser = default_argparser()
        parser.add_argument('extra')
        args = parser.parse_args(['--log=DEBUG', 'pa'])
        self.assertEqual('DEBUG', args.log)
        self.assertEqual('fanqiang', args.queue)
        self.assertEqual('us-east-1', args.region)
        self.assertEqual('pa', args.extra)

    def test_getattr(self):
        self.assertEqual(logging.DEBUG, getattr(logging, 'DEBUG'))

    def test_host_available(self):
        self.assertTrue(domain_available('baidu.com'))
        self.assertFalse(domain_available('unknown.domain'))

    def test_yaml_dump_array(self):
        output = yaml.dump({'payload': ['d1', 'd2']})
        self.assertEqual(output, 'payload:\n- d1\n- d2\n')


if __name__ == '__main__':
    unittest.main()
