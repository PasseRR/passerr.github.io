---
title:  Mermaid之流程图(flowchart)
tags: [markdown, uml, 其他]
---

流程图是对过程、算法、流程的一种图像表示，在技术设计、交流及商业简报等领域有广泛的应用。
通常用一些图框来表示各种类型的操作，在框内写出各个步骤，然后用带箭头的线把它们连接起来，
以表示执行的先后顺序。用图形表示算法，直观形象，易于理解。有时候也被称之为输入-输出图。
顾名思义，就是用来直观地描述一个工作过程的具体步骤。这种过程既可以是生产线上的工艺流程，
也可以是完成一项任务所必需的管理过程。

[mermaid flowchart文档](https://mermaid-js.github.io/mermaid/#/flowchart)

mermaid关键字`flowchart`

## 图例方向
    
| 关键字 | 描述                  |
|:----|:--------------------|
| TB  | top to bottom, 从顶到底 |
| TD  | top-down, 同TB       |
| BT  | bottom to top, 从底到顶 |
| RL  | right to left, 从右到左 |
| LR  | left to right, 从左到右 |

## 节点形状

<table>
  <thead>
    <tr>
        <th width="40%">形状</th>
        <th width="45%">效果</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>(圆角)</td>
        <td>

```mermaid
flowchart LR
id1(圆角)
```

</td>
    </tr>
<tr>
        <td>([圆边])</td>
        <td>

```mermaid
flowchart LR
id1([圆边])
```

</td>
    </tr>
<tr>
<td>[[子程序]]</td>
<td>

```mermaid
flowchart LR
id1[[子程序]]
```

</td>
</tr>

<tr>
<td>((圆形))</td>
<td>

```mermaid
flowchart LR
id1((圆形))
```

</td>
</tr>

<tr>
<td>[(圆柱体)]</td>
<td>

```mermaid
flowchart LR
id1[(圆柱体)]
```

</td>
</tr>

<tr>
<td>>不对称的]</td>
<td>

```mermaid
flowchart LR
id1>不对称的]
```

</td>
</tr>

<tr>
<td>{菱形}</td>
<td>

```mermaid
flowchart LR
id1{菱形}
```

</td>
</tr>

<tr>
<td><span v-pre>{{六边形}}</span></td>
<td>

```mermaid
flowchart LR
id1{{六边形}}
```

</td>
</tr>

<tr>
<td>[/平行四边形/]</td>
<td>

```mermaid
flowchart LR
id1[/平行四边形/]
```

</td>
</tr>

<tr>
<td>[/梯形\]</td>
<td>

```mermaid
flowchart LR
id1[/梯形\]
```

</td>
</tr>

</tbody>
</table>

## 连接

### 连接符号

<table>    
<thead>
<tr>
<th>连接</th>
<th width="35%">代码</th>
<th width="45%">效果</th>
</tr>
</thead>
<tbody>
<tr>
<td>--直线---</td>
<td>

```mmd
flowchart LR
A --- B
C --直线--- D
E ---|直线| F
```

</td>
<td>

```mermaid
flowchart LR
A --- B
C --直线--- D
E ---|直线| F
```

</td>
</tr>
<tr>
<td>--箭头直线--></td>
<td>

```mmd
flowchart LR
A --> B
C --箭头直线--> D
E -->|箭头直线| F
```

</td>
<td>

```mermaid
flowchart LR
A --> B
C --箭头直线--> D
E -->|箭头直线| F
```

</td>
</tr>
<tr>
<td>==粗直线===</td>
<td>

```mmd
flowchart LR
A === B
C ==直线=== D
E ===|直线| F
```

</td>
<td>

```mermaid
flowchart LR
A === B
C ==直线=== D
E ===|直线| F
```

</td>
</tr>
<tr>
<td>==粗箭头直线==></td>
<td>

```mmd
flowchart LR
A ==> B
C ==粗箭头直线==> D
E ==>|粗箭头直线| F
```

</td>
<td>

```mermaid
flowchart LR
A ==> B
C ==粗箭头直线==> D
E ==>|粗箭头直线| F
```

</td>
</tr>
<tr>
<td>-.虚线.-</td>
<td>

```mmd
flowchart LR
A -.- B
C -.虚线.- D
E -.-|虚线| F
```

</td>
<td>

```mermaid
flowchart LR
A -.- B
C -.虚线.- D
E -.-|虚线| F
```

</td>
</tr>
<tr>
<td>-.箭头虚线.-></td>
<td>

```mmd
flowchart LR
A -.-> B
C -.箭头虚线.-> D
E -.->|箭头虚线| F
```

</td>
<td>

```mermaid
flowchart LR
A -.-> B
C -.箭头虚线.-> D
E -.->|箭头虚线| F
```

</td>
</tr>
</tbody>
</table>

### 连接长度
        
| 连接类型  | 长度1    | 长度2     | 长度3      |
|:------|:-------|:--------|:---------|
| 直线    | `---`  | `----`  | `-----`  |
| 箭头直线  | `-->`  | `--->`  | `---->`  |
| 粗直线   | `===`  | `====`  | `=====`  |
| 粗箭头直线 | `==>`  | `===>`  | `====>`  |
| 虚线    | `-.-`  | `-..-`  | `-...-`  |
| 箭头虚线  | `-.->` | `-..->` | `-...->` |
      
### 连接链
#### 连续连接

<table>
<tr><td width="65%">

```mmd
flowchart LR
A --- B --文字--> C -.- D -.文字.- E === F ==文字==> G
```

</td></tr>
<tr><td>

```mermaid
flowchart LR
A --- B --文字--> C -.- D -.文字.- E === F ==文字==> G
```

</td></tr>
</table>

#### 相同线连接

<table>
<tr>
<td width="37%">

```mmd
flowchart LR
a --> b & c--> d
```

</td>
<td width="40%">

```mermaid
flowchart LR
a --> b & c--> d
```

</td>
</tr>
<tr>
<td>

```mmd
flowchart TD
A & B--> C & D
```

</td>
<td>

```mermaid
flowchart TD
A & B--> C & D
```

</td>
</tr>
</table>
   
## 超链接

<table>
<tr>
<td>

```mmd
flowchart LR
    A-->B
    click A "https://mermaid-js.github.io/" _blank
    click B "https://www.xiehai.win" _blank
```

</td>
<td width="50%">

```mermaid
flowchart LR
    A-->B
    click A "https://mermaid-js.github.io/" _blank
    click B "https://www.xiehai.win" _blank
```

</td>
</tr>
</table>


## 子图

<table>
<tr>
<td>

```mmd
flowchart LR
  subgraph TOP
    direction TB
    subgraph B1
        direction RL
        i1 -->f1
    end
    subgraph B2
        direction BT
        i2 -->f2
    end
  end
  A --> TOP --> B
  B1 --> B2
```

</td>
<td width="45%">

```mermaid
flowchart LR
  subgraph TOP
    direction TB
    subgraph B1
        direction RL
        i1 -->f1
    end
    subgraph B2
        direction BT
        i2 -->f2
    end
  end
  A --> TOP --> B
  B1 --> B2
```

</td>
</tr>
</table>
