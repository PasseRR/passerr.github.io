---
title:  CentOs7 systemd服务 
tags: [centos, 运维]
---

## systemd

- 启动系统时并行启动
- 按需激活systemd管理的服务
- 服务快照
- 服务依赖定义

## unit

### 配置文件

每个unit都有一个配置文件，告诉systemd怎么启动这个服务单元。系统启动时，systemd会读取`/etc/systemd/system`
下的unit配置，即开机启动，其他配置目录在开启开机启动时，会创建一个符号链接在`/etc/systemd/system`中。

| 目录                      | 作用                |
|:------------------------|:------------------|
| /etc/systemd/system     | 开机启动的服务单元配置       |
| /run/systemd/system     | 运行时的服务单元配置，一般很少修改 |
| /lib/systemd/system     | 本地的服务单元配置         |
| /usr/lib/systemd/system | 第三方软件安装的服务单元配置    |

### 单元类型

| 类型名称       | 作用                                                                 |
|:-----------|:-------------------------------------------------------------------|
| .service   | 封装守护进程的启动、停止、重启和重载操作，是最常见的一种 unit 类型                               |
| .target    | 用于对 unit 进行逻辑分组，引导其他 unit 的执行。                                     |
| .device    | 对应`/dev`目录下设备，主要用于定义设备之间的依赖关系                                      |
| .mount     | 定义系统结构层次中的一个挂载点，可以替代过去的 /etc/fstab 配置文件                            |
| .automount | 用于控制自动挂载文件系统。自动挂载即当某一目录被访问时系统自动挂载该目录，这类unit取代了传统Linux系统的autofs相应功能 |
| .path      | 用于监控指定目录变化，并触发其他unit运行                                             |
| .scope     | 这类 unit 文件不是用户创建的，而是 Systemd 运行时自己产生的，描述一些系统服务的分组信息                |
| .slice     | 用于描述 cgroup 的一些信息，极少使用到                                            |
| .snapshot  | 这种 unit 其实是 systemctl snapshot 命令创建的一个描述 Systemd unit 运行状态的快照      |
| .socket    | 监控系统或互联网中的 socket 消息，用于实现基于网络数据自动触发服务启动                            |
| .swap      | 定义一个用于做虚拟内存的交换分区                                                   |
| .timer     | 封装由system的里面由时间触发的动作, 替代了 crontab 的功能                              |

## service配置

service配置包含三个部分`Unit`、`Service`、`Install`
，字段表格中加粗的字段均可以多次出现配置，[参考](https://www.freedesktop.org/software/systemd/man/systemd.unit.html)

### Unit段

区块通常是配置文件的第一个区块，用来定义 Unit 的元数据，以及配置与其他 Unit 的关系。它的主要字段如下。

| 字段                | 描述                                     |
|:------------------|:---------------------------------------|
| Description       | 服务描述                                   |
| **Documentation** | 文档地址                                   |
| **Wants**         | 当前服务需要其他unit配合，若其他unit未启动，不会启动失败       |
| Requires          | 当前服务依赖的其他unit，依赖的unit停止或重启，当前服务也会停止或重启 |
| Requisite         | 与Requires类似，若依赖的unit未启动，当前服务会立刻停止      |
| BindsTo           | 与其他单元绑定，若其他unit停止，当前服务也会停止             |
| PartOf            | 与Requires类似，若依赖单元重启或停止，当前服务也重启或停止      |
| Upholds           | 与Wants类似，会持续重启依赖unit                   |
| Conflicts         | 当前服务不能与给定的unit同时运行                     |
| **Before**        | 当前服务必须在给定的unit之前启动                     |
| **After**         | 当前服务必须在给定的unit之后启动                     |
| **Condition***    | 当前服务必须满足给定条件，否则不运行                     |
| **Assert***       | 当前服务必须满足给定条件，否则启动失败                    |

### Service段

service块配置，记录服务信息，环境变量、启动方式、工作目录等

| 字段                  | 描述                                               |
|:--------------------|:-------------------------------------------------|
| Type                | 进程类型(参见下方类型介绍)                                   |
| ExecStart           | 启动命令                                             |
| ExecStartPre        | 启动前置命令                                           |
| ExecStartPost       | 启动后置命令                                           |
| ExecReload          | 重启命令                                             |
| ExecStop            | 停止命令                                             |
| ExecStopPost        | 停止后置命令                                           |
| RestartSec          | 自动重启当前服务间隔的秒数                                    |
| Restart             | 定义何种情况 Systemd 会自动重启当前服务                         |
| TimeoutSec          | 定义 Systemd 停止当前服务之前等待的秒数                         |
| **Environment**     | 环境变量                                             |
| **EnvironmentFile** | 指定加载一个包含服务所需的环境变量列表的文件，文件中的每一行都是一个环境变量的定义        |
| Nice                | 服务的进程优先级，值越小优先级越高，默认为0。-20为最高优先级，19为最低优先级。       |
| WorkingDirectory    | 工作目录                                             |
| RootDirectory       | 指定服务进程的根目录（ / 目录），如果配置了这个参数后，服务将无法访问指定目录以外的任何文件。 |
| User                | 指定运行服务的用户，会影响服务对本地文件系统的访问权限。                     |
| Group               | 指定运行服务的用户组，会影响服务对本地文件系统的访问权限。                    |
| LimitCPU            | cpu资源限定                                          |
| LimitSTACK          | 程序堆栈限定                                           |
| LimitNOFILE         | 文件句柄数量限定                                         |
| LimitNPROC          | 子进程数量限定                                          |

进程类型(Type)可选值

- **simple** 即使二进制或者用户不存在启动会返回成功
- **exec** 若二进制不存在或用户不存在启动会返回失败
- **forking** 将ExecStart作为作为子进程执行，服务启动成功后主进程退出
- **oneshot** 在主进程退出后启动服务单元
- **dbus** 设置BusName或类型指定，总线释放，服务管理会尝试终止服务
- **notify** 类似exec，在服务启动后发送通知消息
- **idle** 类似simple，服务程序的实际执行会延迟

服务重启(Restart)可选值

- **no** 不重启
- **always** 所有异常情况都重启
- **on-success** 仅当退出码或者退出信号正常时
- **on-failure** 不满足on-success的其他异常情况
- **on-abnormal** 非正常的退出信号、服务超时、看门狗超时
- **on-abort** 非正常的退出信号
- **on-watchdog** 看门狗超时

### Install段

用来定义如何启动，以及是否开机启动。

| 字段         | 描述                                                                                             |
|:-----------|:-----------------------------------------------------------------------------------------------|
| Alias      | 额外别名unit                                                                                       |
| WantedBy   | 它的值是一个或多个 Target，当前 Unit 激活时（enable）符号链接会放入/etc/systemd/system目录下面以 Target 名 + .wants后缀构成的子目录中 |
| RequiredBy | 它的值是一个或多个 Target，当前 Unit 激活时，符号链接会放入/etc/systemd/system目录下面以 Target 名 + .required后缀构成的子目录中     |
| Also       | 当前 Unit 激活（enable）时，会被同时激活的其他 Unit                                                             |

## 常用命令

| 用途         | 命令                                        |
|:-----------|:------------------------------------------|
| 启动服务       | systemctl start 服务名[.service]             |
| 停止服务       | systemctl stop 服务名[.service]              |
| 服务状态       | systemctl status 服务名[.service]            |
| 重启服务       | systemctl restart 服务名[.service]           |
| 设置服务开机启动   | systemctl enable 服务名[.service]            |
| 禁止服务开机启动   | systemctl disable 服务名[.service]           |
| 禁用服务       | systemctl mask 服务名[.service]              |
| 启用服务       | systemctl unmask 服务名[.service]            |
| 查看运行的服务    | systemctl list-units                      |
| 查看所有开机启动服务 | systemctl list-unit-files                 |
| 查看服务依赖     | systemctl list-dependencies 服务名[.service] |
| 重新加载服务配置   | systemctl daemon-reload                   |
| 查看服务日志     | journalctl -u 服务名[.service]               |
