---
layout: post
title:  使用循环还是递归?
categories: [java]
last_modified_at: 2023-04-07
toc: true
---

## 前言

最近在做一个数据同步的功能，就是把数据库的数据同步到另外一个地方，因为只是做数据初始化，考虑直接使用读数据库的方式来同步。
每次读取一个分片，然后将分片数据同步后再开始同步下一个分片，简单的伪代码如下：

```java
public class SyncService {
    public void sync() {
        try {
            // 执行任务同步
            doSync();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    /**
     * 数据分片同步 涉及到数据组装、拆分等过程
     */
    protected void doSync() {
        log.debug("开始同步第{}轮", round);
        if (同步完成) {
            log.debug("同步完成");
            return;
        }
        
        // 继续下一轮同步
        this.doSync();
    }
}
```

使用如上代码，开发环境测试完成，上线同步后，同事反馈服务总是在3000轮左右就会自动挂掉且没有异常日志输出，而且每次都是在**固定的轮次**挂掉。

## 问题分析

### 是否是OOM问题或者jvm异常中断？

```shell
-XX:+PrintGCDetails -XX:+PrintGCTimeStamps  -Xloggc:./gc.log -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./java.hprof -XX:ErrorFile=./hs_err_pid<pid>.log
```

启动添加如上参数后，运行后还是在固定轮次挂掉，且没有自动dump文件和error日志，gc日志查看正常。

### 是否是栈溢出？

```shell
# 扩大一倍线程内存 默认是1M
-Xss2M
```

启动添加如上参数后，运行后发现会在**固定的轮次**的`两倍多`才会挂掉，到此基本上确定了是栈溢出导致的应用程序挂掉。

## 循环与递归比较

- **循环**
  - 定义：当满足某种条件时，反复进行某种操作，比如`for`、`while`循环。
  - 优点：速度快、结构简单
  - 缺点：并不能解决所有问题，有的时候使用递归会更容易解决(如果二叉树的遍历)
  - 建议：如果循环次数较少或逻辑简单，建议使用循环

- **递归**
  - 定义：在运行的过程中，自己调用自己(即递)，但必须存在一个出口(即归)。
  - 优点：结构简洁清晰、容易验证
  - 缺点：运行需要多次方法调用，每次方法调用会方法栈入栈操作，如果调用次数较多会导致栈溢出，由于方法栈的入栈、出栈会影响一定的效率
  - 建议：可预见调用次数且使用循环不好实现或难以理解时使用递归，若存在栈溢出，可控情况下可以适当调整`Xss`大小

## 结论

- 在使用递归时，需要预见方法调用次数(即考虑是否会栈溢出)
- 优先使用循环，除非循环难实现或者会导致结构变复杂
- 由于StackOverflowError父类是Throwable，并未被try到，导致日志没有异常输出，未能第一时间定位到栈溢出问题

最后修改代码如下

```java
public class SyncService {
    public void sync() {
        try {
            while(未同步完成) {
                this.doSync();
            }
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }

        log.debug("同步完成");
    }

    /**
     * 数据分片同步 涉及到数据组装、拆分等过程
     */
    protected void doSync() {
        log.debug("开始同步第{}轮", round);
        // 同步过程...
    }
}
```

