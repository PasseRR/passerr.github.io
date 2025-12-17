---
title: "如何消除if-elseif-else语句"
tags: [ java ]
---

`if-elseif-else`语句是一种常见的控制结构，用于根据不同的条件执行不同的代码块。然而，当if-elseif-else语句分支较多或者嵌套过多时，代码会变得复杂难读，只能跑不能改，难以维护。

::: tip 什么时候会出现这种“`坏味道`”？如果出现以下的一条就需要警惕。
- if else超过3个
- 出现多层嵌套
- 条件是“类型”或“状态”判断，每次加需求都需要修改或添加if
- 逻辑需要配合流程图或者读代码才能懂
:::

以下是一个示例代码：

```java
public BigDecimal calcShippingFee(Order order) {
    // 防御：订单不能为空（应在方法开头直接 throw）
    if (order != null) {
        // 防御：订单必须关联用户
        if (order.getUser() != null) {
            // 业务判断：是否 VIP 用户
            if (order.getUser().isVip()) {
                if (order.getAmount().compareTo(new BigDecimal("100")) > 0) {
                    // 业务判断：VIP 且订单金额 > 100
                    if (order.getAddress() != null) {
                        // 防御 + 业务混合：是否有收货地址
                        if ("REMOTE".equals(order.getAddress().getRegion())) {
                            // 业务判断：偏远地区
                            // VIP + 金额 > 100 + 偏远地区
                            return new BigDecimal("20"); // 运费 20
                        } else {
                            // VIP + 金额 > 100 + 非偏远地区
                            return BigDecimal.ZERO; // 免运费
                        }
                    } else {
                        // VIP + 金额 > 100 + 无地址
                        return new BigDecimal("10"); // 默认运费
                    }
                } else {
                    // VIP + 金额 ≤ 100
                    return new BigDecimal("15"); // 运费 15
                }
            } else {
                // 非 VIP 用户
                if (order.getAmount().compareTo(new BigDecimal("50")) > 0) {
                    // 非 VIP + 金额 > 50
                    return new BigDecimal("10"); // 运费 10
                } else {
                    // 非 VIP + 金额 ≤ 50
                    return new BigDecimal("25"); // 运费 25
                }
            }
        } else {
            // 防御：订单存在但用户为空（非法状态）
            throw new IllegalArgumentException("user is null");
        }
    } else {
        // 防御：订单为空（非法入参）
        throw new IllegalArgumentException("order is null");
    }
}
```

## 卫语句/提前返回

卫语句(Guard Clause)和提前返回(Early Return)一般会搭配使用，两个使用场景都是将判断逻辑提前，但是有些区别。

卫语句是“`防御`”，如果不满足条件，直接结束，保护主逻辑不被污染，一般出现在方法最前面，用于检测参数合法性、权限状态控制等。

提前返回是“`控制流程`”，如果满足条件，直接返回结果，一般出现在方法中间或者循环体内部，表示当前结果已满足业务需求，无需继续往下走。

现在使用卫语句和提前返回修改示例代码：

```java
public BigDecimal calcShippingFee(Order order) {
    // order卫语句
    if (order == null) {
        throw new IllegalArgumentException("order is null");
    }
    // order用户卫语句
    if (order.getUser() == null) {
        throw new IllegalArgumentException("user is null");
    }

    // vip运费逻辑
    if (order.getUser().isVip()) {
        // 订单金额小于等于100 直接提前返回
        if (order.getAmount().compareTo(new BigDecimal("100")) <= 0) {
            return new BigDecimal("15");
        }

        // vip地址为null 提前返回
        if (order.getAddress() == null) {
            return new BigDecimal("10");
        }

        // vip 偏远山区运费 提前返回
        if ("REMOTE".equals(order.getAddress().getRegion())) {
            return new BigDecimal("20");
        }

        // vip 非偏远山区 提前返回
        return BigDecimal.ZERO;
    }

    // 非vip运费逻辑
    // 订单金额小于等于50 直接提前返回
    if (order.getAmount().compareTo(new BigDecimal("50")) <= 0) {
        return new BigDecimal("25");
    }

    // 非vip 订单金额大于50
    return new BigDecimal("10");
}
```

## 枚举

枚举天然具有可读性、扩展性、安全性，可以参考[枚举的使用](/2023-07-11-enum-usage){:target='_blank' rel="noreferrer"}，
枚举适合状态/类型**有限的**、**稳定的**， 行为随类型变化，不需要运行时动态配置的场景。

现在使用枚举修改示例代码：

::: code-group

```java
public BigDecimal calcShippingFee(Order order) {
    // order卫语句
    if (order == null) {
        throw new IllegalArgumentException("order is null");
    }
    // order用户卫语句
    if (order.getUser() == null) {
        throw new IllegalArgumentException("user is null");
    }

    // 使用枚举计算运费
    return order.getUser().getUserType().calcShippingFee(order);
}
```

```java [UserType.java]
public enum UserType {
    NORMAL {
        @Override
        public BigDecimal calcShippingFee(Order order) {
            // 订单金额小于等于50 直接提前返回
            if (order.getAmount().compareTo(new BigDecimal("50")) <= 0) {
                return new BigDecimal("25");
            }

            // 非vip 订单金额大于50
            return new BigDecimal("10");
        }
    },
    VIP {
        @Override
        public BigDecimal calcShippingFee(Order order) {
            // 订单金额小于等于100 直接提前返回
            if (order.getAmount().compareTo(new BigDecimal("100")) <= 0) {
                return new BigDecimal("15");
            }

            // vip地址为null 提前返回
            if (order.getAddress() == null) {
                return new BigDecimal("10");
            }

            // vip 偏远山区运费 提前返回
            if ("REMOTE".equals(order.getAddress().getRegion())) {
                return new BigDecimal("20");
            }

            // vip 非偏远山区 提前返回
            return BigDecimal.ZERO;
        }
    };

    /**
     * 计算运费抽象行为
     * @param order 订单
     * @return 运费
     */
    public abstract BigDecimal calcShippingFee(Order order);
}
```

:::

## 策略模式

策略模式跟枚举比较类似，枚举每次扩展需要新增枚举值，而策略模式每次扩展只需要新增策略类，策略类实现策略接口，策略接口定义抽象行为。
一般适用于**策略会增长**，不同策略逻辑比较复杂，Spring场景下尤为合适。

现在使用策略模式修改示例代码：
::: code-group

```java [ShippingFeeCalculator.java]

@Component
public class ShippingFeeCalculator {
    final Map<String, ShippingFeeStrategy> strategyMap = new HashMap<>(4);

    public ShippingFeeCalculator(List<ShippingFeeStrategy> strategies) {
        strategies.forEach(it -> this.strategyMap.put(it.strategyName(), it));
    }

    public BigDecimal calcShippingFee(Order order) {
        // order卫语句
        if (order == null) {
            throw new IllegalArgumentException("order is null");
        }
        // order用户卫语句
        if (order.getUser() == null) {
            throw new IllegalArgumentException("user is null");
        }

        return this.strategyMap.get(order.getUser().getUserType()).calcShippingFee(order);
    }
}
```

```java [ShippingFeeStrategy.java]
public interface ShippingFeeStrategy {
    /**
     * 策略名称
     * @return 策略名称
     */
    String strategyName();
    /**
     * 计算运费抽象行为
     * @param order 订单
     * @return 运费
     */
    BigDecimal calcShippingFee(Order order);
}
```

```java [NormalShippingFeeStrategy.java]

@Component
public class NormalShippingFeeStrategy implements ShippingFeeStrategy {
    @Override
    public String strategyName() {
        return "normal";
    }

    @Override
    public BigDecimal calcShippingFee(Order order) {
        // 订单金额小于等于50 直接提前返回
        if (order.getAmount().compareTo(new BigDecimal("50")) <= 0) {
            return new BigDecimal("25");
        }

        // 非vip 订单金额大于50
        return new BigDecimal("10");
    }
}
```

```java [VipShippingFeeStrategy.java]

@Component
public class VipShippingFeeStrategy implements ShippingFeeStrategy {
    @Override
    public String strategyName() {
        return "vip";
    }

    @Override
    public BigDecimal calcShippingFee(Order order) {
        // 订单金额小于等于100 直接提前返回
        if (order.getAmount().compareTo(new BigDecimal("100")) <= 0) {
            return new BigDecimal("15");
        }

        // vip地址为null 提前返回
        if (order.getAddress() == null) {
            return new BigDecimal("10");
        }

        // vip 偏远山区运费 提前返回
        if ("REMOTE".equals(order.getAddress().getRegion())) {
            return new BigDecimal("20");
        }

        // vip 非偏远山区 提前返回
        return BigDecimal.ZERO;
    }
}
```

:::

## 规则引擎

以上所有方法中，增加或修改运费计算逻辑都需要修改代码，重新发布服务。使用规则引擎，可以动态配置规则，不需要修改代码，只需要发布规则即可。
产品运营可以通过系统配置规则，系统自动加载规则，实现了运费计算的动态配置。但是学习成本较高、调试复杂、性能较其他方案低。

下面以[Drools](https://www.baeldung.com/drools)为例修改示例代码：

```drl
package rules

// 导入相关类
import com.example.Order;
import com.example.Address;
import java.math.BigDecimal;

// 规则：普通用户订单金额<=50，运费25
rule "Normal user - amount <= 50"
    // 最高优先级
    salience 100
    when
        $order : Order(
            userType == "NORMAL",
            amount <= new BigDecimal("50"),
            // 还没计算运费
            shippingFee == null
        )
    then
        modify($order) {
            setShippingFee(new BigDecimal("25"))
        };
end

// 规则：普通用户订单金额>50，运费10
rule "Normal user - amount > 50"
    salience 90
    when
        $order : Order(
            userType == "NORMAL",
            amount > new BigDecimal("50"),
            shippingFee == null
        )
    then
        modify($order) {
            setShippingFee(new BigDecimal("10"))
        };
end

// 规则：VIP用户订单金额<=100，运费15
rule "VIP user - amount <= 100"
    salience 100
    when
        $order : Order(
            userType == "VIP",
            amount <= new BigDecimal("100"),
            shippingFee == null
        )
    then
        BigDecimal shippingFee = ;
        modify($order) {
            setShippingFee(new BigDecimal("15"))
        };
end

// 规则：VIP用户地址为null，运费10
rule "VIP user - address is null"
    salience 95
    when
        $order : Order(
            userType == "VIP",
            address == null,
            shippingFee == null
        )
    then
        BigDecimal shippingFee = new BigDecimal("10");
        modify($order) {
            setShippingFee(new BigDecimal("10"))
        };
end

// 规则：VIP用户在偏远山区，运费20
rule "VIP user - remote region"
    salience 90
    when
        $order : Order(
            userType == "VIP",
            address != null and "REMOTE".equals(address.getRegion()),
            shippingFee == null
        )
    then
        BigDecimal shippingFee = new BigDecimal("20");
        modify($order) {
            setShippingFee(new BigDecimal("20"))
        };
end

// 规则：VIP用户非偏远山区，运费0
rule "VIP user - non-remote region"
    salience 85
    when
        $order : Order(
            userType == "VIP",
            address != null,
            shippingFee == null
        )
    then
        BigDecimal shippingFee = BigDecimal.ZERO;
        modify($order) {
            setShippingFee(BigDecimal.ZERO)
        };
end
```

## 总结

简单来说，代码是给人读的，清晰、易读、易维护才是王道。

- 简单逻辑：卫语句 + 提前返回即可
- 稳定且有限状态：枚举最优
- 策略多、逻辑复杂：策略模式
- 规则多且易变、需动态配置：规则引擎

::: danger 告诫
虽然本文说是消除if-elseif-else语句，但也不是盲目追求形式上的消除，消除为了提高代码的可读性、可维护性，请自行取舍。
:::
