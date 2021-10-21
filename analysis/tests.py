import logging
import tempfile
import unittest

import yaml

from analyzer import domain_available
from collector import substring_between
from common import default_argparser


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

    def test_yaml(self):
        content = """
        k1: v1
        k2: v2
        """
        result = yaml.load(content, Loader=yaml.FullLoader)
        self.assertEqual('v1', result['k1'])
        self.assertEqual('v2', result['k2'])

    def test_yaml_dump_array(self):
        output = yaml.dump({'payload': ['d1', 'd2']})
        self.assertEqual(output, 'payload:\n- d1\n- d2\n')

    def test_yaml_read_file(self):
        fp = tempfile.NamedTemporaryFile(mode='w')
        fp.write("""
        a: 1
        b: c
        """)
        fp.flush()
        with open(fp.name, 'r') as f:
            result = yaml.load(f, Loader=yaml.FullLoader)
        self.assertEqual(1, result['a'])
        self.assertEqual('c', result['b'])

    def test_yaml_write_file(self):
        fp = tempfile.NamedTemporaryFile(mode='w')
        yaml.dump({'a': 1}, fp)
        fp.flush()
        with open(fp.name, 'r') as f:
            self.assertEqual('a: 1', f.read().strip())


if __name__ == '__main__':
    unittest.main()
