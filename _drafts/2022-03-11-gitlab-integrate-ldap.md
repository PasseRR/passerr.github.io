---
layout: post
title:  Gitlab集成ldap登录
categories: [operation]
last_modified_at: 2022-03-11
---

```ruby
gitlab_rails['ldap_enabled'] = true
gitlab_rails['prevent_ldap_sign_in'] = false

###! **remember to close this block with 'EOS' below**
gitlab_rails['ldap_servers'] = YAML.load <<-'EOS'
  main: # 'main' is the GitLab 'provider ID' of this LDAP server
    label: 'LDAP登录'
    host: 'localhost'
    port: 389
    uid: 'cn'
    bind_dn: 'cn=admin,dc=hightop,dc=com'
    password: 'mima'
    encryption: 'plain' # "start_tls" or "simple_tls" or "plain"
    verify_certificates: false
    allow_username_or_email_login: true
    # 创建的用户自动锁定
    #block_auto_created_users: false
    base: 'ou=employee,dc=hightop,dc=com'
    # 用户过滤器
    #user_filter: ''
    # 用户密码对应userPassword字段
    attributes:
      username: 'cn'
      email:    'mail'
      name:       'sn'
      first_name: 'sn'
      last_name:  'sn'
EOS
```