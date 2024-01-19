---
title:  "Mysql定时备份"
tags: [数据库, mysql]
---

# 简单备份

```conf [/etc/mysql/backup.cnf]
[client]
host=localhost
port=3306
user=root
password="your_password"
```

```bash
# 修改文件权限
chmod 600 dump.conf
# 简单的备份执行
mysqldump --defaults-extra-file=/etc/mysql/backup.cnf -h localhost -P 3306 -B your_database > backup.sql
```

# 结合crontab做定时备份

## 准备定时执行的脚本

```sh [dump.sh]
# 配置文件路径
V_CONF_PATH="./backup.cnf"
# 备份目录
V_BACKUP_DIR="/log/database"
# sock位置
V_SOCKET="/tmp/mysql.sock"
# 需要备份数据库
V_DATABASE=benyin
# 备份保留天数
V_KEEP_DAYS=30
# 当前日期
V_TODAY=`date "+%Y%m%d"`
# 备份文件名
V_DUMP_FILE="${V_BACKUP_DIR}/`date "+%Y%m%d%H%M%S"`"

# 数据库备份
mysqldump --defaults-extra-file=${V_CONF_PATH} --socket=${V_SOCKET} -B ${V_DATABASE} > ${V_DUMP_FILE}.sql

# 删除备份文件
cd ${V_BACKUP_DIR}
for i in `ls -l | awk '{print \$9}' | grep "[0-9]"`
do
if [ $[$(date -d "$V_TODAY" "+%s") - $(date -d "${i:0:8} + $V_KEEP_DAYS day" "+%s")] -ge 0 ]; then
   echo "删除过期目录$i"
   rm -f $i
fi
done
```