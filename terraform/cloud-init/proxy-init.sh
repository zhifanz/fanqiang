#!/bin/bash
PORT=${port}
ENCRYPTION_ALGORITHM=${encryption_algorithm}
PASSWORD=${password}

curl --location -o /tmp/shadowsocks.tar.xz https://github.com/shadowsocks/shadowsocks-rust/releases/download/v1.11.1/shadowsocks-v1.11.1.x86_64-unknown-linux-gnu.tar.xz
mkdir /var/lib/shadowsocks
tar -x -f /tmp/shadowsocks.tar.xz -C /var/lib/shadowsocks
/var/lib/shadowsocks/ssserver -s "[::]:$PORT" -m "$ENCRYPTION_ALGORITHM" -k "$PASSWORD" -d
