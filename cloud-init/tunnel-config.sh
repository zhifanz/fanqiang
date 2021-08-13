#!/bin/bash

yum install yum-utils -y
cat > /etc/yum.repos.d/nginx.repo <<EOF
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/8/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
EOF
yum install nginx -y
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
    listen $PORT;
    proxy_pass $PROXY_ADDRESS;
  }
}
EOF

systemctl start nginx.service
