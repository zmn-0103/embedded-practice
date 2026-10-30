---
schema_version: 1
topic_id: 24lc256
topic_title: 24LC256 存储机制
---

## i2c1-029 | 两类地址各指向什么

标签：EEPROM, 地址
难度：基础

### 题目

适用器件：Microchip 24LC256，容量 32K×8。I2C 总线设备地址与读写事务中的内部存储地址有什么区别？为什么该器件使用两个内部地址字节？

### 参考答案

**核心回答：** 总线地址选择器件，内部地址选择器件中的存储位置；32K 字节需要 15 位索引，采用两个内部地址字节传递。

#### 回答要点

还要按 A2/A1/A0 接线得到实际总线地址；传输字节中的读写方向位不属于 7 位地址数值。

#### 易混点与适用边界

不能把“两个内部地址字节”推广到所有 I2C 从机。

#### 来源

[Microchip DS20001203Y：§5～8地址、页写、ACK轮询与读操作](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)。

## i2c1-030 | 接收应答与非易失写完成

标签：EEPROM, 状态辨析
难度：进阶

### 题目

适用器件：Microchip 24LC256。写入数据获得 ACK 后，能否认为非易失性阵列已写完？STOP 后如何判断器件重新就绪？

### 参考答案

**核心回答：** ACK 只确认当前字节被接收；STOP 后还有内部自定时写周期，应按手册进行有界 ACK 轮询，重新应答后再继续。

#### 回答要点

内部写周期内器件可能不应答；轮询要有截止时间，必要时回读检查实际数据。

#### 易混点与适用边界

重新就绪与内容正确仍是两层判断；不使用固定很短延时替代器件时序要求。

#### 来源

[Microchip DS20001203Y：§5～8地址、页写、ACK轮询与读操作](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)。

## i2c1-073 | 跨页写入的推导

标签：EEPROM, 页边界, 参数计算
难度：进阶

### 题目

适用器件：Microchip 24LC256，64 字节页。从内部地址 0x003E 开始写 4 字节，应如何拆分？为什么一次 4 字节页写会有问题？

### 参考答案

**核心回答：** 0x003E、0x003F 属于第 0 页，0x0040、0x0041 属于第 1 页，拆为 2 字节加 2 字节。

#### 回答要点

页写越过页尾会在当前页回绕；每段各自 STOP，并等待内部写周期结束再发下一段。

#### 易混点与适用边界

需核对 WP、器件地址和允许覆盖区域；页大小与忙行为限定该型号。

#### 来源

[Microchip DS20001203Y：§5～8地址、页写、ACK轮询与读操作](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)。
