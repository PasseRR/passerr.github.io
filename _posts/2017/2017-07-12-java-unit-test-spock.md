---
layout: post
title:  "使用Spock完成单元测试"
categories: [java]
---
## 前言
1.单元测试是什么?   
> 单元测试（英语：Unit Testing）又称为模块测试, 是针对程序模块（软件设计的最小单位）来进行正确性检验的测试工作。程序单元是应用的最小可测试部件。在过程化编程中，一个单元就是单个程序、函数、过程等；对于面向对象编程，最小单元就是方法，包括基类（超类）、抽象类、或者派生类（子类）中的方法。   ------引用自[维基百科](https://zh.wikipedia.org/wiki/%E5%8D%95%E5%85%83%E6%B5%8B%E8%AF%95)  

2.关于单元测试   
java单元测试用的比较多的如jUnit,testng等。单元测试代码总是充斥着各种when(),any(),return(),加上java本身就是一种啰嗦的语言,使得写单元测试成为了一件体力活。不同的人写出来的单元测试也是五花八门：      

* 直接使用Main函数   
* 不使用Assert而使用Sysout.out.println()   
* 一个单元测试函数几百行   

最终使得单元测试代码难以阅读、维护与理解,如同鸡肋一般食之无味弃之可惜.   
3.单元测试的难点      
难写出简单、优雅、易维护、易理解的单元测试代码.   
![实际单元测试](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/images/2017-07-12/unit_test.png)  

## 关于Spock
1.什么是Spock?   
> Spock is a testing and specification framework for Java and Groovy applications. What makes it stand out from the crowd is its beautiful and highly expressive specification language. Thanks to its JUnit runner, Spock is compatible with most IDEs, build tools, and continuous integration servers. Spock is inspired from JUnit, RSpec, jMock, Mockito, Groovy, Scala, Vulcans, and other fascinating life forms. ------引用自[Spock官网](http://spockframework.org/)  
  
2.groovy   
Spock是基于[groovy](http://www.groovy-lang.org/)的,语法和java很接近,没有java那么啰嗦,可以完全用java语法编写groovy代码.   

## 实战
1.依赖   
* maven   
{% highlight xml %}
<dependency>
    <groupId>org.spockframework</groupId>
    <artifactId>spock-core</artifactId>
    <version>1.0-groovy-2.4</version>
    <scope>test</scope>
</dependency>
<!-- if use spring -->
<dependency>
    <groupId>org.spockframework</groupId>
    <artifactId>spock-spring</artifactId>
    <version>1.0-groovy-2.4</version>
    <scope>test</scope>
</dependency>
{% endhighlight %}
* gradle   
{% highlight groovy %}  
dependencies{
    testCompile "org.spockframework:spock-core:1.0-groovy-2.4"
    testCompile "org.spockframework:spock-spring:1.0-groovy-2.4"
}
{% endhighlight %}
2.Spock中的概念
* Specification   
测试类都必须继承Specification类   
* Fixture Methods   
{% highlight groovy %}
// 每个spec前置
def setupSpec() {
}
// 每个spec后置
def cleanupSpec() {
}
// 每个方法前置
def setup() {
}
// 每个方法后置
def cleanup() {
}
{% endhighlight %}
* Feature methods
{% highlight groovy %}
// 动态方法名
@Unroll
def "addPerson:(idCardNo->#idCardNo, sex->#sex, name->#name), expect:#result"() {
}
// 固定方法名
def addPerson(){
}
{% endhighlight %}
* setup/given Blocks   
在这个block中会放置与这个测试函数相关的初始化程序   
{% highlight groovy %}
given: // 也可以写作setup 
def stack = new Stack()
def elem = "push me"
{% endhighlight %}
* when and then Blocks   
{% highlight groovy %}
when:
stack.push(elem)  

then:
!stack.empty
stack.size() == 1
stack.peek() == elem
{% endhighlight %}
* expect Blocks   
when and then Blocks例子可以替换为:   
{% highlight groovy %}
given:
def stack = new Stack()
def elem = "push me"
stack.push(elem)
expect:
stack.empty == false
stack.size() == 1
stack.peek() == elem
{% endhighlight %}
* where Blocks   
做测试时最复杂的事情之一就是准备测试数据，尤其是要测试边界条件、测试异常分支等，这些都需要在测试之前规划好数据.   
{% highlight groovy %}
def "maximum of two numbers"() {
    expect:
    // exercise math method for a few different inputs
    Math.max(1, 3) == 3
    Math.max(7, 4) == 7
    Math.max(0, 0) == 0
}

// 可以替换为
def "maximum of two numbers"() {
    expect:
    Math.max(a, b) == c

    where:
    a | b || c
    3 | 5 || 5
    7 | 0 || 7
    0 | 0 || 0
}
{% endhighlight %}
3.Spock和其他测试框架的比较   
* 用jUnit写的单元测试代码   
{% highlight java %}
@Test
public void addPerson() {
    // 正常添加
    PersonVo personVo = PersonVo.builder()
        .idCardNo("1345")
        .name("Jack")
        .sex("male")
        .build();
    Assert.assertTrue(this.personService.addPerson(personVo));
    // 名字重复
    personVo = PersonVo.builder()
        .idCardNo("1346")
        .name("Jack")
        .sex("male")
        .build();
    Assert.assertFalse(this.personService.addPerson(personVo));
    // idCardNo重复
    personVo = PersonVo.builder()
        .idCardNo("1345")
        .name("Jack Chen")
        .sex("male")
        .build();
    Assert.assertFalse(this.personService.addPerson(personVo));
}
{% endhighlight %}
* 使用Spock编写同样的单元测试
{% highlight groovy %}
@Unroll
def "addPerson:(idCardNo->#idCardNo, sex->#sex, name->#name), expect:#result"() {
    // 前置条件 同setup
    given:
    def personVo = PersonVo.builder()
        .idCardNo(idCardNo)
        .name(name)
        .sex(sex)
        .build()

    // 预期
    expect:
    result == this.personService.addPerson(personVo)

    // 条件
    where:
    // 数据定义方法一
    // |用来分隔输入 ||用来分隔输出
    idCardNo | name   | sex      || result
    "5101"   | "Jack" | "male"   || true
    // idCardNo重复
    "5101"   | "John" | "male"   || false
    // name重复
    "5102"   | "Jack" | "male"   || false
    "123456" | "Lucy" | "female" || true
}
{% endhighlight %}
在去除啰嗦冗余的语法过后,单元测试代码是否看起来更清晰、更容易阅读、更优雅?   
4.测试结果   
![测试结果](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/images/2017-07-12/test_result.png)  