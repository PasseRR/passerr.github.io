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

以下配置中需要替换的地方

|名称|描述|
|:---|:---|
|**YOUR.GITLAB.COM**|你的gitlab地址|
|**PROJECT_NAME**|项目名称|
|**PROJECT_ID**|npm对应项目id|
|**YOUR_ACCESS_TOKEN**|对应项目/分组的access_token|

1. registry配置(两种方案)
- 使用`.npmrc`配置文件
```text
//YOUR.GITLAB.COM/api/v4/projects/PROJECT_ID/packages/npm/:_authToken=YOUR_ACCESS_TOKEN
@PROJECT_NAME:registry=http://YOUR.GITLAB.COM/api/v4/projects/PROJECT_ID/packages/npm/
```
- 使用命令行配置
```shell
# 设置所有PROJECT_NAME下的包对应的registry的url
npm config set @PROJECT_NAME:registry http://YOUR.GITLAB.COM/api/v4/projects/PROJECT_ID/packages/npm/
# 设置安装包地址
npm config set -- '//YOUR.GITLAB.COM/api/v4/projects/PROJECT_ID/packages/npm/:_authToken' "YOUR_ACCESS_TOKEN"
```

2. package.json示例
```json
{
  "name": "@PROJECT_NAME/test1",
  "version": "1.0.0",
  "description": "description",
  "main": "index.js",
  "dependencies": {
          "@PROJECT_NAME/test": "^1.0.0"
  },
  "scripts": {
          "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "author",
  "license": "ISC"
}
```

4. 发布/安装
```shell
# 发布包
npm publish
# 发布测试版本
npm publish --tag=beta
# 安装包
npm install
```