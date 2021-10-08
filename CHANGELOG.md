# [2.4.0](https://github.com/zhifanz/fanqiang/compare/v2.3.0...v2.4.0) (2021-10-08)


### Features

* user can provide aws and aliyun credentials via command option ([2d097e3](https://github.com/zhifanz/fanqiang/commit/2d097e32c9afc588629d050cc7d3d9f81a830925))

# [2.3.0](https://github.com/zhifanz/fanqiang/compare/v2.2.1...v2.3.0) (2021-09-24)


### Features

* create command will wait until tunnel proxy service is ready ([7c37642](https://github.com/zhifanz/fanqiang/commit/7c376429e34a2a929d5abd6a6531143426cdcf16))

## [2.2.1](https://github.com/zhifanz/fanqiang/compare/v2.2.0...v2.2.1) (2021-09-24)


### Bug Fixes

* add nameserver for clash dns config ([2867919](https://github.com/zhifanz/fanqiang/commit/2867919f6fb171380b24b53528cfcc31dde7acd8))

# [2.2.0](https://github.com/zhifanz/fanqiang/compare/v2.1.1...v2.2.0) (2021-09-18)


### Features

* apply runnel based proxy for clash client ([3392d31](https://github.com/zhifanz/fanqiang/commit/3392d31254150b295fc74677a752621dac145292))

## [2.1.1](https://github.com/zhifanz/fanqiang/compare/v2.1.0...v2.1.1) (2021-09-17)


### Bug Fixes

* missing terraform folder in npm package ([69a7064](https://github.com/zhifanz/fanqiang/commit/69a706497b82e9199fb8e8c16a2eb7a85b83942c))

# [2.1.0](https://github.com/zhifanz/fanqiang/compare/v2.0.1...v2.1.0) (2021-09-17)


### Features

* provide option for specifying bucket name ([bf9d6b9](https://github.com/zhifanz/fanqiang/commit/bf9d6b942444c9c259bf62788d37c75f5c8de32c))

## [2.0.1](https://github.com/zhifanz/fanqiang/compare/v2.0.0...v2.0.1) (2021-09-17)


### Bug Fixes

* add extra step to install nginx stream module on ecs instance ([1376919](https://github.com/zhifanz/fanqiang/commit/1376919aab17239d5565fa3407d20124171ce175))

# [2.0.0](https://github.com/zhifanz/fanqiang/compare/v1.4.1...v2.0.0) (2021-09-16)


### Code Refactoring

* use terraform to create or destroy infrastructures ([8fd0e2d](https://github.com/zhifanz/fanqiang/commit/8fd0e2d0ace10a2c761e2d489677990458a1c4e0))


### BREAKING CHANGES

* remove options for deploying tunnel infrastructures

## [1.4.1](https://github.com/zhifanz/fanqiang/compare/v1.4.0...v1.4.1) (2021-08-27)


### Bug Fixes

* catch error by name when bucket already exists ([74b2c0b](https://github.com/zhifanz/fanqiang/commit/74b2c0b64514655b38a9252408e5284a19a18c4e))

# [1.4.0](https://github.com/zhifanz/fanqiang/compare/v1.3.0...v1.4.0) (2021-08-27)


### Features

* support download clash config from url ([e3f1882](https://github.com/zhifanz/fanqiang/commit/e3f18823963404cefb6be79e7ff0613ebcd2911d))

# [1.3.0](https://github.com/zhifanz/fanqiang/compare/v1.2.2...v1.3.0) (2021-08-20)


### Features

* auto provisioning strategy for tunnel deployment ([d52f51a](https://github.com/zhifanz/fanqiang/commit/d52f51a21f5108ef19c28524a63db37e03bf08a2))

## [1.2.2](https://github.com/zhifanz/fanqiang/compare/v1.2.1...v1.2.2) (2021-08-14)


### Bug Fixes

* use correct api name for create resource group operation ([06db786](https://github.com/zhifanz/fanqiang/commit/06db786035ca9c11bde4a331c73e5d35d934cef7))

## [1.2.1](https://github.com/zhifanz/fanqiang/compare/v1.2.0...v1.2.1) (2021-08-13)


### Bug Fixes

* remove hard coded keypair name when creating aliyun ecs instance ([9f5c89e](https://github.com/zhifanz/fanqiang/commit/9f5c89eb86e66be0b5eb23ed906b514a4be98661))
