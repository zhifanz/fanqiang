import subprocess
from subprocess import TimeoutExpired, CalledProcessError, SubprocessError


def handler(environ, start_response):
    domain = environ['QUERY_STRING']
    response_body = 'domain name must be provided as query string'
    status = '400 Bad Request'
    if domain:
        try:
            rc = subprocess.run(['ping', '-c1', '-q', domain], timeout=30).returncode
            response_body = 'success' if rc == 0 else 'failed'
            status = '200 OK'
        except (TimeoutExpired, CalledProcessError):
            response_body = 'failed'
            status = '200 OK'
        except OSError as err:
            response_body = err.strerror
            status = '500 Internal Server Error'
        except SubprocessError:
            response_body = 'Internal Server Error'
            status = '500 Internal Server Error'

    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)

    return [response_body.encode()]
