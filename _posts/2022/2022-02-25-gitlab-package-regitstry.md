---
layout: post
title:  Gitlab Package Registry搭建maven及npm私服
categories: [ci]
last_modified_at: 2022-02-25
---

## 开启Package Registry
1. 配置`gitlab.rb`
```ruby
# 开启package
gitlab_rails['packages_enabled'] = true
# 设置保存路径
gitlab_rails['packages_storage_path'] = "/mnt/packages"
```

2. 仓库开启Package Registry

    仓库/分组 -> Settings -> General -> Visibility, project features, permissions -> 开启Packages

## 准备工作
gitlab支持每个仓库独立的Package管理，但是便于package查找，按照`maven`和`npm`类别，分别创建两个仓库管理对应的包。

1. 创建一个内部的`package-registry`组
2. 生成一个用于包发布的`Group Access Token`

    Settings -> Access Token -> 选择scope中的`api` -> 生成token并复制
3. 分别创建`maven-packages`和`npm-packages`两个仓库，并记录对应的项目id

## maven
1. settings.xml配置
    ```xml
    <server>
        <id>gitlab-maven</id>
        <configuration>
            <httpHeaders>
                <property>
                    <name>Private-Token</name>
                    <!-- 复制的token -->
                    <value>YOUR_ACCESS_TOKEN</value>
                </property>
            </httpHeaders>
        </configuration>
    </server>
    ```
2. pom.xml配置

   `$PROJECT_ID`对应为创建的maven-packages仓库的项目id
    ```xml
    <!-- 发布包仓库配置 -->
    <distributionManagement>
        <repository>
            <id>gitlab-maven</id>
            <url>http://your.gitlab.com/api/v4/projects/$PROJECT_ID/packages/maven</url>
        </repository>
        <snapshotRepository>
            <id>gitlab-maven</id>
            <url>http://your.gitlab.com/api/v4/projects/$PROJECT_ID/packages/maven</url>
        </snapshotRepository>
    </distributionManagement>
    
    <!-- 获取包仓库配置 -->
    <repositories>
        <repository>
            <id>gitlab-maven</id>
            <url>http://your.gitlab.com/api/v4/projects/$PROJECT_ID/packages/maven</url>
        </repository>
    </repositories>
    ```

## npm
待完成