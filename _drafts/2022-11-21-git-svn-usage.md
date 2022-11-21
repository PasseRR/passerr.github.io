---
layout: post
title:  使用git进行svg的版本控制
categories: [others]
last_modified_at: 2022-11-21
---

```
Can't load '/usr/lib/perl5/vendor_perl/auto/SVN/_Core/_Core.dll' for module SVN::_Core: No such file or directory at /usr/lib/perl5/core_perl/DynaLoader.pm line 193.
at /usr/lib/perl5/vendor_perl/SVN/Base.pm line 59.
BEGIN failed--compilation aborted at /usr/lib/perl5/vendor_perl/SVN/Core.pm line 5.
Compilation failed in require at F:/Git/mingw64/share/perl5/Git/SVN/Utils.pm line 6.
BEGIN failed--compilation aborted at F:/Git/mingw64/share/perl5/Git/SVN/Utils.pm line 6.
Compilation failed in require at F:/Git/mingw64/share/perl5/Git/SVN.pm line 32.
BEGIN failed--compilation aborted at F:/Git/mingw64/share/perl5/Git/SVN.pm line 32.
```

```shell 
# windows升级git版本
git update-git-for-windows
```