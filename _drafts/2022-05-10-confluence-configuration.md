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