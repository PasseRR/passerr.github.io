---
layout: post
title:  "Selenium远程驱动服务搭建"
categories: [java]
---

## 下载selenium服务端
[下载](https://docs.seleniumhq.org/download/)

## 下载浏览器驱动
[Chrome](http://chromedriver.storage.googleapis.com/index.html)  
[FireFox](https://github.com/mozilla/geckodriver/releases/)  
[IE](http://selenium-release.storage.googleapis.com/index.html)  

## 服务端启动
1.服务启动命令  

{% highlight bat %}
java -jar selenium-server-standalone-3.141.59.jar
{% endhighlight %}

2.客户端代码  

{% highlight java %}
@Configuration
public class WebDriverConfig {
    @Bean(destroyMethod = "quit")
    public WebDriver webDriver() throws IOException {
        ChromeOptions options = new ChromeOptions();
        //--user-agent=""	设置请求头的User-Agent
        //--window-size=1366,768	设置浏览器分辨率（窗口大小）
        //--headless	无界面运行（无窗口）
        //--start-maximized	最大化运行（全屏窗口）
        //--incognito	隐身模式（无痕模式）
        //--disable-javascript	禁用javascript
        //--disable-infpygmentsobars	禁用浏览器正在被自动化程序控制的提示
        // 无痕模式 最大化
        options.addArguments("--incognito", "--start-maximized", "--whitelisted-ips=192.168.2.1");
        // 使用远程驱动
        return new RemoteWebDriver(new URL("http://192.168.2.86:4444/wd/hub"), options);
    }
}
{% endhighlight %}

## selenium grid
> 通过-role hub/-role node来指定是hub还是node，hub至少应该有一个node节点，node节点通过http://ip:port/grid/register/注册至hub。
> 客户端通过hub连接，hub将请求转发至node节点执行。

1.参数配置方式  

{% highlight bat %}
## 启动hub
java -jar selenium-server-standalone-3.141.59.jar -role hub -maxSession 10 -port 4444
## 启动node
java -jar  -"Dwebdriver.chrome.driver=C:\\tools\\driver\\chromedriver.exe" selenium-server-standalone-3.141.59.jar -role node  -hub http://localhost:4444/grid/register -port 4445
{% endhighlight %}

2.配置文件方式

{% highlight bat %}
## 启动hub
java -jar selenium-server-standalone-3.141.59.jar -role hub -hubConfig hub.json
## 启动node
java -jar selenium-server-standalone-3.141.59.jar -role node -hub http://localhost:4444/grid/register -nodeConfig node.json
{% endhighlight %}

<figure>
<figcaption>hub.json</figcaption>
{% highlight json %}
{
  "port": 4444,
  "newSessionWaitTimeout": -1,
  "servlets": [],
  "capabilityMatcher": "org.openqa.grid.internal.utils.DefaultCapabilityMatcher",
  "throwOnCapabilityNotPresent": true,
  "nodePolling": 5000,
  "cleanUpCycle": 5000,
  "timeout": 60,
  "browserTimeout": 60,
  "maxSession": 10,
  "jettyMaxThreads": -1
}
{% endhighlight %}
</figure>

<figure>
<figcaption>node.json</figcaption>
{% highlight json %}
{
  "capabilities": [
	{
	  "browserName": "firefox",
	  "marionette": true,
	  "maxInstances": 1,
	  "seleniumProtocol": "WebDriver"
	},
	{
	  "browserName": "chrome",
	  "maxInstances": 3,
	  "platform": "WINDOWS",
	  "webdriver.chrome.driver": "D:\\javaproject\\oATFWeb\\External\\chromedriver2.4.1.exe",
	  "seleniumProtocol": "WebDriver"
	},
	{
	  "browserName": "internet explorer",
	  "platform": "WINDOWS",
	  "maxInstances": 1,
	  "seleniumProtocol": "WebDriver"
	},
	{
	  "browserName": "safari",
	  "technologyPreview": false,
	  "platform": "MAC",
	  "maxInstances": 1,
	  "seleniumProtocol": "WebDriver"
	}
  ],
  "proxy": "org.openqa.grid.selenium.proxy.DefaultRemoteProxy",
  "maxSession": 5,
  "port": 5555,
  "register": true,
  "registerCycle": 5000,
  "hub": "http://10.12.1.140:4444",
  "nodeStatusCheckTimeout": 5000,
  "nodePolling": 5000,
  "role": "node",
  "unregisterIfStillDownAfter": 60000,
  "downPollingLimit": 2,
  "debug": false,
  "servlets": [],
  "withoutServlets": [],
  "custom": {},
  "browserTimeout": 60,
  "timeout": 60
}
{% endhighlight %}
</figure>

3.结果  
访问http://hub.ip:port/grid/console可以看到node的详细配置
