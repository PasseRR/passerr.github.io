---
title:  Gitlab集成P3C代码规约检测
tags: [gitlab, ci/cd, 运维]
---

公司需要对java代码进行静态代码检测，需要满足[阿里规约](https://github.com/alibaba/p3c)，
但对一些已有的仓库不进行检测，考虑使用Gitlab的server hook的pre-receive实现，在代码提交时对java文件进行代码检测。
本文Gitlab服务器使用的是CentOS，其他Linux环境自行对照。

## 阿里规约准备

### 编译最新p3c-pmd模块
- 直接[pmd包](/assets/2022/01-20/p3c-pmd-2.1.1-jar-with-dependencies.jar)
- [下载](https://github.com/alibaba/p3c)官方最新代码编译

### 编写规则集xml文件

根据需要设定规则，[下载实例](/assets/2022/01-20/ali-p3c.xml)

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

### 1. 修改`/etc/gitlab/gitlab.rb`配置
```ruby
# gitlab_rails['custom_hooks_dir']已过期配置
gitaly['custom_hooks_dir'] = "/opt/gitlab/embedded/service/gitlab-shell/hooks"
```

### 2. 重新配置Gitlab服务
```shell
gitlab-ctl reconfigure
```

### 3. 添加`custom_hooks_dir`目录
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

### 4. 在pre-receive.d目录下创建代码检测钩子脚本p3c-pre-inspect.sh

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
   
### 5. 自动创建检测标识文件钩子
`/opt/gitlab/embedded/service/gitlab-rails/file_hooks`目录下创建`add_pre_check_on_project_create.rb`[钩子文件](/assets/2022/01-20/add_pre_check_on_project_create.rb)，根据需要设定规则，
每当项目创建时，会自动提交一个新的.pre-check文件到仓库，当前使用的是web api提交标识文件到仓库，
不知道是否存在钩子之类的后置操作，**目前暂时没有想到其他更好的解决方案，如果你有，请你联系我**。

```ruby
#!/opt/gitlab/embedded/bin/ruby

require 'net/http'
require 'uri'
require 'json'

ARGS = JSON.parse($stdin.read)
# 仅当项目创建时才添加.pre-check文件
if ARGS['event_name'] == 'project_create'
    # 设置对应gitlab服务端口
    uri = URI.parse("http://localhost/api/v4/projects/#{ARGS['project_id']}/repository/files/#{URI::encode('.pre-check')}")
    
    header = {
        'Content-Type': 'application/json',
        # 设置管理员用户的令牌
        'PRIVATE-TOKEN': 'glpat-xd1xKRCj99s9NTyZNR1N'
    }
    
    data = {
        branch: 'master',
        content: '',
        commit_message: 'init pre check commit'
    }
    
    # Create the HTTP objects
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri.request_uri, header)
    request.body = data.to_json
    
    # Send the request
    response = http.request(request)
end
```

修改文件权限为可执行
```shell
chmod 777 add_pre_check_on_project_create.rb
```

### 6. 安装JRE环境
```shell
# 查询合适的jdk版本
yum search java | grep jdk
yum install -y java-1.8.0-openjdk.x86_64
# 安装验证
java -version
```

## 验证钩子

![图片][1]

[1]: /assets/2022/01-20/hook.png