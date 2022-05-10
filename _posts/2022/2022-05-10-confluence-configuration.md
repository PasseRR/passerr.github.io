---
layout: post
title:  Confluence常用配置
categories: [operation]
last_modified_at: 2022-04-15
---

## 1. Confluence页面添加返回顶部
设置 -> 自定义HTML -> BODY尾部中添加如下代码。
```html
<script type="text/javascript">
//<![CDATA[
AJS.toInit(function(){
    //If the scroll button doesn't exist add it and set up the listeners
    if(AJS.$('#scroll-top').length == 0) {
        AJS.$('#main-content').prepend('<button id="scroll-top" class="aui-button aui-button-primary scroll-top-button" style="display: none; position: fixed; bottom: 10px; right: 10px; z-index: 10;" title="返回顶部"><span class="aui-icon aui-icon-small aui-iconfont-chevron-up">Back to Top</span></button>');

        //Check to see if the window is top if not then display button
        AJS.$(window).scroll(function(){
            if (AJS.$(this).scrollTop() > 100) {
                AJS.$('#scroll-top').fadeIn();
            } else {
                AJS.$('#scroll-top').fadeOut();
            }
        });

        //Click event to scroll to top
        AJS.$('#scroll-top').click(function(){
            AJS.$('html, body').animate({scrollTop : 0}, 500);
            return false;
        });
    }
});
//]]>
</script>
```
![top](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2022/05-10/top.gif)

## 2. 右侧浮动导航宏
设置 -> 用户宏 -> 创建用户宏，然后在编辑器中插入创建的宏。
```ftl
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
</script>
#end
```
使用[html宏](https://community.atlassian.com/t5/Boise-discussions/Widget-Wednesday-Floating-TOC-in-Confluence/m-p/1095431#M22)实现

![toc](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2022/05-10/toc.gif)