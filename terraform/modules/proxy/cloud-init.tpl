PORT=${port}
ENCRYPTION_ALGORITHM=${encryption_algorithm}
PASSWORD=${password}
ANALYSIS_QUEUE_NAME=${analysis_queue_name}
ANALYSIS_BUNDLE_URL=${analysis_bundle_url}
export AWS_ACCESS_KEY_ID=${analysis_aws_access_key_id}
export AWS_SECRET_ACCESS_KEY=${analysis_aws_secret_access_key}


mkdir -p /etc/shadowsocks /var/lib/shadowsocks /var/log/shadowsocks /var/lib/fanqiang-analysis /var/log/fanqiang-analysis
export PATH=$PATH:/var/lib/shadowsocks:/var/lib/fanqiang-analysis
until ping -c1 github.com &>/dev/null ; do sleep 1 ; done

curl --location https://github.com/shadowsocks/shadowsocks-rust/releases/download/v1.11.1/shadowsocks-v1.11.1.x86_64-unknown-linux-gnu.tar.xz \
  | tar --extract --xz --file=- --directory=/var/lib/shadowsocks

cat > /etc/shadowsocks/log4rs.yml <<EOF
appenders:
  stdout:
    kind: console
    encoder:
      pattern: "{l} {M} {m}{n}"

root:
  level: debug
  appenders:
    - stdout
EOF

if [ -n "$ANALYSIS_QUEUE_NAME" ]
then
    yum install python3 jq -y
    curl $ANALYSIS_BUNDLE_URL | tar --extract --gzip --file=- --directory=/var/lib/fanqiang-analysis
    chmod a+x /var/lib/fanqiang-analysis/collector.py
    pip3 install -r /var/lib/fanqiang-analysis/requirements.txt
    ssserver -s "[::]:$PORT" -m "$ENCRYPTION_ALGORITHM" -k "$PASSWORD" --log-config /etc/shadowsocks/log4rs.yml \
    | collector.py --region=$(jq --raw-output .v1.region /run/cloud-init/instance-data.json) \
        --queue=$ANALYSIS_QUEUE_NAME &> /var/log/fanqiang-analysis/collector.log &
else
    ssserver -s "[::]:$PORT" -m "$ENCRYPTION_ALGORITHM" -k "$PASSWORD" -d
fi
