PORT=${port}
ENCRYPTION_ALGORITHM=${encryption_algorithm}
PASSWORD=${password}

mkdir -p /etc/shadowsocks /var/lib/shadowsocks /var/log/shadowsocks
until ping -c1 github.com &>/dev/null ; do sleep 1 ; done

curl --location https://github.com/shadowsocks/shadowsocks-rust/releases/download/v1.11.1/shadowsocks-v1.11.1.x86_64-unknown-linux-gnu.tar.xz \
  | tar --extract --xz --file=- --directory=/var/lib/shadowsocks

cat > /etc/shadowsocks/log4rs.yml <<EOF
refresh_rate: 30 seconds
appenders:
  file:
    kind: rolling_file
    path: /var/log/shadowsocks/ssserver.log
    encoder:
      kind: pattern
      pattern: "{d} {h({l}):<5} {m}{n}"
    policy:
      trigger:
        kind: size
        limit: 10 mb
      roller:
        kind: fixed_window
        pattern: ssserver.{}.log
        count: 5
root:
  level: debug
  appenders:
    - file
EOF

/var/lib/shadowsocks/ssserver -s "[::]:$PORT" -m "$ENCRYPTION_ALGORITHM" -k "$PASSWORD" -d --log-config /etc/shadowsocks/log4rs.yml
