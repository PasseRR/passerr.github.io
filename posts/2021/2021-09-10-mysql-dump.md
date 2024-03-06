---
title:  "Mysql数据库备份"
tags: [数据库, 备份, mysql]
---

## 配置准备

::: code-group

```bash
# 修改文件权限
chmod 600 /etc/mysql/backup.cnf
```

```toml [/etc/mysql/backup.cnf]
# /etc/mysql/backup.cnf
[client]
host=localhost
port=3306
user=root
password="your_password"
```
:::

## 简单手动备份

```bash
# 输入密码备份
mysqldump -u root -p -B your_database > backup.sql
# 根据配置简单备份
mysqldump --defaults-extra-file=/etc/mysql/backup.cnf -B your_database > backup.sql
```

## 结合crontab做定时备份

依赖`backup.cnf`配置文件

### 准备定时执行的脚本

```sh
# /etc/mysql/dump.sh
# 配置文件路径 即配置准备中完成的配置
V_CONF_PATH="./backup.cnf"
# 备份目录
V_BACKUP_DIR="/log/database"
# sock位置
V_SOCKET="/tmp/mysql.sock"
# 需要备份数据库
V_DATABASE=benyin
# 备份保留天数 自动删除超过备份天数的备份文件
V_KEEP_DAYS=30
# 当前日期
V_TODAY=`date "+%Y%m%d"`
# 备份文件名
V_DUMP_FILE="${V_BACKUP_DIR}/`date "+%Y%m%d%H%M%S"`"

# 数据库备份
start_time=$(date +%s.%N)
echo "开始数据库备份..."
/usr/local/bin/mysqldump --defaults-extra-file=${V_CONF_PATH} --socket=${V_SOCKET} -B ${V_DATABASE} > ${V_DUMP_FILE}.sql

# 删除备份文件
cd ${V_BACKUP_DIR}
for i in `ls -l | awk '{print \$9}' | grep "[0-9]"`
do
if [ $[$(date -d "$V_TODAY" "+%s") - $(date -d "${i:0:8} + $V_KEEP_DAYS day" "+%s")] -ge 0 ]; then
   echo "删除过期备份文件$i"
   rm -f $i
fi
done

end_time=$(date +%s.%N)
execution_time=$(echo "$end_time - $start_time" | bc)
echo "完成数据库备份,耗时$execution_time秒..."
```

### 创建crontab

```sh
# 编辑定时任务
crontab -e
# 每天1点执行数据库备份 并记录日志
0 1 * * * /etc/mysql/dump.sh >> /var/log/mysqldump.log 2>&1
# 查看已有定时任务
crontab -l

# 查看crontab日志
# 执行记录日志
vi /var/log/cron
# 过程日志
vi /var/log/messages
vi /var/log/syslog
```

### 效果

![备份效果][1]

[1]: /assets/2021/09-10/mysql.png