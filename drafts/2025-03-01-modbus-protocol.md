---
title: "基于PLC4J对接Modbus协议"
tags: [ IoT,modbus,plc4j,java ]
---

[Modbus](https://www.modbus.org)是一种广泛应用于工业自动化领域的通信协议，主要用于设备之间的数据交换。

[PLC4X](https://github.com/apache/plc4x)是一个Apache开源的PLC库，它提供了对Modbus协议的支持，可以用于与Modbus设备进行通信。

- PLC4J 0.10.0: 支持JDK8
- PLC4J 0.11.0以上版本: 需要JDK11+

## Modbus协议介绍

Modbus协议是一种主从协议，其中主设备（Master）负责发起通信，从设备（Slave）负责响应通信。
Modbus协议支持多种数据类型，包括二进制、ASCII、RTU和ASCII RTU等。
Modbus协议的通信过程如下：

1. 主设备向从设备发送请求，请求包含从设备的地址和要读取或写入的数据类型和地址。
2. 从设备响应主设备的请求，响应包含从设备的地址和读取或写入的数据。
3. 主设备根据响应的数据进行后续处理。

modbus字段类型有：

- 线圈（Coil）：用于控制设备的开关状态，0表示关，1表示开。
- 离散输入（Discrete Input）：用于读取设备的开关状态，0表示关，1表示开。
- 保持寄存器（Holding Register）：用于存储设备的数值，16位无符号整数。
- 输入寄存器（Input Register）：用于读取设备的数值，16位无符号整数。

数据类型有：

- 布尔（Boolean）：用于表示开关状态，0表示关，1表示开。
- 整数（Integer）：用于存储设备的数值，16位有符号整数。
- 浮点数（Float）：用于存储设备的数值，32位浮点数。
- 字符串（String）：用于存储设备的文本信息。

通信方式有：

- 串行（Serial）：通过串口进行通信，通常使用RS-232或RS-485接口。
- 以太网（Ethernet）：通过以太网进行通信，通常使用TCP/IP协议。

### 数据类型

多字节数据类型如Long/Float/Double会存在ABCD、DCBA、CDAB、BADC的问题，需要注意字节序。

```java
static float convertToLittleEndianByteSwap(float value) {
    // 将float转换为byte数组（Big-Endian）
    ByteBuffer byteBuffer = ByteBuffer.allocate(4);
    // 确保是以Big-Endian形式写入
    byteBuffer.order(ByteOrder.BIG_ENDIAN);
    byteBuffer.putFloat(value);
    byte[] bigEndianBytes = byteBuffer.array();

    // 转换为Little-Endian
    byte[] littleEndianBytes = new byte[4];
    // 按照CD AB顺序
    // [3, 4, 1, 2]
    // [7, 8, 5, 6, 3, 4, 1, 2]
    littleEndianBytes[0] = bigEndianBytes[2];
    littleEndianBytes[1] = bigEndianBytes[3];
    littleEndianBytes[2] = bigEndianBytes[0];
    littleEndianBytes[3] = bigEndianBytes[1];

    // 将Little-Endian字节数组转换回float
    ByteBuffer resultBuffer = ByteBuffer.wrap(littleEndianBytes);
    resultBuffer.order(ByteOrder.BIG_ENDIAN);
    return resultBuffer.getFloat();
}
```
