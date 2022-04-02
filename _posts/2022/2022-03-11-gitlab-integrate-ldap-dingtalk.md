---
layout: post
title:  Gitlab集成ldap登录及钉钉扫码登录
categories: [operation]
last_modified_at: 2022-03-11
---

## 集成LDAP
1. 修改`gitlab.rb`配置
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
        # ldap用户dn
        bind_dn: 'cn=admin,dc=hightop,dc=com'
        # rootDN密码
        password: 'mima'
        encryption: 'plain' # "start_tls" or "simple_tls" or "plain"
        verify_certificates: false
        allow_username_or_email_login: true
        # 创建的用户自动锁定
        #block_auto_created_users: false
        # 对接用户dn objectClass应为inetOrgPerson
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
2. 重新配置生效
    ```shell
    gitlab-ctl reconfigure
    ```

## 集成钉钉扫码登录
1. 创建钉钉应用，记录`appKey`和`appSecret`
2. 修改`gitlab.rb`配置
    ```ruby
    gitlab_rails['omniauth_providers'] = [
        {
          name: "dingtalk",
          # 登录按钮展示名称
          label: "钉钉",
          app_id: "appKey",
          app_secret: "appSecret"
        }
      ]
    ```

3. 已有LDAP扫码登录

    需要保证ldap中uid为为钉钉用户API中的`userId`，非LDAP用户需要自行扫码绑定钉钉帐号

4. 将已有用户和ldap用户绑定

    将已有用户邮箱修改为ldap中的邮箱地址，然后ldap可正常登陆，原有用户也可以进行标准登陆，且支持钉钉扫码

5. 重新配置gitlab生效
    ```shell
    gitlab-ctl reconfigure
    ```
