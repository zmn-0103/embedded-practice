---
schema_version: 1
topic_id: 24lc256
topic_title: 24LC256 EEPROM
---

## i2c1-029 | 24LC256内部地址宽度

标签：EEPROM, 地址, 单选题
难度：基础

### 题目

24LC256 EEPROM 使用多少个字节传递内部存储地址？

A. 1 字节\
B. 2 字节\
C. 3 字节\
D. 4 字节

### 参考答案

**核心结论：** 选B，使用两个内部地址字节。

**必要解释：** 该器件容量32K字节，内部地址不同于7位总线设备地址；不能直接套用8位寄存器指针。

**适用条件与依据：** 限定Microchip 24LC256：32K字节、64字节页、两字节内部地址；A2/A1/A0和WP按实际接线。写入仅使用已授权可覆盖区域。

[Microchip DS20001203Y：24LC256页写与ACK轮询](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)；[NXP UM10204 Rev7 §3：I2C协议](https://cache.nxp.com/docs/en/user-guide/UM10204.pdf)。

## i2c1-030 | EEPROM应答与写完成

标签：EEPROM, 写周期, 单选题
难度：基础

### 题目

EEPROM 数据字节获得 ACK 后，通常还需要考虑什么？

A. MCU 必须重新下载程序\
B. EEPROM 内部写周期是否完成\
C. 必须关闭所有 GPIO\
D. 必须切换 UART 波特率

### 参考答案

**核心结论：** 选B，还需等待内部自定时写周期完成。

**必要解释：** 事务中的数据ACK只确认接收，STOP后内部写入期间器件可能不应答，按手册进行有界ACK轮询。

**适用条件与依据：** 限定Microchip 24LC256：32K字节、64字节页、两字节内部地址；A2/A1/A0和WP按实际接线。写入仅使用已授权可覆盖区域。

[Microchip DS20001203Y：24LC256页写与ACK轮询](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)；[NXP UM10204 Rev7 §3：I2C协议](https://cache.nxp.com/docs/en/user-guide/UM10204.pdf)。

## i2c1-051 | 数据ACK等于持久化吗

标签：EEPROM, 写周期, 判断题
难度：基础

### 题目

EEPROM 对写入数据返回 ACK，就一定说明该数据已经成功保存到非易失性存储单元。

### 参考答案

**核心结论：** 错误。数据被ACK不等于内部非易失写已完成。

**必要解释：** 等待STOP后的写周期，按24LC256手册ACK轮询就绪后回读验证；掉电一致性另设计。

**适用条件与依据：** 限定Microchip 24LC256：32K字节、64字节页、两字节内部地址；A2/A1/A0和WP按实际接线。写入仅使用已授权可覆盖区域。

[Microchip DS20001203Y：24LC256页写与ACK轮询](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)；[NXP UM10204 Rev7 §3：I2C协议](https://cache.nxp.com/docs/en/user-guide/UM10204.pdf)。

## i2c1-073 | EEPROM跨页拆分

标签：EEPROM, 页写, 计算题
难度：综合

### 题目

EEPROM 跨页写入问题

假设使用 24LC256 EEPROM，其页写入大小为 64 字节。

现在准备从内部地址 0x003E 开始，连续写入 4 字节。

请回答：

（1）这 4 字节跨越了哪两个存储页面？\
（2）为什么不应该直接作为一次普通的 4 字节页写入？\
（3）怎样拆分这次写入？\
（4）每次写入事务结束后，如何判断 EEPROM 已完成内部写周期？

### 参考答案

**核心结论：** 0x003E和0x003F在第0页，0x0040和0x0041在第1页，应分成2字节加2字节。

**必要解释：** 24LC256一次页写跨尾会页内回绕；每次STOP后做有截止时间的地址ACK轮询至就绪，再发下一段并回读，不把接收ACK当持久化完成。

**适用条件与依据：** 限定Microchip 24LC256：32K字节、64字节页、两字节内部地址；A2/A1/A0和WP按实际接线。写入仅使用已授权可覆盖区域。

[Microchip DS20001203Y：24LC256页写与ACK轮询](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/24AA256-24LC256-24FC256-256K-I2C-Serial-EEPROM-DS20001203.pdf)；[NXP UM10204 Rev7 §3：I2C协议](https://cache.nxp.com/docs/en/user-guide/UM10204.pdf)。
