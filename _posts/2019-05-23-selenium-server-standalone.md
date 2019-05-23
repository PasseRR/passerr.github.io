---
layout: post
title:  "Selenium远程驱动服务搭建"
date:   2019-05-23 13:57:50 +0800
categories: [java]
---

{% highlight cmd %}
# 启动hub
java -jar selenium-server-standalone-2.44.0.jar -role hub -maxSession 10 -port 4444
# 启动node
java -jar  -"Dwebdriver.chrome.driver=C:\\tools\\driver\\chromedriver.exe" selenium-server-standalone-2.44.0.jar -role node  -hub http://localhost:4444/grid/register -port 4445
{% endhighlight %}