---
layout: post
title:  CentOs升级gcc、glibc
categories: [operation]
last_modified_at: 2023-05-24
toc: true
---

## 升级gcc

在[阿里云镜像](https://mirrors.aliyun.com/gnu/gcc){:target="_blank"}上找到想要升级的gcc版本，这里以`10.1.0`为例

```bash
wget https://mirrors.aliyun.com/gnu/gcc/gcc-10.1.0/gcc-10.1.0.tar.gz
tar -zxvf gcc-10.1.0.tar.gz
```

### 依赖安装

```bash
# 到gcc根目录
[root@localhost ~]# cd gcc-10.1.0

# 自动下载依赖
[root@localhost gcc-10.1.0]# ./contrib/download_prerequisites
2023-06-12 05:19:16 URL:http://gcc.gnu.org/pub/gcc/infrastructure/gmp-6.1.0.tar.bz2 [2383840/2383840] -> "./gmp-6.1.0.tar.bz2" [1]
2023-06-12 05:19:19 URL:http://gcc.gnu.org/pub/gcc/infrastructure/mpfr-3.1.4.tar.bz2 [1279284/1279284] -> "./mpfr-3.1.4.tar.bz2" [1]
2023-06-12 05:19:21 URL:http://gcc.gnu.org/pub/gcc/infrastructure/mpc-1.0.3.tar.gz [669925/669925] -> "./mpc-1.0.3.tar.gz" [1]
2023-06-12 05:19:24 URL:http://gcc.gnu.org/pub/gcc/infrastructure/isl-0.18.tar.bz2 [1658291/1658291] -> "./isl-0.18.tar.bz2" [1]
gmp-6.1.0.tar.bz2: OK
mpfr-3.1.4.tar.bz2: OK
mpc-1.0.3.tar.gz: OK
isl-0.18.tar.bz2: OK
tar (child): lbzip2: Cannot exec: No such file or directory
tar (child): Error is not recoverable: exiting now
tar: Child returned status 2
tar: Error is not recoverable: exiting now
error: Cannot extract package from gmp-6.1.0.tar.bz2

# 安装bzip2
[root@localhost gcc-10.1.0]# yum -y install bzip2

# 再次执行依赖下载
[root@localhost gcc-10.1.0]# ./contrib/download_prerequisites 
gmp-6.1.0.tar.bz2: OK
mpfr-3.1.4.tar.bz2: OK
mpc-1.0.3.tar.gz: OK
isl-0.18.tar.bz2: OK
All prerequisites downloaded successfully.
```

### 安装c编译器

```bash
# 未安装c编译器报错
# no acceptable C compiler found in $PATH
yum -y install gcc-c++
```

### 编译安装gcc

```bash
# 创建编译目录
mkdir build && cd build

# 配置
../configure --enable-checking=release --enable-language=c,c++ --disable-multilib --prefix=/usr
# 编译
# j后面的数字表示可用于编译的cpu个数 这里设置的是8 一般来说一个cpu对应两个逻辑处理器
# 可以通过命令 cat /proc/stat | grep cpu[0-9] -c 查询cpu个数*2
# 编译过程漫长
make -j8
# 安装
make install
```

### gcc版本检查

```bash
# 查看安装库
cd /usr/lib64 && ll libstdc++*
# 或者gcc --version
gcc -v
```

## 升级make

在[阿里云镜像](https://mirrors.aliyun.com/gnu/make/){:target="_blank"}上找到想要升级的make版本，这里以`4.4`为例

```bash
wget https://mirrors.aliyun.com/gnu/make/make-4.4.tar.gz
tar -zxvf 
make-4.4.tar.gz
```

### 编译安装make

```bash
cd make-4.4
mkdir build && cd build

# 编译安装
../configure --prefix=/usr && make && make install
```

### make版本检查

```bash
make -v
```

## 升级binutils

在[阿里云镜像](https://mirrors.aliyun.com/gnu/binutils/){:target="_blank"}上找到想要升级的binutils版本，这里以`2.30`为例

```bash
wget https://mirrors.aliyun.com/gnu/binutils/binutils-2.30.tar.gz
tar -zxvf binutils-2.30.tar.gz
```

### 编译安装binutils

```bash
cd binutils-2.30
./configure  --prefix=/usr
make && make install
```

### binutils版本检查

```bash
binutils -v
```

## 升级bison

在[阿里云镜像](https://mirrors.aliyun.com/gnu/bison/){:target="_blank"}上找到想要升级的bison版本，这里以`3.0.1`为例

```bash
wget https://mirrors.aliyun.com/gnu/bison/bison-3.0.1.tar.gz
tar -zxvf bison-3.0.1.tar.gz
```

### 编译安装bison

```bash
cd bison-3.0.1
./configure --prefix=/usr
make && make install
```

### bison版本检查

```bash
bison -V
```

## 升级glibc

在[阿里云镜像](https://mirrors.aliyun.com/gnu/glibc/){:target="_blank"}上找到想要升级的glibc版本，这里以`2.37`为例

```bash
wget https://mirrors.aliyun.com/gnu/glibc/glibc-2.37.tar.gz
tar -zxvf glibc-2.37.tar.gz
```

### 查看安装依赖

```bash
[root@localhost ~]# cd glibc-2.37
# 查看安装依赖
[root@localhost glibc-2.37]# cat INSTALL | grep -E "newer|later"
The tests (and later installation) use some pre-existing files of the
   * GNU 'make' 4.0 or newer
   * GCC 6.2 or newer
     building the GNU C Library, as newer compilers usually produce
     of release, this implies GCC 7.4 and newer (excepting GCC 7.5.0,
   * GNU 'binutils' 2.25 or later
     binutils 2.26 or newer.
   * GNU 'texinfo' 4.7 or later
   * GNU 'bison' 2.7 or later
   * GNU 'sed' 3.02 or newer
   * Python 3.4 or later
   * GDB 7.8 or later with support for Python 2.7/3.4 or later
   * GNU 'gettext' 0.10.36 or later

# make、gcc、binutils上面已经安装升级了

# 查看sed版本
[root@localhost glibc-2.37]# sed --version
sed (GNU sed) 4.2.2
Copyright (C) 2012 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by Jay Fenlason, Tom Lord, Ken Pizzini,
and Paolo Bonzini.
GNU sed home page: <http://www.gnu.org/software/sed/>.
General help using GNU software: <http://www.gnu.org/gethelp/>.
E-mail bug reports to: <bug-sed@gnu.org>.
Be sure to include the word ``sed'' somewhere in the ``Subject:'' field.

# 查看gettext版本
[root@localhost glibc-2.37]# gettext --version
gettext (GNU gettext-runtime) 0.19.8.1
Copyright (C) 1995-1997, 2000-2007 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Written by Ulrich Drepper.

# 安装Python3
yum install -y python3
# python版本检测
python3 -V
```

> 若存在版本号大于要求版本号，但是出现配置出错情况
> 
> - binutils搜索**2.1**，需要修改**as**和**ld**版本号兼容配置
> - gcc搜索**3.4**
> - make搜索**3.79**
> 
> 搜索版本号为INSTALL中声明的版本，参考StackOverflow [configure-error-these-critical-programs-are-missing-or-too-old-gcc-make-w](https://stackoverflow.com/questions/46534957/configure-error-these-critical-programs-are-missing-or-too-old-gcc-make-w/62252633#62252633){:target="_blank"}
{: .block-danger }

### 编译安装glibc

```bash
cd glibc-2.37
mkdir build && cd build
../configure --prefix=/usr --disable-profile --enable-add-ons --with-headers=/usr/include --with-binutils=/usr/bin --disable-sanity-checks --disable-werror
# 编译过程漫长
make && make install

# 如果报错no include path in which to search for limits.h
# 需要配置C_INCLUDE_PATH和CPLUS_INCLUDE_PATH环境变量
# 配置为自己的gcc路径
export C_INCLUDE_PATH=/usr/lib/gcc/x86_64-pc-linux-gnu/10.1.0/include-fixed/:/usr/lib/gcc/x86_64-pc-linux-gnu/10.1.0/include/
export CPLUS_INCLUDE_PATH=${C_INCLUDE_PATH}
```

> **注意**
> 
> 如果出现下面报错信息 千万不要重启
> 
> relocation error: : /usr/lib64/libpthread.so.0: relocation error: symbol __libc_dl_error_tsd, 
> version GLIBC_PRIVATE not defined in file libc.so.6 with link time reference/usr/lib64/libpthread.so.0: symbol __libc_dl_error_tsd, 
> version GLIBC_PRIVATE not defined in file libc.so.6 with link time reference
> ```bash
sln /usr/lib64/ld-2.17.so /usr/lib64/ld-linux-x86-64.so.2
sln /usr/lib64/libc-2.17.so /usr/lib64/libc.so.6
```
{: .block-danger }


### glibc版本检查

```bash
strings /lib64/libc.so.6 | grep GLIBC
ll /lib64/libc.so*
ldd --version
```
