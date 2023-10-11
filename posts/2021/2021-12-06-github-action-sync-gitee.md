---
title:  利用github action自动同步代码到gitee
tags: [github, gitee, ci/cd]
---

## 1.生成ssh密钥对
使用`ssh-keygen`生成密钥对，[参考Gitee文档](https://gitee.com/help/articles/4181#article-header0)

## 2.配置Gitee SSH公钥
「个人设置」->「安全设置」->「SSH公钥」，复制`id_rsa.pub`内容添加新公钥
![Gitee公钥][1]

## 3.在Github仓库设置私钥
在要同步的仓库下「Settings」 -> 「Secrets」 -> 「Actions」-> 「New repository secret」，复制
`id_rsa`内容添加新私钥，并设置一个密钥名称，以`GITEE_KEY`为例。
![Github密钥][2]

## 4.设置同步任务
在仓库下新建`.github/workflows/main.yml`文件或者直接通过Actions `new workflow`，选择`set up a workflow yourself`。

```yaml
name: 'GitHub Actions Mirror'

on: [push, delete]

jobs:
  mirror_to_gitee:
    runs-on: ubuntu-latest
    steps:
      - name: 'Checkout'
        uses: actions/checkout@v2.4.0
        with:
          fetch-depth: 0
      - name: 'Mirror to gitee'
        uses: pixta-dev/repository-mirroring-action@v1.0.2
        with:
          target_repo_url:
            git@gitee.com:PasseRR/JavaLeetCode.git
          # 这里的GITEE_KEY修改为你的密钥名称
          ssh_private_key:
            ${{ "{{" }} secrets.GITEE_KEY }}
```

然后，每次在github push代码就会自动同步到gitee了。
![同步成功][3]

[1]: /assets/2021/12-06/public-key.png
[2]: /assets/2021/12-06/private-key.png
[3]: /assets/2021/12-06/sync.png
