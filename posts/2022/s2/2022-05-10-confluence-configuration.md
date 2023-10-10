---
title:  Confluence常用配置
tags: [运维, 配置]
---

## Confluence页面添加返回顶部

设置 -> 自定义HTML -> BODY尾部中添加如下代码。

```html

<script type="text/javascript">
    //<![CDATA[
    AJS.toInit(function () {
        //If the scroll button doesn't exist add it and set up the listeners
        if (AJS.$('#scroll-top').length == 0) {
            AJS.$('#main-content').prepend('<button id="scroll-top" class="aui-button aui-button-primary scroll-top-button" style="display: none; position: fixed; bottom: 10px; right: 10px; z-index: 10;" title="返回顶部"><span class="aui-icon aui-icon-small aui-iconfont-chevron-up">Back to Top</span></button>');

            //Check to see if the window is top if not then display button
            AJS.$(window).scroll(function () {
                if (AJS.$(this).scrollTop() > 100) {
                    AJS.$('#scroll-top').fadeIn();
                } else {
                    AJS.$('#scroll-top').fadeOut();
                }
            });

            //Click event to scroll to top
            AJS.$('#scroll-top').click(function () {
                AJS.$('html, body').animate({scrollTop: 0}, 500);
                return false;
            });
        }
    });
    //]]>
</script>
```

![1][1]

## 右侧浮动导航宏

设置 -> 用户宏 -> 创建用户宏，然后在编辑器中插入创建的宏。

```freemarker
## Macro title: toc-right
## Macro has a body:  N
##
## Developed by: Benjamin DUPUIS
## Date created: 05/08/2011
## Date Updated: 30/11/2016
## Installed by: Benjamin DUPUIS
## @param Maxlvl:title=MaxLvl|type=int|required=true|desc=Max Level|default=5
## @param Float:title=Float|type=boolean|required=true|desc=Float/Fixed Position|default=true
## @param Hidable:title=Hidable|type=boolean|required=true|desc=Hidable (Float menu only)|default=true

#set($globalHelper=$action.getHelper())
#if ($content.id == $globalHelper.getPage().id)
  #if (!$paramMaxlvl)
    #set ($paramMaxlvl=5)
  #end

  #set($mytoc=$globalHelper.renderConfluenceMacro("{toc:maxLevel=$paramMaxlvl}"))

  #if ($paramFloat == true)
    #if ($paramHidable == true)
      <div id="show_customtoc" style="right:15px; top:100px; position:fixed; z-index:99; margin-left:8px; padding:10px; background:#ae0015; border-radius: 3px; writing-mode: vertical-lr; display: none">
        <a style="color:white; cursor:pointer" onclick="jQuery('#customtoc').toggle(true); jQuery('#show_customtoc').toggle(false)">显示目录</a>
      </div>
    #end
  <div id="customtoc" style="right:25px; top:100px; position:fixed; max-height: 80%; z-index:99; overflow: auto; margin-left:8px;background:white;;opacity: .8">
  #else
    #if ($paramHidable == true)
      <div id="show_customtoc" style="float:right; margin-left:8px; padding:10px; background:#ae0015; border-radius: 3px; writing-mode: vertical-lr; display: none">
        <a style="color:white; cursor:pointer" onclick="jQuery('#customtoc').toggle(true); jQuery('#show_customtoc').toggle(false)">显示目录</a>
      </div>
    #end
  <div id="customtoc" style="float:right; margin-left:8px;background:white">
  #end
    <table>
      <thead>
        <tr>
         <th>目录
  #if ($paramHidable == true)
           <a style="margin: -5px; padding: 0; float: right; font-weight:bold; font-size:2em; line-height: 1em" onclick="jQuery('#customtoc').toggle(false); jQuery('#show_customtoc').toggle(true)">×</a>
  #end
         </th>
        </tr>
      </thead>
      <tbody>
        <tr>
           <td>
             $mytoc
           </td>
        </tr>
      </tbody>
    </table>
  </div>
#end
```

使用[html宏](https://community.atlassian.com/t5/Boise-discussions/Widget-Wednesday-Floating-TOC-in-Confluence/m-p/1095431#M22)
实现

![2][2]

## 【推荐】右侧导航插件(Easy Heading Macro)

[Easy Heading Macro](https://marketplace.atlassian.com/apps/1221271/easy-heading-macro-floating-table-of-contents?tab=overview&hosting=server)

离线插件下载[easy-heading-free-2.2.1.jar](/assets/2022/05-10/easy-heading-free-2.2.1.jar)，上传插件安装就可以使用

插件目录可以使用wiki全局配置、按照空间配置、按照页面配置自由选择，并且支持内容按照标题展开、收起。

- 配置wiki
  ```confluence-wiki
  {easy-heading-free:selector=h1,h2,h3,h4,h5,h6|navigationTitle=目录|navigationExpandOption=expand-all-by-default}
  ```
- 全局配置  
  设置 -> 外观 -> 边栏/页眉及页脚，在页脚中添加**配置wiki**脚本
- 空间配置  
  空间管理 -> 外观 -> 侧边栏,页眉和页脚，在页脚中添加**配置wiki**脚本
- 页面配置  
  创建页面 -> 插入更多内容 -> 其他宏 -> 导航 -> Easy Heading Free
- 配置参数说明

  |参数名|默认值|描述|
  |:---|:---|:---|
  |enabled|true|是否启用宏|
  |selector|h1,h2,h3|从h1到h6，标题选择器，逗号分隔|
  |titleExpandClickable|false|点击标题自动展开目录|
  |headingIndent|20|内容标题缩进像素|
  |expandOption|expand-all-by-default|内容标题展开方式，可选值expand-all-by-default、collapse-all-by-default、collapse-all-but-headings-1、collapse-all-but-headings-1-2、collapse-all-but-headings-1-3、collapse-all-but-headings-1-4、disable-expand-collapse|
  |useNavigation|true|是否浮动目录|
  |useNavigationHiddenMode|false|首次进入目录是否隐藏|
  |wrapNavigationText|false|若标题超过限定长度是否自动截断，false截断，true不截断|
  |navigationTitle|Table of Content|目录名称|
  |navigationWidth|230|目录宽度像素|
  |navigationIndent|10|标题目录不同级别的缩进像素|
  |navigationExpandOption|expand-all-by-default|导航目录展开方式，可选值expand-all-by-default、collapse-all-by-default、collapse-all-but-headings-1、collapse-all-but-headings-1-2、collapse-all-but-headings-1-3、collapse-all-but-headings-1-4、disable-expand-collapse|
  |disableNavLinksUnder|0|当标题少于多少个时目录不可用|

![3][3]

## confluence多个地址访问时提示Your URL doesn't match

confluence只能设置一个基础url，当confluence通过内网或外网ip访问时，每当访问任意页面时会提示Your URL doesn't match，
为了避免这种情况，通过修改`Confluence Base URL Plugin`插件配置。

设置 -> 插件管理 -> 系统 -> Confluence Base URL Plugin -> 禁用模块`Base URL plugin filter`

## [CVE-2021-26084漏洞修复](https://confluence.atlassian.com/doc/confluence-security-advisory-2021-08-25-1077906215.html)

CVE-2021-26084漏洞会利用远程代码执行植入挖矿病毒，修复步骤如下

1. 关闭confluence
2. 下载[cve-2021-26084-update.sh](/assets/2022/05-10/cve-2021-26084-update.sh)脚本
3. 修改脚本中的`INSTALLATION_DIRECTORY`为你的confluence安装目录并保存
4. 修改脚本执行权限

    ```shell
    chmod 700 cve-2021-26084-update.sh
    ```
5. 切换用户为confluence安装用户

    ```shell
    ls -l /opt/atlassian/confluence | grep bin
    # drwxr-xr-x 3 root root 4096 Aug 18 17:07 bin
    
    # In this first example, we change to the 'root' user
    # to run the workaround script
    
    sudo su root
    ls -l /opt/atlassian/confluence | grep bin
    # drwxr-xr-x 3 confluence confluence 4096 Aug 18 17:07 bin
    
    # In this second example, we need to change to the 'confluence' user
    # to run the workaround script
    
    sudo su confluence
    ```
6. 执行cve-2021-26084-update.sh脚本

    ```shell
    ./cve-2021-26084-update.sh
    ```
7. 重启confluence

## confluence文件预览乱码

假设Confluence安装目录为`/opt/atlassian/confluence`，应用数据目录为`/var/atlassian/application-data/confluence`

1. 将windows`C:\Windows\Fonts`目录下的字体文件复制到`/opt/atlassian/confluence/fonts`目录
2. 修改`/opt/atlassian/confluence/bin/setenv.sh`文件

    ```shell
    # vi /opt/atlassian/confluence/bin/setenv.sh
    CATALINA_OPTS="-Dconfluence.document.conversion.fontpath=/opt/atlassian/confluence/fonts/ ${CATALINA_OPTS}"
    ```

3. 删除应用临时预览文件

    ```shell
    cd /var/atlassian/application-data/confluence
    rm -rf viewfile/*
    rm -rf shared-home/dcl-document/*
    rm -rf shared-home/dcl-document_hd/*
    rm -rf shared-home/dcl-thumbnail/*
    ```

4. 重启Confluence

[1]: /assets/2022/05-10/top.gif

[2]: /assets/2022/05-10/toc.gif

[3]: /assets/2022/05-10/plugin.gif

<!-- 
[agent](/assets/2022/05-10/atlassian-agent.jar)

```bash
# 下载jar包到任意目录
cd /opt/atlassian
# for jira
vim jira/bin/setenv.sh
export JAVA_OPTS="-javaagent:/opt/atlassian/atlassian-agent.jar ${JAVA_OPTS}"

# for Confluence
vim confluence/bin/setenv.sh
CATALINA_OPTS="-javaagent:/opt/crack/jira/atlassian-agent.jar ${CATALINA_OPTS}"

# 破解插件(Confluence和jira都可) 复制key即可
java -jar atlassian-agent.jar -p 插件关键字 -m aaa@bbb.com -n my_name -o https://zhile.io -s BW1U-A0L5-92EL-VFVX
```
-->
