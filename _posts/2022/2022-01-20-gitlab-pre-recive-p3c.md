---
layout: post
title:  Gitlab集成P3C代码规约检测
mermaid: true
categories: [ci, operation]
last_modified_at: 2022-01-20
---

## 前言
公司需要对java代码进行静态代码检测，需要满足[阿里规约](https://github.com/alibaba/p3c){:target="_blank"}，
但对一些已有的仓库不进行检测，考虑使用Gitlab的server hook的pre-receive实现，在代码提交时对java文件进行代码检测。
本文Gitlab服务器使用的是CentOS，其他Linux环境自行对照。

## 阿里规约准备
1. 编译最新p3c-pmd模块获得[pmd包](/asserts/2022/01-20/p3c-pmd-2.1.1-jar-with-dependencies.jar){:target="_blank"}

2. 编写[规则集xml文件](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/asserts/2022/01-20/ali-p3c.xml){:target="_blank"}，根据需要置顶规则

    ```xml
    <?xml version="1.0"?>
    <ruleset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="alibaba-pmd"
             xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
             xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 http://pmd.sourceforge.net/ruleset_2_0_0.xsd">
        <description>p3c rule set</description>
        <rule ref="rulesets/java/ali-concurrent.xml"/>
        <rule ref="rulesets/java/ali-comment.xml"/>
        <rule ref="rulesets/java/ali-constant.xml"/>
        <rule ref="rulesets/java/ali-exception.xml"/>
        <rule ref="rulesets/java/ali-flowcontrol.xml"/>
        <rule ref="rulesets/java/ali-naming.xml">
            <!-- 去掉抽象类命名规范-->
            <exclude name="AbstractClassShouldStartWithAbstractNamingRule"/>
            <!-- 去掉测试用例命名规范 -->
            <exclude name="TestClassShouldEndWithTestNamingRule"/>
        </rule>
        <rule ref="rulesets/java/ali-other.xml"/>
        <rule ref="rulesets/java/ali-orm.xml"/>
        <rule ref="rulesets/java/ali-oop.xml"/>
        <rule ref="rulesets/java/ali-set.xml"/>
    </ruleset>
    ```

## Gitlab Server Hook配置

1. 修改`/etc/gitlab/gitlab.rb`配置
```ruby
# gitlab_rails['custom_hooks_dir']已过期配置
gitaly['custom_hooks_dir'] = "/opt/gitlab/embedded/service/gitlab-shell/hooks"
```

2. 添加`custom_hooks_dir`目录
```shell
cd /opt/gitlab/embedded/service/gitlab-shell
mkdir hooks
cd hooks
# 移动ali-p3c.xml到hooks目录
mv ali-p3c.xml .
# 移动pmd包到hooks目录
mv p3c-pmd-2.1.1-jar-with-dependencies.jar .
# 创建前置钩子文件夹 文件夹只能名为pre-receive.d、post-receive.d、update.d
# 分别对应前置、后置、处理中钩子
mkdir pre-receive.d
```

3. 创建代码检测钩子脚本p3c-pre-inspect.sh

    ```shell
    #!/bin/sh
    # 检测标识文件
    hit_file=".pre-check"
    # 临时目录
    temp_dir="temp-${GL_ID}"
    # pmd路径
    pmd_dir=/opt/gitlab/embedded/service/gitlab-shell/hooks
    # 初始commit id
    zero_commit="0000000000000000000000000000000000000000"
    # 拒绝数量
    reject=0
    
    while read oldrev newrev refname; do
        # 分支或者tag被删除
        if [ "$newrev" = "$zero_commit" ]; then
          continue
        fi
    
        git cat-file -e ${refname}:${hit_file}
        # 当前分支不存在静态检测文件
        if [ $? -ne 0 ]; then
            # 当次提交不存在静态检测文件 跳过检测
            git cat-file ${newrev}:${hit_file}
            if [ $? -ne 0 ]; then
                break
            fi
        fi
    
        files=`git diff --name-only ${oldrev} ${newrev}  | grep -e ".java$"`
        if [ -n "$files" ]; then
          # 缓存java文件
          for file in ${files}; do
            mkdir -p "${temp_dir}/`dirname ${file}`" >/dev/null
            git show $newrev:$file > ${temp_dir}/${file}
          done;
    
          # 检测缓存目录的文件
          java -Dfile.encoding=utf8 -cp ${pmd_dir}/p3c-pmd-2.1.1-jar-with-dependencies.jar net.sourceforge.pmd.PMD -d ${temp_dir} -R ${pmd_dir}/ali-p3c.xml -f text -shortnames -no-cache
          # 失败记录数
          reject=$?
    
          if [ $reject = 0 ] ;then
            echo "代码通过静态检测!"
          fi
    
          # 删除临时目录
          rm -rf $temp_dir
        fi
    done
    
    exit $reject
    ```

    修改脚本权限为可执行
    ```shell
    chmod 777 p3c-pre-inspect.sh
    ```

4. 安装JRE环境
```shell
# 查询合适的jdk版本
yum search java | grep jdk
yum install -y java-1.8.0-openjdk.x86_64
# 安装验证
java -version
```

## 验证钩子
![图片](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/asserts/2022/01-20/hook.png)