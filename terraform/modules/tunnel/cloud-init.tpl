#!/bin/bash

PROXY_PORT=${proxy_port}
PROXY_ADDRESS=${proxy_address}
ELASTIC_IP_ALLOCATION_ID=${elastic_ip_allocation_id}
ANALYSIS_QUEUE_NAME=${analysis_queue_name}
ANALYSIS_QUEUE_REGION=${analysis_queue_region}
ANALYSIS_BUNDLE_URL=${analysis_bundle_url}
S3_BUCKET=${s3_bucket}
S3_RULES_KEY=${s3_rules_key}
export AWS_ACCESS_KEY_ID=${analysis_aws_access_key_id}
export AWS_SECRET_ACCESS_KEY=${analysis_aws_secret_access_key}


REGION="$(curl --silent http://100.100.100.200/latest/meta-data/region-id)"
aliyun configure set --region $REGION --mode EcsRamRole \
  --ram-role-name "$(curl --silent http://100.100.100.200/latest/meta-data/ram/security-credentials/)"
aliyun --endpoint "vpc-vpc.$REGION.aliyuncs.com" vpc AssociateEipAddress \
  --AllocationId $ELASTIC_IP_ALLOCATION_ID \
  --InstanceId "$(curl --silent http://100.100.100.200/latest/meta-data/instance-id)"

until ping -c1 aliyun.com &>/dev/null ; do sleep 1 ; done

yum install -y nginx nginx-all-modules python3

cat > /etc/nginx/nginx.conf <<EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
  worker_connections 1024;
}

stream {
  server {
    listen $PROXY_PORT;
    proxy_pass $PROXY_ADDRESS:$PROXY_PORT;
  }
}
EOF

systemctl start nginx

if [ -n "$ANALYSIS_QUEUE_NAME" ]
then
    mkdir -p /var/lib/fanqiang-analysis /var/log/fanqiang-analysis /root/.config/clash
    echo "rules: []" > /root/.config/clash/fanqiang.yaml
    curl "$ANALYSIS_BUNDLE_URL" | tar --extract --gzip --file=- --directory=/var/lib/fanqiang-analysis
    chmod a+x /var/lib/fanqiang-analysis/analyzer.py
    pip3 install -r /var/lib/fanqiang-analysis/requirements.txt
    /var/lib/fanqiang-analysis/analyzer.py \
        --region="$ANALYSIS_QUEUE_REGION" \
        --queue="$ANALYSIS_QUEUE_NAME" \
        --log=DEBUG \
        "$S3_BUCKET" "$S3_RULES_KEY" &> /var/log/fanqiang-analysis/analyzer.log
fi
