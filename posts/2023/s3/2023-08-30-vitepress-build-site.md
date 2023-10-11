---
title:  "基于vitepress搭建个人站点"
tags: [markdown, vue, vitepress, typescript, 其他]
---

VitePress很适合构建`博客`、`技术文档`、`面试题网站`、`产品介绍网站`、`市场网站`，可以直接通过`markdown`写，这对所有写过博客的人来说都不陌生。
而且还会自动生成导航栏、目录摘要、锚点、移动端自适应，针对markdown做了很多扩展，代码块、代码组、自定义容器等。

个人博客从[Jekyll](https://www.jekyll.com.cn/)开始，过程中由于[Github Pages](https://pages.github.com/)访问过慢，
迁移到了[Vercel](https://vercel.com/)上(可参考我[迁移到Vercel的过程](/2022-06-01-move-github-pages-to-vercel){:target='_blank'})，
最近在VitePress看到后，心动不已，刚好Vercel也支持VitePress部署，故计划将博客使用VitePress重构了一遍，
当然，博客是一个长期维护的空间，仅记录下过程中遇到的问题。

由于非前端开发人员，我前期通过先将我的[电子书](/ebook){:target='_blank'}使用VitePress重构，待到慢慢熟悉后，
开始重构博客，过程还是比较艰辛(主要太菜了)。

- [VitePress Guide](https://vitepress.dev/)
- [VitePress Github](https://github.com/vuejs/vitepress)
- 本博客基于[vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure)改造，感谢[airene](https://github.com/airene)

::: warning 注意
NodeJs需要18或以上
:::

## 开始使用VitePress

::: code-group

```bash [npm]
npx vitepress init
```

```bash [pnpm]
pnpm dlx vitepress init
```

```bash [bun]
bunx vitepress init
```

:::

目录结构

```
.
├─ docs
│  ├─ .vitepress
│  │  └─ config.js
│  ├─ api-examples.md
│  ├─ markdown-examples.md
│  └─ index.md
└─ package.json
```

具体可以参考[官网](https://vitepress.dev/guide/getting-started)，我就不再这里赘述了。

## 常用功能集成

### [vitepress-plugin-mermaid](https://emersonbottero.github.io/vitepress-plugin-mermaid/)插件集成

```ts
// .vitepress/config.ts
import {defineConfig} from 'vitepress'
import {withMermaid} from "vitepress-plugin-mermaid"

export default withMermaid(
    defineConfig({
        // 这里是你的VitePress配置
    })
)
```

在代码块中使用`mmd`则为代码块显示，使用`mermaid`则作为svg显示，但不支持`code-group`，
[Issue](https://github.com/emersonbottero/vitepress-plugin-mermaid/issues/60)提问作者，应该不是很好支持(虽然我也不懂)。

最终效果可参考我[Mermaid相关博客](/tags.html?tag=mermaid){:target='_blank'}。

::: info 提示
[vitepress-plugin-tabs](https://github.com/Red-Asuka/vitepress-plugin-tabs)插件支持tabs容器，
可以实现类似`code-group`效果，可选择集成。

```ts
// vitepress/config.ts
import {tabsMarkdownPlugin} from 'vitepress-plugin-tabs'

export default defineConfig({
    markdown: {
        config(md) {
            // 启用tabs插件
            md.use(tabsMarkdownPlugin)
        }
    }
})
```

:::

### 多层目录rewrite

我个人的博客目录结构一般为多层，便于快速索引，但是VitePress会按照目录结构生成路由，
导致url太长(主要原因是原Jekyll博客只会将md文件名称作为url，我也不想做Google、百度站长的重新索引，所以就想办法兼容原url)。

```
.
|
posts
├─ 2017
│  └─ 2017-01-02-blog.md
├─ 2018
|  |
|  └─ s1
|  |  |
|  |  └─ 2018-03-02-blog.md
|  └─ s2
|     |
|     └─ 2018-05-11-blog.md
|     └─ 2018-06-12-blog.md
|
└─ ...
```

::: code-group

````ts [config.ts]
// .vitepress/config.ts
import {defineConfig} from 'vitepress'
import {getPosts} from './theme/serverUtils'

const rewrites = {}
// 所有博客列表
const posts = await getPosts(site.pageSize)
// 缓存博客位置索引
const postMapping = {}

// 博客路径重写
posts.forEach((it, idx) => {
    // 重写url
    rewrites[it.originPath] = it.regularFile
    // 记录博客顺序索引
    postMapping[it.regularFile] = idx
})

export default defineConfig({
    // 配置重写url
    rewrites: rewrites
})
````

```js [serverUtils.js]
// .vitepress/theme/serverUtils.js
import {globby} from 'globby'
import matter from 'gray-matter'
import fs from 'fs-extra'

async function getPosts(pageSize) {
    // 读取固定目录的md文件
    let paths = await globby(['posts/**/*.md'])

    //生成分页页面markdown
    await generatePaginationPages(paths.length, pageSize)

    let posts = await Promise.all(
        paths.map(async (item) => {
            const content = await fs.readFile(item, 'utf-8')
            // 获得md文件中的frontmatter
            const {data} = matter(content)
            // 名字只取最后文件名
            const name = item.substring(item.lastIndexOf('/') + 1)
            // 解析前10位为日期固定格式
            data.date = name.substring(0, 10)
            const regularFile = item.substring(item.lastIndexOf('/') + 1)

            return {
                frontMatter: data,
                // md文件名
                regularFile: regularFile,
                // 原文件路径
                originPath: item,
                // 访问路径
                regularPath: `/${regularFile.replace('.md', '')}`
            }
        })
    )

    // 将博客按照日期倒叙排序
    posts.sort((a, b) => a.frontMatter.date < b.frontMatter.date ? 1 : -1)

    return posts
}

export {getPosts}
```

:::

通过rewrite后，url从`/posts/2018/s1/2018-03-02-blog.html`变为了`/2018-03-02-blog.html`，完美兼容！

### 利用transformPageData自动添加上一页、下一页

如果按照正常的sidebar维护，VitePress会自动生成`prev`和`next`链接，但是博客并不会(博客没有sidebar)
，懒人肯定不会每个博客去维护prev、next的frontmatter的。

```ts
// .vuepress/config.ts
export default defineConfig({
    transformPageData(page) {
        // 页面是否是博客 根据博客列表找到他的索引
        // postMapping可以参考上边一节的定义 在定义rewrites的时候一起做的
        const index = postMapping[page.relativePath]
        // 非博客的页面 设置编辑链接、更新日期、边栏不显示
        if (index === undefined) {
            page.frontmatter.page = true
            page.frontmatter.aside = false
            page.frontmatter.editLink = false
            page.frontmatter.lastUpdated = false
            return
        }

        // 用于自动添加博客上一篇、下一篇
        // 非最后一篇博客 自动添加下一篇
        if (index < posts.length - 1) {
            page.frontmatter.next = {
                text: posts[index + 1].frontMatter.title,
                link: posts[index + 1].regularPath
            }
        }

        // 非第一篇博客 自动添加上一篇
        if (index > 0) {
            page.frontmatter.prev = {
                text: posts[index - 1].frontMatter.title,
                link: posts[index - 1].regularPath
            }
        }
    }
})
```

### sitemap.xml/sitemap_index.xml文件生成

VitePress默认支持`sitemap.xml`的生成，`sitemap_index.xml`可以使用[sitemap](https://github.com/ekalinin/sitemap.js)结合`buildEnd`实现。

```ts
// .vuepress/config.ts
import {resolve} from 'path'
import {createWriteStream} from "fs"
import {ErrorLevel, SitemapIndexStream} from "sitemap"

export default defineConfig({
    // sitemap_index文件生成
    async buildEnd(s) {
        const paths = resolve(s.outDir), sufix = '/sitemap.xml'
        const smis = new SitemapIndexStream({level: ErrorLevel.WARN})
        // 主站索引
        smis.write({url: site.main + sufix, lastmod: '2017-05-19'})
        // 子站索引
        site.books.forEach(it => smis.write({url: site.main + it.url + sufix, lastmod: it.date}))
        smis.pipe(createWriteStream(paths + '/sitemap_index.xml'))
        smis.end()
    },
    // 默认生成sitemap.xml配置
    sitemap: {
        hostname: site.main,
        // 包含时间
        lastmodDateOnly: false,
        transformItems(items) {
            return items.map(it => {
                // 没看到官方文档 不设置这个sitemap.xml里面的lastmod不会有值
                it.lastmodrealtime = true
                it.url = `/${it.url}`

                return it;
            })
        }
    }
})
```

### 图片放大

在Issue里面找到了[回答](https://github.com/vuejs/vitepress/issues/854#issuecomment-1732376667)，结合`medium-zoom`实现。

::: code-group

```ts [index.ts]
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import mediumZoom from 'medium-zoom';

import './index.css';

export default {
    ...DefaultTheme,

    setup() {
        const route = useRoute();
        const initZoom = () => {
            // 有data-zoomable类的图片则可以点击放大
            mediumZoom('[data-zoomable]', { background: 'var(--vp-c-bg)' });
            // 放大所有正文中的图片 选择合适自己的方案
            // mediumZoom('.main img', { background: 'var(--vp-c-bg)' });
        };
        onMounted(() => {
            initZoom();
        });
        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        );
    },
};
```

```css [index.css]
/* .vitepress/theme/index.css */
.medium-zoom-overlay {
  z-index: 20;
}

.medium-zoom-image {
  z-index: 21;
}
```

:::

```md
![](path/to/file.jpg){data-zoomable}
![](path/to/file.jpg)
```

### 利用`no-icon`类去掉链接上的图标

```md
[VitePress](https://vitepress.dev/){class=no-icon}
```

[VitePress](https://vitepress.dev/){class=no-icon}

### 关于<code><span v-pre>{{</span></code>的转义

```log
[vitepress] Internal server error: Element is missing end tag.
  Plugin: vite:vue
  File: D:/scm/github/passerr.github.io/posts/2023/s3/2023-08-30-vitepress-build-site.md:110:52
      at createCompilerError (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:18:17)
      at emitError (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1487:5)
      at parseElement (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1031:5)
      at parseChildren (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:844:18)
      at parseElement (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1008:20)
      at parseChildren (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:844:18)
      at parseElement (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1008:20)
      at parseChildren (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:844:18)
      at parseElement (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1008:20)
      at parseChildren (D:\scm\github\passerr.github.io\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:844:18)
```

md文件中如果出现<span v-pre>{{</span>需要转义，否则你就将看到上面的错误信息，参考[官网](https://vitepress.dev/guide/using-vue#escaping)。

##### 转义

:::: tabs

=== span标签
````md
This <span v-pre>{{ will be displayed as-is }}</span>
````
输出
```md
{{ will be displayed as-is }}
```

::: tip 提示
`<span v-pre>`可以在md文件的标题中使用，比如这个大节的标题。
:::

=== 自定义容器

```md
::: v-pre
{{ This will be displayed as-is }}
:::
```
输出
```md
{{ This will be displayed as-is }}
```

::::

##### 不想在代码块中转义

在代码块语言后面添加`-vue`后缀就可以不让代码块中的<span v-pre>{{</span>被转义。

````md
```js-vue
Hello {{ 1 + 1 }}
```
````

输出

```md
Hello 2
```

### 自定义代码语法高亮

[shiki](https://github.com/shikijs/shiki/blob/main/docs/languages.md#supporting-your-own-languages-with-shiki)本身支持扩展语言，
如果有`.tmLanguage`文件，那么在vs里面使用[TextMate Languages](https://marketplace.visualstudio.com/items?itemName=Togusa09.tmlanguage)插件转换为json即可。

以我做的`plantuml`语言扩展为例，[tmLanguage来源](https://github.com/florianb/PlantUML.tmbundle/blob/master/Syntaxes/PlantUML.tmLanguage)。

::: code-group

```ts [config.ts]
// .vuepress/config.ts
import plantuml from './language/plantuml.tmLanguage.json'

export default defineConfig({
    markdown: {
        languages: [{
            id: 'plantuml',
            // 必须要和json文件中的scopeName一致
            scopeName: 'source.plantuml',
            grammar: plantuml,
            // 语言别名 代码块中名称
            aliases: ['plantuml']
        }]
    }
})
```

```json [plantuml.tmLanguage.json]
{
  "fileTypes": [
    "txt",
    "iuml"
  ],
  "firstLineMatch": "@startuml",
  "name": "PlantUML",
  "patterns": [
    {
      "match": "(?:^\\s*)(@startuml|@enduml)\\b",
      "name": "keyword.control.plantuml"
    },
    {
      "match": "<<[\\s\\w]*>>",
      "name": "variable.other.stereotype.plantuml"
    },
    {
      "match": "(?:^\\s*)(\\[(?:<--?|-?->)|(?:<--?|-?->)\\])\\s+",
      "name": "keyword.control.externalmsgs.plantuml"
    },
    {
      "match": "(:|--)",
      "name": "keyword.operator.plantuml"
    },
    {
      "match": "(?:^|\\s)(\\*|o|<\\|)?(?:(-+(right|left|up|down))?-+)(\\*|o|\\|>)?\\s+",
      "name": "keyword.operator.relations.plantuml"
    },
    {
      "match": "(?:^|\\s)(\\*|o|<\\|){0,2}(?:(\\.+(right|left|up|down))?\\.+)(\\*|o|\\|>){0,2}\\s+",
      "name": "keyword.operator.dottedrelations.plantuml"
    },
    {
      "match": "(?:^|\\s)<{0,2}(?:(-+(right|left|up|down))?-+)>{0,2}\\s+",
      "name": "keyword.operator.arrows.plantuml"
    },
    {
      "match": "(?:^|\\s)<{0,2}(?:(\\.+(right|left|up|down))?\\.+)>{0,2}\\s+",
      "name": "keyword.operator.dottedarrows.plantuml"
    },
    {
      "match": "(?:^|\\s)(-|\\.)+\\s+",
      "name": "keyword.operator.lines.plantuml"
    },
    {
      "match": "(?:^\\s*)==[\\s\\w]*==",
      "name": "keyword.control.divider.plantuml"
    },
    {
      "match": "(?:^\\s*)===[\\s\\w]*===",
      "name": "keyword.control.synchronizationbar.plantuml"
    },
    {
      "match": "\\b(activate|again|also|alt|as|autonumber|bottom|box|break|center|create|critical|deactivate|destroy|down|else|end|endif|endwhile|footbox|footer|fork|group|header|hide|if|is|left|link|loop|namespace|newpage|note|of|on|opt|over|package|page|par|partition|ref|repeat|return|right|rotate|show|skin|skinparam|start|stop|title|top|top to bottom direction|up|while)\\b",
      "name": "keyword.other.plantuml"
    },
    {
      "match": "(?:^\\s*)((?i)abstract|actor|agent|artifact|boundary|class|cloud|component|control|database|entity|enum|folder|frame|interface|node|object|participant|rect|state|storage|usecase)\\b",
      "name": "support.type.plantuml"
    },
    {
      "match": "\\b((?i)Activity2FontColor|Activity2FontName|Activity2FontSize|Activity2FontStyle|ActivityArrow2FontColor|ActivityArrow2FontName|ActivityArrow2FontSize|ActivityArrow2FontStyle|ActivityArrowColor|ActivityBackgroundColor|ActivityBarColor|ActivityBorderColor|ActivityEndColor|ActivityFontColor|ActivityFontName|ActivityFontSize|ActivityFontStyle|ActivityStartColor|ArtifactBackgroundColor|ArtifactBorderColor|BackgroundColor|BoundaryBackgroundColor|BoundaryBorderColor|CircledCharacterFontColor|CircledCharacterFontName|CircledCharacterFontSize|CircledCharacterFontStyle|CircledCharacterRadius|ClassArrowColor|ClassAttributeFontColor|ClassAttributeFontName|ClassAttributeFontSize|ClassAttributeFontStyle|ClassAttributeIconSize|ClassBackgroundColor|ClassBorderColor|ClassFontColor|ClassFontName|ClassFontSize|ClassFontStyle|ClassStereotypeFontColor|ClassStereotypeFontName|ClassStereotypeFontSize|ClassStereotypeFontStyle|CloudBackgroundColor|CloudBorderColor|ComponentBackgroundColor|ComponentBorderColor|ComponentFontColor|ComponentFontName|ComponentFontSize|ComponentFontStyle|ComponentInterfaceBackgroundColor|ComponentInterfaceBorderColor|ComponentStereotypeFontColor|ComponentStereotypeFontName|ComponentStereotypeFontSize|ComponentStereotypeFontStyle|ControlBackgroundColor|ControlBorderColor|DatabaseBackgroundColor|DatabaseBorderColor|DefaultFontColor|DefaultFontName|DefaultFontSize|DefaultFontStyle|EntityBackgroundColor|EntityBorderColor|FolderBackgroundColor|FolderBorderColor|FooterFontColor|FooterFontName|FooterFontSize|FooterFontStyle|FrameBackgroundColor|FrameBorderColor|GenericArrowFontColor|GenericArrowFontName|GenericArrowFontSize|GenericArrowFontStyle|HeaderFontColor|HeaderFontName|HeaderFontSize|HeaderFontStyle|IconPackageBackgroundColor|IconPackageColor|IconPrivateBackgroundColor|IconPrivateColor|IconProtectedBackgroundColor|IconProtectedColor|IconPublicBackgroundColor|IconPublicColor|LegendBackgroundColor|LegendBorderColor|LegendFontColor|LegendFontName|LegendFontSize|LegendFontStyle|Monochrome|NodeBackgroundColor|NodeBorderColor|NoteBackgroundColor|NoteBorderColor|NoteFontColor|NoteFontName|NoteFontSize|NoteFontStyle|ObjectArrowColor|ObjectAttributeFontColor|ObjectAttributeFontName|ObjectAttributeFontSize|ObjectAttributeFontStyle|ObjectBackgroundColor|ObjectBorderColor|ObjectFontColor|ObjectFontName|ObjectFontSize|ObjectFontStyle|ObjectStereotypeFontColor|ObjectStereotypeFontName|ObjectStereotypeFontSize|ObjectStereotypeFontStyle|PackageBackgroundColor|PackageBorderColor|PackageFontColor|PackageFontName|PackageFontSize|PackageFontStyle|PartitionBackgroundColor|PartitionBorderColor|RectangleBackgroundColor|RectangleBorderColor|SequenceActorBackgroundColor|SequenceActorBorderColor|SequenceActorFontColor|SequenceActorFontName|SequenceActorFontSize|SequenceActorFontStyle|SequenceArrowColor|SequenceArrowFontColor|SequenceArrowFontName|SequenceArrowFontSize|SequenceArrowFontStyle|SequenceBoxBackgroundColor|SequenceBoxBorderColor|SequenceBoxFontColor|SequenceBoxFontName|SequenceBoxFontSize|SequenceBoxFontStyle|SequenceDelayFontColor|SequenceDelayFontName|SequenceDelayFontSize|SequenceDelayFontStyle|SequenceDividerBackgroundColor|SequenceDividerFontColor|SequenceDividerFontName|SequenceDividerFontSize|SequenceDividerFontStyle|SequenceGroupBackgroundColor|SequenceGroupBorderColor|SequenceGroupFontColor|SequenceGroupFontName|SequenceGroupFontSize|SequenceGroupFontStyle|SequenceGroupHeaderFontColor|SequenceGroupHeaderFontName|SequenceGroupHeaderFontSize|SequenceGroupHeaderFontStyle|SequenceLifeLineBackgroundColor|SequenceLifeLineBorderColor|SequenceParticipantBackgroundColor|SequenceParticipantBorderColor|SequenceParticipantFontColor|SequenceParticipantFontName|SequenceParticipantFontSize|SequenceParticipantFontStyle|SequenceReferenceBackgroundColor|SequenceReferenceBorderColor|SequenceReferenceFontColor|SequenceReferenceFontName|SequenceReferenceFontSize|SequenceReferenceFontStyle|SequenceReferenceHeaderBackgroundColor|SequenceTitleFontColor|SequenceTitleFontName|SequenceTitleFontSize|SequenceTitleFontStyle|StateArrowColor|StateAttributeFontColor|StateAttributeFontName|StateAttributeFontSize|StateAttributeFontStyle|StateBackgroundColor|StateBorderColor|StateEndColor|StateFontColor|StateFontName|StateFontSize|StateFontStyle|StateStartColor|StereotypeABackgroundColor|StereotypeCBackgroundColor|StereotypeEBackgroundColor|StereotypeIBackgroundColor|StorageBackgroundColor|StorageBorderColor|TitleFontColor|TitleFontName|TitleFontSize|TitleFontStyle|UsecaseActorBackgroundColor|UsecaseActorBorderColor|UsecaseActorFontColor|UsecaseActorFontName|UsecaseActorFontSize|UsecaseActorFontStyle|UsecaseActorStereotypeFontColor|UsecaseActorStereotypeFontName|UsecaseActorStereotypeFontSize|UsecaseActorStereotypeFontStyle|UsecaseArrowColor|UsecaseBackgroundColor|UsecaseBorderColor|UsecaseFontColor|UsecaseFontName|UsecaseFontSize|UsecaseFontStyle|UsecaseStereotypeFontColor|UsecaseStereotypeFontName|UsecaseStereotypeFontSize|UsecaseStereotypeFontStyle)\\b",
      "name": "constant.language.skinparameter.plantuml"
    },
    {
      "match": "\\s+(#((?i)AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkGrey|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkSlateGrey|DarkTurquoise|DarkViolet|Darkorange|DeepPink|DeepSkyBlue|DimGray|DimGrey|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|Grey|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightGrey|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSlateGrey|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|SlateGrey|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen))\\b",
      "name": "constant.other.colors.plantuml"
    },
    {
      "match": "(#[a-fA-F0-9]{6})",
      "name": "constant.numeric.hexcolors.plantuml"
    },
    {
      "match": "(\\[\\*\\]|\\(\\)|\\(\\*\\))",
      "name": "constant.language.symbols.plantuml"
    },
    {
      "begin": "\"",
      "end": "\"",
      "name": "string.quoted.double.plantuml",
      "patterns": [
        {
          "match": "\\.",
          "name": "constant.character.escape.plantuml"
        }
      ]
    }
  ],
  "scopeName": "source.plantuml",
  "semanticClass": "text.plantuml",
  "uuid": "63DA15BB-D680-4EDC-A411-A93A199DF523"
}
```

:::

效果参考我的[PlantUml的使用](/2017-09-25-plantuml){:target='_blank'}

### 自定义社交svg图标

```ts
// 默认非svg图标定义
export type SocialLinkIcon =
    | 'discord'
    | 'facebook'
    | 'github'
    | 'instagram'
    | 'linkedin'
    | 'mastodon'
    | 'slack'
    | 'twitter'
    | 'x'
    | 'youtube'
    | { svg: string }
```

默认只有几个国外常用的社交软件图标，去[simpleicons](https://simpleicons.org/)搜索下载自己想要的图标即可。

```ts
// .vuepress/config.ts
export default defineConfig({
    themeConfig: {
        socialLinks: [{
            icon: {
                // 下载的svg
                svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gitee</title><path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/></svg>'
            },
            link: 'https://gitee.com/PasseRR',
            ariaLabel: 'Gitee'
        }]
    }
})
```

### 集成评论

- [disqus](https://disqus.com/) 国外的一家评论集成系统，支持匿名评论或者disqus帐号，个人觉得界面不是很好看。
- [畅言](https://changyan.kuaizhan.com/) 网易的评论系统，不支持匿名评论，需要畅言帐号才能评论。
- [utterances](https://utteranc.es/) 博客模版使用的评论，基于Github Issues，需要Github帐号认证，不支持盖楼，盖楼回复不太友好。
- [giscus](https://giscus.app/zh-CN) 本博客使用的评论，基于Github Discussions，需要Github帐号认证。

  ::: code-group
  ```ts [index.ts]
  // .vitepress/theme/index.ts
  import DefaultTheme from 'vitepress/theme'
  import NewGiscus from './components/NewGiscus.vue'
  import NewLayout from "./components/NewLayout.vue"
  
  export default {
    extends: DefaultTheme,
    Layout: NewLayout,
    enhanceApp({app}) {
        // 注册全局组件
        app.component('NewGiscus', NewGiscus)
    }
  }
  ```
  
  ```vue [NewLayout.vue]
  <!-- .vitepress/theme/components/NewLayout.vue -->
  <template>
    <Layout>
      <template v-if="frontmatter.page !== true" #doc-before>
        <div class="vp-doc">
          <h1 :id="frontmatter.title">
            {{ frontmatter.title }}
            <a class="header-anchor" :href="'#'+frontmatter.title">​</a>
          </h1>
          <div class='post-info date'>
            <span v-if="frontmatter.tags" v-for="item in frontmatter.tags">
              <a :href="withBase(`/tags.html?tag=${item}`)" target="_blank"> {{ item }}</a>
            </span>
            {{ frontmatter.date }}
          </div>
        </div>
        <br/>
      </template>
      <template v-if="frontmatter.page !== true" #doc-after>
        <NewGiscus/>
      </template>
    </Layout>
  </template>
  <script setup>
  import DefaultTheme from 'vitepress/theme'
  import NewGiscus from "./NewGiscus.vue"
  import {useData, withBase} from "vitepress"
  import {nextTick, provide} from 'vue'
  
  const {Layout} = DefaultTheme
  const {frontmatter, page, isDark} = useData()
  </script>
  ```
  
  ```vue [NewGiscus.vue]
  <template>
    <Giscus
        repo="PasseRR/passerr.github.io"
        repo-id="MDEwOlJlcG9zaXRvcnk5MTc3MTIzOQ=="
        category="Announcements"
        category-id="DIC_kwDOBXhRZ84CZgw9"
        :term="page.relativePath"
        strict="0"
        reactions-enabled="1"
        emit-metadata="0"
        input-position="bottom"
        :theme="isDark ? 'dark': 'light'"
        lang="zh-CN"
        crossorigin="anonymous"
        loading="lazy"
    />
  </template>
  <script setup lang="ts">
  import Giscus from '@giscus/vue';
  import {useData} from "vitepress";
  
  const {page, isDark} = useData()
  </script>
  ```
  :::
  
  效果可以参考所有博客最下方的评论区或者[留言板](/messages-board){:target='_blank'}

### 集成不蒜子统计

参考[官网](https://ibruce.info/2015/04/04/busuanzi/)，引入脚本，在博客正文布局相应位置插入`span`标签即可。

```ts [index.ts]
// vitepress/config.ts

export default defineConfig({
    head: [
        // 不蒜子
        [
            'script',
            {async: '', src: 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'}
        ],
        // 在Chrome 85版本中，为了保护用户的隐私，默认的Referrer Policy则变成了strict-origin-when-cross-origin
        // 所以必须加入此部分代码，否则文章统计访问量的数据则不正确
        [
            'meta',
            {name: 'referrer', content: 'no-referrer-when-downgrade'}
        ]
    ]
})
```

::: warning 注意
如果是不同域名是分开统计的，比如我的博客就是`xiehai.zone`、`passerr.github.io`分开统计的，我也未找到相关配置。
:::

## 最后

博客终于迁移完了，VitePress无论是颜值、维护性来说，我都很满意，就是某些个性功能实现对我这个菜鸟来说比较复杂，但是安利安利！
