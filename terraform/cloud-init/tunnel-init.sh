#!/bin/bash

PROXY_ADDRESS=${proxy_address}
PROXY_PORT=${proxy_port}
ELASTIC_IP_ALLOCATION_ID=${elastic_ip_allocation_id}
REGION=${region}
RAM_ROLE_NAME=${ram_role_name}

aliyun configure set --region $REGION --mode EcsRamRole --ram-role-name $RAM_ROLE_NAME
aliyun --endpoint "vpc-vpc.$REGION.aliyuncs.com" vpc UnassociateEipAddress --AllocationId $ELASTIC_IP_ALLOCATION_ID || true
aliyun --endpoint "vpc-vpc.$REGION.aliyuncs.com" vpc AssociateEipAddress --AllocationId $ELASTIC_IP_ALLOCATION_ID --InstanceId "i-$${HOSTNAME: 2: 20}"
echo "waiting for eip to be in effect..."
sleep 5

echo "installing nginx..."
yum install nginx -y &>> ~/cloud-init.log
yum install nginx-all-modules -y &>> ~/cloud-init.log

echo "setup nginx config..."
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

echo "start nginx service..."
systemctl start nginx.service
