---
schema_version: 1
topic_id: stm32f103-i2c
topic_title: STM32F1 I2C
---

## i2c1-011 | F103硬件I2C数量

标签：I2C, 外设实例, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103RCT6 具有几个硬件 I2C 外设？

A. 1 个\
B. 2 个\
C. 3 个\
D. 4 个

### 参考答案

**核心结论：** 选B，STM32F103RCT6提供I2C1和I2C2两个实例。

**必要解释：** 引脚可用性和冲突还要按封装/映射核对，不推广到全部STM32型号。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-012 | I2C1默认引脚

标签：I2C, 引脚映射, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C1 默认使用哪组引脚？

A. PA9、PA10\
B. PB6、PB7\
C. PB10、PB11\
D. PA5、PA7

### 参考答案

**核心结论：** 选B，PB6为SCL、PB7为SDA。

**必要解释：** 默认映射前提下成立；需配置GPIOB时钟与复用开漏。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-013 | I2C1重映射引脚

标签：I2C, AFIO, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C1 重映射后可以使用哪组引脚？

A. PB8、PB9\
B. PA0、PA1\
C. PC10、PC11\
D. PA11、PA12

### 参考答案

**核心结论：** 选A，PB8为SCL、PB9为SDA。

**必要解释：** 还需AFIO时钟与MAPR配置，并排除这些脚上的其他功能冲突。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-014 | I2C1时钟归属

标签：I2C, RCC, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 的 I2C1 外设时钟位于哪条总线上？

A. AHB\
B. APB1\
C. APB2\
D. USB 专用时钟域

### 参考答案

**核心结论：** 选B，I2C1位于APB1。

**必要解释：** GPIOB与AFIO位于APB2，不能用一个门控位替代所有依赖。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-015 | SCL目标频率成员

标签：I2C, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

`I2C_InitTypeDef` 中，哪个参数用于配置目标 SCL 通信频率？

A. I2C_OwnAddress1\
B. I2C_Mode\
C. I2C_ClockSpeed\
D. I2C_AcknowledgedAddress

### 参考答案

**核心结论：** 选C，I2C_ClockSpeed指定目标SCL频率。

**必要解释：** 实际频率还受PCLK1、CCR、上升沿和时钟延展影响，本机地址成员不设置速率。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-016 | 产生START后的状态

标签：I2C, SB, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32 调用 `I2C_GenerateSTART()` 后，通常需要等待哪个标志？

A. RXNE\
B. SB\
C. OVR\
D. BTF

### 参考答案

**核心结论：** 选B，通常等待SR1.SB置位。

**必要解释：** GenerateSTART只请求START，物理产生还受PE、总线状态和时序条件影响。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-017 | 地址阶段应答状态

标签：I2C, ADDR, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

在 7 位地址主发送模式下，目标设备应答地址后，哪个标志会置位？

A. ADDR\
B. RXNE\
C. ARLO\
D. OVR

### 参考答案

**核心结论：** 选A，主机发送7位地址且收到地址ACK后ADDR置位。

**必要解释：** 随后按接收长度/发送方向安排控制位并以SR1后SR2序列清ADDR。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-018 | I2C TXE含义

标签：I2C, TXE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

TXE = 1 主要表示什么？

A. 整个通信已经完成\
B. 发送数据寄存器为空\
C. 接收数据已经到达\
D. I2C 总线已经空闲

### 参考答案

**核心结论：** 选B，发送数据寄存器为空。

**必要解释：** 移位寄存器可能仍发送，TXE不单独证明末字节已完成或总线空闲。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-019 | 主发送末字节收尾

标签：I2C, BTF, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

主发送模式下，最后一个字节写入 DR 后，通常应等待哪个标志再产生 STOP？

A. RXNE\
B. AF\
C. BTF\
D. ARLO

### 参考答案

**核心结论：** 选C，通常等待BTF再请求STOP。

**必要解释：** 本题限定主发送正常完成并已检查AF等错误，不能忽略无应答或仅等TXE。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-020 | SPL地址参数编码

标签：I2C, SPL, 地址编码, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

标准外设库 `I2C_Send7bitAddress()` 对地址参数的处理，哪项正确？

A. 自动将未经处理的 7 位地址左移\
B. 自动判断目标器件的内部寄存器地址\
C. 根据通信方向调整地址参数最低位，但不会自动左移原始 7 位地址\
D. 自动发送寄存器地址和数据

### 参考答案

**核心结论：** 选C，SPL V3.5.0只调整最低方向位，不替调用者左移原始7位地址。

**必要解释：** 如7位0x50应传0xA0，方向参数再决定线上0xA0或0xA1。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-021 | I2C RXNE含义

标签：I2C, RXNE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

RXNE = 1 表示什么？

A. 发送寄存器为空\
B. 接收数据寄存器中有未读取的数据\
C. START 已产生\
D. 设备地址错误

### 参考答案

**核心结论：** 选B，DR中有未读接收数据。

**必要解释：** F1接收末尾还需ACK/POS/BTF等配合，不能只因RXNE就随意读取所有字节。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-022 | 主接收最后应答

标签：I2C, NACK, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32 读取最后一个字节时，通常应产生什么应答？

A. ACK\
B. NACK\
C. START\
D. ARLO

### 参考答案

**核心结论：** 选B，主机对最后字节发送NACK表示本次接收结束。

**必要解释：** F1硬件须提前按长度分支安排ACK/STOP，不能等字节读完才临时改变ACK。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-023 | F1双字节接收控制

标签：I2C, POS, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 接收 2 字节时，需要特别关注哪个控制位？

A. POS\
B. TXE\
C. ARLO\
D. BERR

### 参考答案

**核心结论：** 选A，需要特别关注POS。

**必要解释：** 还要联合ACK、ADDR清除、BTF及STOP时序，单独改POS不能完成可靠收尾。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-024 | ADDR清除访问顺序

标签：I2C, ADDR, 寄存器, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 的 ADDR 标志需要通过什么顺序清除？

A. 先读 SR2，再读 SR1\
B. 先读 SR1，再读 SR2\
C. 只读取 DR\
D. 只设置 STOP

### 参考答案

**核心结论：** 选B，先读SR1，再读SR2。

**必要解释：** 该读取序列有硬件副作用，调试器和I2C_CheckEvent也可能触发它。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 具体芯片修订对应的勘误适用性和板上波形待核实。

## i2c1-025 | 按接收长度分支

标签：I2C, 接收时序, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么 STM32F103 接收 1、2、3 字节及以上时需要不同处理？

A. 因为三种情况使用不同引脚\
B. 因为 I2C 协议禁止连续接收\
C. 因为最后几个字节的 ACK、POS、STOP 时序要求不同\
D. 因为每接收一个字节必须重新初始化外设

### 参考答案

**核心结论：** 选C，最后几个字节的ACK、POS、BTF和STOP控制不同。

**必要解释：** F1存在数据寄存器与移位寄存器流水线，1、2与不少于3字节应按AN2824分支。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-031 | AF标志含义

标签：I2C, AF, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

AF 主要代表什么？

A. 应答失败\
B. DMA 传输完成\
C. 总线空闲\
D. 接收完成

### 参考答案

**核心结论：** 选A，应答失败。

**必要解释：** 需按发生阶段区分地址NACK和数据NACK；在某些从机发送结束场景，NACK可属于预期协议动作。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-032 | BERR标志含义

标签：I2C, BERR, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

BERR 主要代表什么？

A. 地址匹配\
B. 总线错误\
C. 数据寄存器为空\
D. 发送完成

### 参考答案

**核心结论：** 选B，总线错误，例如检测到不符合当前状态的START/STOP。

**必要解释：** 结合线路波形与外设状态定位，清标志不自动修复电气或状态机故障。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-033 | ARLO标志含义

标签：I2C, ARLO, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

ARLO 主要代表什么？

A. 时钟配置错误\
B. 发送数据完成\
C. 仲裁丢失\
D. 接收数据寄存器为空

### 参考答案

**核心结论：** 选C，仲裁丢失。

**必要解释：** 多主机中应放弃当前主机事务并按设计退避，不能无条件发送STOP破坏获胜者事务。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-035 | 线高但BUSY不清

标签：I2C, BUSY, 勘误, 单选题
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

BUSY 持续置位，但 SDA、SCL 实际均为高电平，应该优先考虑什么？

A. 一定是传感器损坏\
B. 可能存在 I2C 外设内部异常，需要核对芯片勘误\
C. 直接删除所有 START 操作\
D. 一定是串口波特率错误

### 参考答案

**核心结论：** 选B，可能是外设内部状态/模拟滤波相关限制，应核对具体芯片勘误。

**必要解释：** 先确认测量时刻和其他主机活动，按ES0340相应恢复步骤处理，不能随意写SR2或认定传感器损坏。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 具体芯片修订对应的勘误适用性和板上波形待核实。

## i2c1-038 | 断点影响接收时序

标签：I2C, 调试副作用, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么不能在 STM32F103 I2C 接收关键时序中随意设置断点？

A. 会改变设备地址\
B. CPU 暂停可能破坏严格的 ACK、STOP 等时序\
C. 会自动删除程序\
D. 会改变 Flash 容量

### 参考答案

**核心结论：** 选B，CPU暂停可能使ACK/STOP控制错过关键窗口。

**必要解释：** 外设和目标设备未必随CPU停止，关键区需按AN2824与勘误保护；优先在安全位置记录状态与抓波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-039 | Watch窗口的作用

标签：I2C, 调试副作用, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

Keil 的 Watch 窗口主要用于什么？

A. 修改硬件 PCB\
B. 观察变量、状态和数据\
C. 分析 SDA 模拟电压上升沿\
D. 直接测量 I2C 上拉电阻

### 参考答案

**核心结论：** 选B，观察软件变量、状态和数据。

**必要解释：** 观察硬件寄存器需注意SR1/SR2/DR读取副作用，Watch不能直接测量模拟边沿或上拉电阻。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-043 | I2C初始化依赖多选

标签：I2C, RCC, GPIO, 多选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于 STM32F103 I2C 初始化，正确的是：

A. I2C1 使用 APB1 外设时钟\
B. GPIOB 使用 APB2 外设时钟\
C. 初始化前需要使能对应外设时钟\
D. SDA 和 SCL 必须配置为普通推挽输出

### 参考答案

**核心结论：** 选A、B、C；I2C1在APB1，GPIOB在APB2，访问前需开启对应时钟。

**必要解释：** SCL/SDA为复用开漏并需有效上拉；不是普通推挽。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-044 | 主发送应关注的状态

标签：I2C, 发送时序, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 主发送模式中，可能需要检查哪些状态？

A. SB\
B. ADDR\
C. TXE\
D. RXNE

### 参考答案

**核心结论：** 选A、B、C，即SB、ADDR、TXE。

**必要解释：** 末尾另检查BTF和错误；RXNE用于接收，不是普通主发送推进的核心条件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-045 | 双字节接收多选

标签：I2C, 接收时序, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 接收 2 字节时，需要特别注意哪些内容？

A. POS 配置\
B. ACK 关闭时机\
C. BTF 状态\
D. 可以完全忽略 ADDR 清除时序

### 参考答案

**核心结论：** 选A、B、C，POS、ACK关闭与BTF均要关注。

**必要解释：** ADDR清除时机同样关键，按AN2824在ADDR前准备POS/ACK，清ADDR后及时清ACK，再等BTF收尾。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-046 | 错误与超时多选

标签：I2C, 错误处理, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于 I2C 错误处理，正确的是：

A. AF 可能表示应答失败\
B. BERR 表示检测到总线错误\
C. BUSY 本身不是错误标志\
D. 软件可以只依靠硬件 TIMEOUT 标志处理所有普通 I2C 等待超时

### 参考答案

**核心结论：** 选A、B、C，AF和BERR是错误，BUSY是总线状态。

**必要解释：** 普通I2C软件等待不能只靠硬件TIMEOUT覆盖，应设置独立软件截止时间并区分失败阶段。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-047 | 调试工具与副作用多选

标签：I2C, 调试副作用, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于调试工具，正确的是：

A. 逻辑分析仪可以分析 I2C 协议\
B. 示波器适合测量电压和上升时间\
C. 读取部分 I2C 状态寄存器可能产生副作用\
D. 对所有 I2C 通信时序进行单步执行都绝对安全

### 参考答案

**核心结论：** 选A、B、C。

**必要解释：** 逻辑分析仪解码、示波器看电气、寄存器读取可能清状态；关键接收步骤随意单步并不安全。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-052 | 0x68地址的SPL参数

标签：I2C, 地址编码, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

若 I2C 目标设备的 7 位地址为 0x68，则在 STM32F10x 标准外设库的常规 7 位寻址中，可以将 0xD0 作为 `I2C_Send7bitAddress()` 的地址参数，并通过方向参数选择读写。

### 参考答案

**核心结论：** 正确。0x68左移一位得到0xD0，函数再设置读写位。

**必要解释：** 写方向线上0xD0，读方向0xD1；不要再次左移已经编码的参数。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-053 | 事件检查是否纯读

标签：I2C, SPL, 调试副作用, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

`I2C_CheckEvent()` 仅检查一个普通软件变量，不会涉及硬件寄存器读取副作用。

### 参考答案

**核心结论：** 错误。I2C_CheckEvent读取SR1再SR2并拼接事件，可能清ADDR。

**必要解释：** 在接收关键区提前调用会改变状态机时序，必须读实现和事件宏定义。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-054 | OwnAddress1的对象

标签：I2C, SPL, 地址, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

`I2C_OwnAddress1` 用于指定当前 STM32 主机准备访问的传感器地址。

### 参考答案

**核心结论：** 错误。OwnAddress1指定STM32自身地址，不是当前访问的目标地址。

**必要解释：** 目标地址在主事务地址阶段写入DR，二者用途独立。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-055 | TXE与末字节完成判断

标签：I2C, TXE, BTF, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

TXE = 1 就一定代表当前最后一个字节已经完整发送到 I2C 总线上。

### 参考答案

**核心结论：** 错误。TXE表示DR空，移位器可能仍忙。

**必要解释：** 主发送末尾按正常BTF完成条件及错误状态安排STOP。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-057 | RXNE与BTF不同

标签：I2C, RXNE, BTF, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 主接收模式下，RXNE 和 BTF 的含义完全相同。

### 参考答案

**核心结论：** 错误。RXNE表示DR有数据，接收BTF涉及DR和移位器都保存待取数据的流水线状态。

**必要解释：** 它们在末尾字节控制中作用不同，不能用同一轮询条件替换所有收尾。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-058 | 双字节接收能否省时序

标签：I2C, POS, 接收时序, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 接收两个字节时，可以完全忽略 POS、ACK 与 ADDR 清除之间的时序关系。

### 参考答案

**核心结论：** 错误。POS、ACK和ADDR清除的相对时机决定最后字节NACK控制。

**必要解释：** 还需等待BTF、安排STOP及读取两字节，按芯片勘误保护关键区。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-059 | BUSY内部异常可能性

标签：I2C, BUSY, 勘误, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 存在已知的 I2C 硬件限制，在特定情况下，SCL/SDA 实际为空闲高电平，但 BUSY 仍可能异常保持置位。

### 参考答案

**核心结论：** 正确。某些适用条件下外线已高，内部BUSY仍可能异常。

**必要解释：** 确认实际修订与ES0340，不将“已知限制”当作所有BUSY故障的唯一原因。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 具体芯片修订对应的勘误适用性和板上波形待核实。

## i2c1-063 | 0x29的地址字节

标签：I2C, SPL, 地址编码, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

一个 I2C 设备的 7 位地址为 0x29，请计算：

（1）写方向地址字节。\
（2）读方向地址字节。\
（3）STM32F10x 标准库 `I2C_Send7bitAddress()` 为什么不能直接使用未经处理的 0x29？

### 参考答案

**核心结论：** 写方向0x52，读方向0x53；SPL V3.5.0地址参数用0x29左移一位即0x52。

**必要解释：** 该函数仅调整最低方向位；直接传0x29会在写方向清最低位得到错误线上地址。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-064 | 六个初始化成员

标签：I2C, SPL, 函数辨析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

`I2C_InitTypeDef` 包含哪六个主要配置参数？其中本机地址与目标设备地址有什么区别？

### 参考答案

**核心结论：** 主要为I2C_ClockSpeed、I2C_Mode、I2C_DutyCycle、I2C_OwnAddress1、I2C_Ack、I2C_AcknowledgedAddress。

**必要解释：** 分别对应速率、协议模式、快模占空比、自身地址、应答和自身寻址格式；目标地址在主事务另指定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-065 | 五个状态标志关系

标签：I2C, 状态标志
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请解释 SB、ADDR、TXE、RXNE、BTF 各自代表什么，并说明 TXE 与 BTF 的关键区别。

### 参考答案

**核心结论：** SB表示START产生，ADDR表示地址阶段，TXE表示DR可写，RXNE表示DR有接收数据，BTF表示字节传输完成的流水线条件。

**必要解释：** 主发送TXE不代表移位器已结束，末尾检查BTF并同时检查AF/BERR/ARLO等错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-066 | 1 2 N字节接收收尾

标签：I2C, 接收时序, 流程分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 在主接收模式下，接收 1 字节、2 字节、3 字节及以上时，分别需要重点处理哪些时序问题？

### 参考答案

**核心结论：** 1字节在清ADDR前关ACK，清ADDR后及时STOP再等RXNE读；2字节预置POS/ACK，清ADDR后关ACK，等BTF后STOP读两字节。

**必要解释：** 不少于3字节先正常接收，余3时等BTF、关ACK、读倒数第3字节，再等BTF、STOP并读末两字节；关键区按AN2824/ES0340屏蔽并恢复原中断状态，结束后恢复ACK/POS。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-067 | 8位寄存器组合读取

标签：I2C, 重复START, 器件协议
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请描述 STM32 读取一个具有 8 位内部寄存器地址的 I2C 传感器寄存器时，常见的完整协议流程，并解释重复 START 的作用。

### 参考答案

**核心结论：** 常见流程为START、目标写地址、内部8位寄存器地址、重复START、目标读地址、收数据、末字节NACK、STOP。

**必要解释：** 每个发送阶段检查目标ACK；F1按接收长度分支，寄存器宽度和递增由器件手册规定，不能套给24LC256两字节地址。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-069 | 地址阶段无ACK排查

标签：I2C, SPL, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

地址发送后没有 ACK

某 STM32F103 工程使用标准外设库访问一个 7 位地址为 0x68 的传感器。

程序将 0x68 直接传入 `I2C_Send7bitAddress()` 的地址参数，并指定写方向。

程序可以正常编译，但发送设备地址后始终无法进入期望的 EV6 状态。

请回答：

（1）地址参数可能存在什么错误？\
（2）正确的参数应该如何计算？\
（3）如果修改地址后仍然没有 ACK，还应检查什么？\
（4）怎样防止程序一直卡在等待 EV6 的循环中？

### 参考答案

**核心结论：** 0x68原始7位地址应编码为0xD0传给SPL，再由方向参数选择线上位0。

**必要解释：** 仍无ACK时查器件地址引脚、供电共地、上拉、电平、映射/频率与波形；等待EV6同时识别AF和超时，不能永久循环。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c1-070 | 三字节接收失败定位

标签：I2C, 接收时序, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

连续接收三个字节失败

某 STM32F103 需要从传感器连续接收 3 个字节。

开发者采用以下思路：

1. 发送读方向设备地址。
2. 等待 RXNE。
3. 读取一个字节。
4. 重复以上接收操作，直到读取 3 个字节。
5. 最后产生 STOP。

运行时偶尔读取失败，部分数据不正确。

请回答：

（1）该处理思路忽略了 STM32F103 的什么特殊要求？\
（2）最后三个字节为什么需要关注 BTF？\
（3）ACK 应该在什么时候关闭？\
（4）为什么不能在严格的关键时序之间随意设置断点？

### 参考答案

**核心结论：** 原流程忽略ADDR清除和末3字节流水线控制；应等BTF后关ACK、读第1字节，再等BTF、STOP并读末两字节。

**必要解释：** 关键顺序按AN2824及适用勘误保护，不能仅循环RXNE后才STOP；断点可能使ACK/STOP错过窗口。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 具体芯片修订对应的勘误适用性和板上波形待核实。

## i2c1-071 | 线高但启动BUSY异常

标签：I2C, BUSY, 勘误, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 总线一直 BUSY

某 STM32F103RCT6 在上电后发现 I2C1 的 BUSY 标志一直为 1，无法正常产生 START。

使用测量工具确认：

- SCL 为高电平。
- SDA 为高电平。
- 外部器件没有明显保持线路低电平。

请回答：

（1）这是否一定说明外部传感器损坏？\
（2）应该查阅哪个官方技术文件？\
（3）为什么单纯进行 I2C 软件复位不一定有效？\
（4）应该遵循什么原则进行恢复？

### 参考答案

**核心结论：** 不一定是传感器坏，应查ES0340中I2C模拟滤波导致BUSY锁住等适用限制。

**必要解释：** 软件复位未必清掉此内部状态，按勘误规定检查实际SDA/SCL并操作恢复序列；核对修订号，禁止任意推挽强驱或改写只读BUSY。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 具体芯片修订对应的勘误适用性和板上波形待核实。

## i2c2-001 | START STOP ACK PE寄存器

标签：I2C, CR1, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 I2C 外设中，哪个寄存器主要用于控制 START、STOP、ACK 和 PE？

A. SR1\
B. CR1\
C. CCR\
D. TRISE

### 参考答案

**核心结论：** 选B，这些控制位主要位于CR1。

**必要解释：** 状态SR1/SR2、时钟CCR/TRISE与数据DR各有职责，不能混用。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-002 | SB标志的事件

标签：I2C, SB, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

SR1 中的 SB 标志主要表示什么？

A. 数据寄存器为空\
B. 接收数据寄存器非空\
C. START 条件已产生\
D. 总线发生仲裁丢失

### 参考答案

**核心结论：** 选C，START条件已产生。

**必要解释：** 请求START不等于SB立即置位，仍需检查总线、PE、错误与等待截止时间。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-003 | 发送DR可写状态

标签：I2C, TXE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

SR1 中的 TXE 置位，通常说明什么？

A. 总线已经完全空闲\
B. 数据寄存器为空，可以继续写入待发送数据\
C. 从机已经确认接收全部数据\
D. STOP 条件已经产生

### 参考答案

**核心结论：** 选B，发送数据寄存器为空，可写下一字节。

**必要解释：** 它不单独证明移位寄存器空、最后应答完成或STOP已经产生。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-004 | BTF与TXE条件辨析

标签：I2C, BTF, TXE, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于 BTF 与 TXE，下列哪项正确？

A. TXE 和 BTF 的含义完全相同\
B. TXE 置位就一定表示最后一个字节已经发送完毕\
C. BTF 可以反映数据寄存器与移位寄存器满足相应的传输完成条件\
D. BTF 只能用于接收，不能用于发送

### 参考答案

**核心结论：** 选C，BTF反映DR与移位寄存器满足该方向的字节完成条件。

**必要解释：** 主发送时DR和移位器均空；主接收时与两个接收位置已占用有关，不能把它等同TXE。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-006 | CR2 FREQ参数来源

标签：I2C, CR2, 时钟, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

CR2.FREQ 主要用于配置什么信息？

A. 目标从机的地址\
B. I2C 的 ACK 使能\
C. I2C 外设输入时钟 PCLK1 的频率信息\
D. 从机内部寄存器地址长度

### 参考答案

**核心结论：** 选C，外设输入PCLK1的MHz频率信息。

**必要解释：** FREQ不是目标SCL频率或器件内部地址宽度，实际频率变化后需同步时钟参数。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-007 | CCR寄存器职责

标签：I2C, CCR, 时钟, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

CCR 寄存器的主要作用是什么？

A. 配置 I2C 时钟分频参数\
B. 保存接收数据\
C. 清除所有错误标志\
D. 配置 GPIO 引脚复用

### 参考答案

**核心结论：** 选A，配置主机SCL分频与标准/快模式相关参数。

**必要解释：** 应结合PCLK1、模式和占空比计算，不能用它清错误或设置GPIO。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-009 | 重映射控制寄存器

标签：I2C, AFIO, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

使用 I2C1 重映射引脚时，通常还需要关注哪个寄存器？

A. GPIO_IDR\
B. AFIO_MAPR\
C. USART_SR\
D. SPI_CR1

### 参考答案

**核心结论：** 选B，AFIO_MAPR。

**必要解释：** 还需AFIO时钟、对应GPIO配置与无引脚冲突；默认I2C1重映射为PB8/PB9。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-010 | GPIO速度和总线频率

标签：I2C, GPIO, 时钟, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于 GPIO 输出速度与 I2C 通信频率，下列哪项正确？

A. GPIO 设置为 50 MHz，就表示 I2C 一定工作在 400 kHz\
B. GPIO 设置为 2 MHz，就表示 I2C 一定工作在 100 kHz\
C. GPIO 输出速度配置与 I2C 的实际 SCL 频率不是同一个参数\
D. I2C 不需要配置 GPIO

### 参考答案

**核心结论：** 选C，GPIO驱动速度配置不是SCL通信频率。

**必要解释：** SCL取决于PCLK1、CCR及总线电气/延展，不能由50MHz档位直接推出400kHz。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-011 | 改变PCLK1后的检查

标签：I2C, 时钟, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

如果 PCLK1 从 36 MHz 改为 24 MHz，以下哪项处理最合理？

A. 只修改系统主频宏定义\
B. 重新检查 CR2.FREQ、CCR、TRISE 和实际 SCL 波形\
C. 不需要修改任何参数\
D. 只修改 GPIO 输出速度

### 参考答案

**核心结论：** 选B，重新核对CR2.FREQ、CCR、TRISE和实际SCL。

**必要解释：** 仅改系统宏不会使所有寄存器自动匹配；改变运行中时钟应按手册安全停止和重新配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-012 | 复用开漏配置理由

标签：I2C, GPIO, 开漏, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 引脚通常采用复用开漏模式，其主要原因是什么？

A. 让 GPIO 自动生成 START 条件\
B. 适应 I2C 开漏式总线的电气特性\
C. 让 SCL 永远保持高电平\
D. 取消外部上拉电阻的必要性

### 参考答案

**核心结论：** 选B，适应I2C设备共同拉低/释放的电气结构。

**必要解释：** 高电平依赖有效上拉，不能因使用复用就省略上拉或电压兼容性检查。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-015 | START后的事件号

标签：I2C, SB, 事件, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

主机发送事务中，START 产生后通常应等待哪个事件，再发送设备地址？

A. EV5\
B. EV6\
C. EV8\
D. EV8_2

### 参考答案

**核心结论：** 选A，主机START产生后关注EV5。

**必要解释：** 仍要核对事件宏要求的主机/忙等组合位，并独立检查错误；名字不是完整实现。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-016 | 地址ACK后的状态推进

标签：I2C, ADDR, 单选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

主机发送地址并收到 ACK 后，下一步通常应关注什么？

A. 等待地址阶段完成，并按照规定清除 ADDR\
B. 立即将整个 SR1 清零\
C. 直接读取 DR\
D. 立即执行软件复位

### 参考答案

**核心结论：** 选A，等待地址阶段完成并按序清ADDR。

**必要解释：** 不能未确认地址ACK就直接发数据，接收路径还要先设置ACK/POS。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-018 | 末字节为何另等BTF

标签：I2C, TXE, BTF, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

在主机发送事务中，为什么不能只依靠 TXE 判断最后一个字节已完整发送？

A. TXE 只在从机模式有效\
B. TXE 置位并不等同于最后一个字节已经完成全部传输\
C. TXE 只能由软件清除\
D. TXE 与 DR 无关

### 参考答案

**核心结论：** 选B，TXE可能在当前字节仍移位时已经置位。

**必要解释：** 正常主发送末尾等待BTF并检查AF等错误，再安排STOP，不能立即返回成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-020 | 两字节接收的特殊控制

标签：I2C, POS, 接收时序, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 接收两个字节时，为什么不能简单地重复使用普通多字节接收流程？

A. 因为 DR 只能存储一个字节\
B. 因为 POS、ACK、BTF 和 STOP 的时序需要专门配合\
C. 因为 I2C 不支持两个字节\
D. 因为双字节接收必须使用 DMA

### 参考答案

**核心结论：** 选B，POS、ACK、BTF和STOP需要专门时序配合。

**必要解释：** 不能简单重复普通RXNE循环；还需控制ADDR清除与关键区，按AN2824处理。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-022 | 仲裁丢失后的行为

标签：I2C, ARLO, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

在多主机环境中，如果检测到 ARLO，以下哪种处理思路更合理？

A. 无条件立即产生 STOP\
B. 识别仲裁丢失，放弃当前主机事务并按设计处理\
C. 立即把 GPIO 配置为推挽输出\
D. 将 BUSY 强制清零

### 参考答案

**核心结论：** 选B，放弃当前主机事务，按总线状态和设计退避/重试。

**必要解释：** 不能无条件STOP打断获胜主机，先保留原因并按手册清ARLO，非幂等写还要确认副作用。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-024 | BUSY持续的排查依据

标签：I2C, BUSY, 勘误, 单选题
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

当 BUSY 长时间保持为 1 时，以下哪项最合理？

A. 一定是目标器件损坏\
B. 一定是 RCC 配置错误\
C. 结合线路电平、其他主机活动、外设状态及适用勘误进行排查\
D. 直接向 SR2 写入 0 清除 BUSY

### 参考答案

**核心结论：** 选C，结合线电平、其他主机、外设状态与勘误定位。

**必要解释：** BUSY为只读状态，不可直接写SR2清零；区分合法占用、卡线与内部异常。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-025 | 初始化工作多选

标签：I2C, RCC, 初始化, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 I2C 初始化通常涉及哪些工作？

A. 使能 GPIO 时钟\
B. 使能 I2C 外设时钟\
C. 配置 SCL、SDA 引脚\
D. 根据需要配置 AFIO 重映射\
E. 配置 I2C 时钟参数\
F. 配置 USART 波特率代替 I2C 初始化

### 参考答案

**核心结论：** 选A、B、C、D、E。

**必要解释：** GPIO/I2C时钟、引脚、必要AFIO重映射和时钟参数均要检查，USART波特率不能代替I2C配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-026 | I2C状态错误标志集合

标签：I2C, 状态标志, 多选题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

以下哪些属于 STM32F103 I2C 的重要状态或错误标志？

A. SB\
B. ADDR\
C. BTF\
D. RXNE\
E. AF\
F. ARLO

### 参考答案

**核心结论：** 选A、B、C、D、E、F。

**必要解释：** SB/ADDR/BTF/RXNE描述事务状态，AF/ARLO描述错误，处理方式和清除规则不同。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-027 | 分析库函数的观察点

标签：I2C, SPL, 函数分析, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析标准外设库函数时，应关注哪些内容？

A. 输入参数的含义\
B. 读取了哪些硬件寄存器\
C. 修改了哪些寄存器位\
D. 是否存在硬件副作用\
E. 调用前后状态机如何变化\
F. 只记住函数名称，不必查看实现

### 参考答案

**核心结论：** 选A、B、C、D、E。

**必要解释：** 需跟踪参数编码、寄存器读写、副作用及调用前后状态，不能只凭名称推断等待或恢复能力。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-028 | 通信失败因素多选

标签：I2C, 故障分析, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

以下哪些因素可能导致 I2C 通信失败？

A. 从机地址错误\
B. 上拉电阻或线路电气条件不合适\
C. SCL 时钟配置不正确\
D. 从机未应答\
E. 状态标志处理顺序错误\
F. 接收最后一个字节时 ACK/NACK 时序错误

### 参考答案

**核心结论：** 选A、B、C、D、E、F。

**必要解释：** 地址、电气、频率、目标应答、状态清除与接收收尾任何一环错误都可能失败，应按阶段提供证据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-029 | 接收关键条件多选

标签：I2C, 接收时序, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

以下哪些操作或事件与 I2C 接收流程密切相关？

A. RXNE\
B. BTF\
C. ACK\
D. POS\
E. STOP 或重复 START\
F. USART 的 TC 标志

### 参考答案

**核心结论：** 选A、B、C、D、E。

**必要解释：** RXNE/BTF、ACK/POS及STOP或重复START共同控制F1接收；USART的TC属于另一外设。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-030 | I2C错误处理边界

标签：I2C, 错误处理, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

关于 I2C 错误处理，哪些说法正确？

A. 不同错误标志可能具有不同的清除规则\
B. 所有 SR1 标志都可以通过向 SR1 写入 0 清除\
C. 软件超时与硬件错误应分别识别\
D. 仲裁丢失后应结合当前总线状态处理\
E. 软件复位不等同于物理总线恢复\
F. 清除错误标志就必然意味着通信已经恢复

### 参考答案

**核心结论：** 选A、C、D、E。

**必要解释：** 不是所有SR1位都可写0清，软件复位不等于释放物理线路，清标志也不保证恢复通信。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-031 | 驱动验证覆盖范围

标签：I2C, 测试设计, 多选题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

以下哪些内容应纳入 I2C 驱动的验证范围？

A. 单字节发送\
B. 多字节发送\
C. 单字节接收\
D. 双字节和多字节接收\
E. 重复 START\
F. 错误处理与软件超时\
G. 总线恢复与连续通信稳定性

### 参考答案

**核心结论：** 选A至G，覆盖发送、各长度接收、重复START、错误超时和恢复/连续运行。

**必要解释：** 功能通过需对应真实证据；编译或短时正常不能替代异常、波形及长期运行验证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-032 | RCC时钟与PE

标签：I2C, RCC, CR1, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

使能 RCC 中的 I2C 时钟，就等于已经使能 I2C 外设的 PE 位。

### 参考答案

**核心结论：** 错误。RCC门控与CR1.PE为不同控制。

**必要解释：** 时钟使能不自动设置PE，PE也不能替代时钟和引脚配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-033 | TXE可写DR判断

标签：I2C, TXE, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 I2C 的 TXE 置位，说明 DR 已经可以接收下一个待发送字节。

### 参考答案

**核心结论：** 正确，在本题主发送状态下TXE表示DR可接收下一个待发字节。

**必要解释：** 还需确保地址阶段已完成且无错误，不用TXE判断整个事务结束。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-034 | TXE能否代表末字节完成

标签：I2C, TXE, BTF, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

TXE 置位就能保证最后一个字节已经完整地发送到总线上。

### 参考答案

**核心结论：** 错误。发送DR腾空时移位器可能仍在发送。

**必要解释：** 末字节需按BTF等完成条件及错误状态处理，不能立即STOP或返回成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-035 | ADDR读取清除判断

标签：I2C, ADDR, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

读取 SR1 后再读取 SR2，是清除 ADDR 标志的重要硬件规则。

### 参考答案

**核心结论：** 正确。按SR1后SR2的读取序列清ADDR。

**必要解释：** 读取操作可能改变硬件流程，不能在接收控制位准备前由检查函数提前触发。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-039 | POS修改时机

标签：I2C, POS, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

POS 可以在双字节接收即将结束时再随意修改，不影响接收时序。

### 参考答案

**核心结论：** 错误。双字节接收的POS应在规定阶段提前配置。

**必要解释：** 在结尾任意改POS会错过ACK作用位置，需与ACK、ADDR清除和BTF顺序配合。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-040 | RXNE循环能否统一收尾

标签：I2C, RXNE, 接收时序, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

多字节接收过程中，所有字节都可以只依赖 RXNE 完成正确收尾。

### 参考答案

**核心结论：** 错误。最后几个字节涉及流水线和ACK/STOP时序，不能仅循环RXNE。

**必要解释：** F1的1、2、末3字节按AN2824分支，并核对适用勘误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-042 | 软件复位与线电平

标签：I2C, 总线恢复, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

只要 I2C 外设执行软件复位，SDA 和 SCL 就一定会恢复到高电平。

### 参考答案

**核心结论：** 错误。SWRST不保证被外部器件拉低的SDA/SCL恢复高。

**必要解释：** 还可能存在勘误中的内部BUSY限制，需先识别线路与外设状态再按适用方案恢复。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-043 | 50MHz档位与400kHz

标签：I2C, GPIO, 时钟, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

GPIO 配置为 50 MHz 输出速度，意味着 I2C 总线必然运行在 400 kHz。

### 参考答案

**核心结论：** 错误。GPIO输出档位不决定I2C目标频率。

**必要解释：** PCLK1、CCR/TRISE与电气/延展共同影响SCL，需计算并测波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-044 | 驱动是否应查勘误

标签：I2C, 勘误, 判断题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 的 I2C 驱动设计需要考虑适用于具体芯片版本的官方勘误。

### 参考答案

**核心结论：** 正确。F103RCT6应按实物修订核对ES0340等适用文件。

**必要解释：** 不能把某个修订的解决方案不加条件地套到所有芯片，也不能仅凭手册常规流程宣称硬件已验证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-045 | PE与START填空

标签：I2C, CR1, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 的 CR1 寄存器中，PE 位用于控制 \_\_\_\_\_\_\_\_\_\_，START 位用于请求产生 \_\_\_\_\_\_\_\_\_\_ 条件。

### 参考答案

**核心结论：** PE控制I2C外设使能，START请求产生起始条件。

**必要解释：** 置START只是请求，仍需等待SB并处理总线状态、错误和超时。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-046 | 收发DR状态填空

标签：I2C, RXNE, TXE, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

SR1 中，表示接收数据寄存器非空的标志是 \_\_\_\_\_\_\_\_\_\_；表示发送数据寄存器为空的标志是 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** 依次为RXNE和TXE。

**必要解释：** 前者表示接收数据可读，后者表示发送DR可写，不能据此省略事务阶段控制。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-047 | FREQ频率来源填空

标签：I2C, CR2, 时钟, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 外设时钟参数 CR2.FREQ 反映的是 \_\_\_\_\_\_\_\_\_\_ 的频率信息，而不是直接使用系统主频 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** 依次为PCLK1和SYSCLK。

**必要解释：** FREQ编码外设输入时钟的MHz信息，不在任何时钟树下都等于系统主频。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-048 | 标准与快模式分频条件

标签：I2C, CCR, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 I2C采用标准模式（F/S=0），假定SCL高、低各由CCR个PCLK1周期构成。请写出CCR与PCLK1、目标SCL频率的关系，并说明为什么不能把快模式DUTY=0的低高比2:1公式套到标准模式。

### 参考答案

**核心结论：** 标准模式CCR=PCLK1/(2×fSCL)，高低各为CCR个PCLK1周期；原题把快模式2:1混入标准模式，前提需纠正。

**必要解释：** 快模式DUTY=0的低高比为2:1，才有PCLK1/(3×fSCL)；还需按寄存器范围取整并核对TRISE与实际波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-050 | EV5与EV6阶段

标签：I2C, 事件, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

主机发送流程中，EV5 对应的主要阶段是 \_\_\_\_\_\_\_\_\_\_；EV6 对应的主要阶段是 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** EV5对应主机START产生，EV6对应地址发送并获应答的地址阶段完成。

**必要解释：** 具体宏还包含MSL/BUSY/TRA等方向条件，不能只测SB或ADDR就断言整个事件组合匹配。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-051 | TXE与BTF填空

标签：I2C, TXE, BTF, 填空题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

TXE 主要反映 \_\_\_\_\_\_\_\_\_\_ 的状态，而 BTF 反映 \_\_\_\_\_\_\_\_\_\_ 与 \_\_\_\_\_\_\_\_\_\_ 满足相应的传输完成条件。

### 参考答案

**核心结论：** TXE主要反映发送DR；BTF反映DR与移位寄存器在当前收发方向下的字节完成条件。

**必要解释：** 发送末尾与接收末尾对BTF的含义和处理不同，不能把两个标志等同。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-052 | ADDR清除寄存器填空

标签：I2C, ADDR, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

STM32F103 I2C 中，清除 ADDR 通常需要依次读取 \_\_\_\_\_\_\_\_\_\_ 和 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** 依次为SR1和SR2。

**必要解释：** 序列会改变硬件状态；只读其中一个或反顺序不能作为正确清除依据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-053 | 单字节接收应答填空

标签：I2C, ACK, NACK, 填空题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

在STM32F103单字节主接收中，主机需要在清除ADDR之前关闭ACK，使主机对最后一个字节发送________，表示本次不再接收更多字节。请填空并说明STOP和读取DR的先后要求。

### 参考答案

**核心结论：** 填NACK，但ACK必须在清ADDR前关闭，不能等接收结束后才关。

**必要解释：** 清ADDR后及时请求STOP，再等RXNE读DR；把题干的“结束时”理解为末字节应答控制而非读后操作。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-054 | 三类错误标志填空

标签：I2C, 错误标志, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

SR1.AF 表示 \_\_\_\_\_\_\_\_\_\_，SR1.ARLO 表示 \_\_\_\_\_\_\_\_\_\_，SR1.BERR 表示 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** 依次为应答失败、仲裁丢失、总线错误。

**必要解释：** 对应AF、ARLO、BERR；各错误的检测阶段和恢复不同，不能清标志后统一无条件STOP重试。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-056 | I2C1重映射填空

标签：I2C, AFIO, 填空题
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C1 默认引脚通常为 PB6 和 PB7；重映射后可使用 \_\_\_\_\_\_\_\_\_\_ 和 \_\_\_\_\_\_\_\_\_\_。

### 参考答案

**核心结论：** PB8和PB9，分别为SCL与SDA。

**必要解释：** 重映射需AFIO配置、引脚电气和时钟依赖都满足。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-057 | 七个I2C寄存器职责

标签：I2C, 寄存器, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请说明 CR1、CR2、DR、SR1、SR2、CCR 和 TRISE 的主要作用，并举例说明它们在一次主机发送事务中的用途。

### 参考答案

**核心结论：** CR1管PE/START/STOP/ACK等，CR2管输入时钟和中断/DMA，DR收发字节，SR1/SR2描述状态，CCR和TRISE配置主机时序。

**必要解释：** 主发送前配置时钟与使能，START后等SB写地址、处理ADDR后写数据，按TXE/BTF推进；读状态可能有清除副作用。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-058 | 时钟初始化与使能分工

标签：I2C, RCC, SPL, 概念辨析
难度：基础

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请解释 RCC 时钟使能、I2C 外设初始化和 I2C_Cmd() 之间的区别。

### 参考答案

**核心结论：** RCC开放时钟，I2C_Init设置相关参数，I2C_Cmd控制CR1.PE。

**必要解释：** 还需GPIO/AFIO配置，不能因其中一步完成就认为主事务已可无条件发送。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-059 | 复用开漏与上拉协作

标签：I2C, GPIO, 电气特性
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么 STM32F103 I2C 引脚通常采用复用开漏模式？外部上拉电阻的作用是什么？

### 参考答案

**核心结论：** 复用让I2C外设控制引脚，开漏允许多设备共同拉低或释放，上拉负责恢复高电平。

**必要解释：** 按总线电容、上升时间、低电平电流与电压兼容选阻值；内部弱上拉不自动满足总线时序。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-060 | PCLK1与三个时钟寄存器

标签：I2C, 时钟, 计算分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请说明 PCLK1、CR2.FREQ、CCR 和 TRISE 之间的关系，并解释为什么修改系统时钟后必须重新检查 I2C 配置。

### 参考答案

**核心结论：** PCLK1是输入，CR2.FREQ记录其MHz信息，CCR按模式分频，TRISE按允许上升时间和PCLK1周期配置。

**必要解释：** 标准模式常用TRISE=FREQ+1；快模按300ns与时钟周期计算并遵守寄存器规则，改变时钟后需重算且测实际波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-061 | 主发送阶段先后

标签：I2C, 发送时序, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请说明 START、地址传输、ADDR 清除、数据发送和 STOP 之间的先后关系。

### 参考答案

**核心结论：** 检查可发起条件，请求START并等SB，发送地址并等ADDR/错误，按SR1后SR2清ADDR，再发数据，末尾BTF后STOP。

**必要解释：** 中间字节用TXE推进，每个等待有界并检查AF/BERR/ARLO，STOP请求不应直接冒充总线已释放。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-062 | 中间TXE与结尾BTF

标签：I2C, TXE, BTF, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么主机发送多个字节时，通常使用 TXE 推进中间数据，而使用 BTF 判断最后一个字节的完成条件？

### 参考答案

**核心结论：** TXE允许提前准备下一字节，BTF用于确认正常主发送末字节的DR与移位器都完成。

**必要解释：** 仅TXE结束可能在最后字节仍在线上时就收尾；同时处理NACK等错误，不能等待一个因错误永不出现的BTF。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-063 | 7位地址与SPL编码

标签：I2C, 地址编码, SPL
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请解释 7 位设备地址与地址字节的区别，并说明使用 I2C_Send7bitAddress() 时为什么必须核对当前标准外设库的参数约定。

### 参考答案

**核心结论：** 7位标识不含方向，线上字节为其左移后加R/W；本机SPL接收左移参数，再处理方向位。

**必要解释：** 必须核对当前库版本；重复左移或把已经含方向的原始字节当7位地址都会寻址错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-064 | 接收控制四要素

标签：I2C, ACK, POS, BTF
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请解释 ACK、NACK、POS 和 BTF 在主机接收过程中的作用。

### 参考答案

**核心结论：** ACK控制是否继续应答，NACK结束本次接收，POS影响ACK作用位置，BTF反映接收流水线占用状态。

**必要解释：** F1必须按长度在清ADDR前后安排这些控制；它们不替代RXNE取数和最终STOP/重复START。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-065 | 不同长度为何不同流程

标签：I2C, 接收时序
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么单字节、双字节和多字节接收不能简单地使用完全相同的流程？

### 参考答案

**核心结论：** 1字节需清ADDR前关ACK并及时STOP；2字节需预置POS/ACK、清ADDR后关ACK、BTF后STOP读两字节；更多字节在余3时专门收尾。

**必要解释：** 硬件流水线使事后关ACK可能太迟，按AN2824关键区并结合ES0340修订保护，中断屏蔽后应恢复原状态。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-068 | CheckEvent读取副作用

标签：I2C, SPL, ADDR, 函数分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为什么 I2C_CheckEvent() 的实现细节可能影响硬件状态？请结合 ADDR 的清除规则说明。

### 参考答案

**核心结论：** 本机实现先读SR1再SR2，再拼接和掩码判断事件；该读取顺序可能清ADDR。

**必要解释：** 接收时若在ACK/POS准备之前使用事件检查，可能让硬件提前推进；应选符合阶段的状态读取策略。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-069 | 五类错误和超时区分

标签：I2C, 错误分类
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请区分 AF、ARLO、BERR、OVR 和软件超时，并分别说明排查时应关注的方向。

### 参考答案

**核心结论：** AF是无应答，ARLO是仲裁丢失，BERR是总线错误；OVR主要涉及从机收发服务不及时，软件超时是等待截止。

**必要解释：** 分别查地址/器件忙、电气/多主、异常START/STOP、DR服务延迟和卡住阶段；不能统一归因或自动无条件重发。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-070 | 为什么不能随意清SR1

标签：I2C, 寄存器, 错误恢复
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请解释为什么不能通过随意清零 SR1 或强制修改状态寄存器来修复 I2C 错误。

### 参考答案

**核心结论：** SR1各位有不同清除规则，整寄存器写0会误清错误或无法完成SB/ADDR等所需序列。

**必要解释：** 先保留诊断并按手册清目标标志，恢复状态机/线路及应用消息，再决定是否重试。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-071 | BUSY长期不释放的定位

标签：I2C, BUSY, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

当 BUSY 长时间为 1 时，请列出至少五种需要检查的情况，并说明如何逐步定位问题。

### 参考答案

**核心结论：** 检查合法其他主机占用、时钟延展、SDA/SCL被拉低、上拉和电平、上一事务STOP、外设PE/映射及时钟、适用内部BUSY勘误。

**必要解释：** 先记录线电平与状态而非直接复位，结合波形区分物理卡线和内部锁住，按具体原因恢复。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-072 | 三种恢复手段边界

标签：I2C, 总线恢复, 概念辨析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请说明软件复位、重新初始化和物理总线恢复之间的区别。

### 参考答案

**核心结论：** 软件复位重置外设逻辑，重新初始化恢复配置，物理总线恢复尝试让目标释放线路并回到合法事务边界。

**必要解释：** 三者不能互相保证；被短路/掉电器件拉低或勘误锁住需相应措施，不能统一宣称复位必恢复。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-073 | 主发送操作排序

标签：I2C, 发送时序, 排序题
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

请按照正确的先后顺序，排列一次典型主机发送事务的操作：

- 等待 SB。
- 检查总线状态。
- 发送设备地址。
- 请求 START。
- 等待地址阶段完成。
- 按规定清除 ADDR。
- 发送数据。
- 等待数据寄存器可继续写入。
- 检查最后一个字节的传输完成条件。
- 请求 STOP。

请写出完整序列，并解释每一步的目的。

### 参考答案

**核心结论：** 检查总线可用、请求START、等SB、发设备地址、等地址完成、清ADDR、等TXE并写各数据、末字节等BTF、请求STOP并确认按方案结束。

**必要解释：** 各阶段都检查错误和超时；ARLO时避免破坏获胜主机，不能靠一串无条件等待代表成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-074 | 跳过ADDR的错误状态机

标签：I2C, ADDR, 故障分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某驱动在发送设备地址后立即向 DR 写入数据，没有等待 ADDR，也没有执行规定的 ADDR 清除操作。请分析该程序的问题，并说明应如何修改状态机。

### 参考答案

**核心结论：** 未确认地址成功与清ADDR就写数据，可能在地址失败或外设仍停留地址事件时错误推进。

**必要解释：** 应有地址等待分支，成功后按规定清ADDR再发送；AF、ARLO、BERR或超时返回不同结果，不能补一个固定延时。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-075 | 三字节发送直接返回问题

标签：I2C, TXE, BTF, 故障分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某驱动发送三个字节时，每写入一个字节都只等待 TXE，最后立即返回。请分析这种写法可能存在的问题，并说明最后一个字节为什么需要单独考虑。

### 参考答案

**核心结论：** 每字节等TXE可推进DR，但最后TXE并不证明末字节和应答完成，立即返回可能过早。

**必要解释：** 末尾等正常BTF并检查错误后STOP及必要结束确认；不得因调用返回就改变CS类外部状态或关闭外设。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-076 | ADDR置位但事件失败

标签：I2C, 事件, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某程序等待 ADDR 时一直无法通过事件检查，但调试器显示 SR1.ADDR 已经置位。请分析可能原因，重点考虑事件组合条件、MSL、BUSY、TRA 及寄存器读取顺序。

### 参考答案

**核心结论：** 事件宏可能还要求MSL、BUSY、TRA与方向匹配，单独ADDR=1不足以证明完整组合。

**必要解释：** 检查实际角色/方向和宏值，确认调试器或先前SR1/SR2读取是否已清ADDR；减少带副作用探针并对照波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-077 | 单字节ACK保持开启

标签：I2C, 接收时序, 故障分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某驱动接收一个字节时，在地址阶段完成后仍然保持 ACK=1。请分析为什么这可能导致最后一个字节的接收时序不符合要求。

### 参考答案

**核心结论：** 若清ADDR后继续ACK，硬件可能对本应结束的字节应答并接着接收，使收尾不符要求。

**必要解释：** POS按单字节准备，ADDR时先关ACK，再在受保护关键区清ADDR并及时STOP，等RXNE读DR，安全结束后恢复配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-078 | 两字节缺少POS与BTF

标签：I2C, POS, 接收时序, 故障分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某驱动接收两个字节时，没有提前配置 POS，也没有正确处理 BTF。请分析可能产生的问题，并概述正确的处理思路。

### 参考答案

**核心结论：** 会使最后应答控制位置或收尾时间不对，可能多收、丢数据或总线不释放。

**必要解释：** 按AN2824先置POS/ACK，ADDR后在关键区清ADDR及ACK，等BTF，再在保护序列中STOP并读末两字节，完成后恢复POS/ACK。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-079 | 余三字节时关闭ACK过晚

标签：I2C, BTF, 接收时序, 故障分析
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

某驱动在接收最后三个字节时，直到 RXNE 置位后才关闭 ACK。请分析为什么这种操作可能过晚，并说明最后三个字节的收尾阶段需要关注哪些硬件状态。

### 参考答案

**核心结论：** RXNE只是DR有值，另一个字节可能已在移位器，随意等RXNE再关ACK可能错过末字节应答控制。

**必要解释：** 余3时等BTF、关ACK、读倒数第3，再等BTF、请求STOP并读取末两字节；保护关键区并验证波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-081 | 主发送函数设计

标签：I2C, 状态机, 驱动设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

设计一个 STM32F103 I2C 主机发送函数。

要求：

1. 检查 BUSY。
2. 产生 START。
3. 等待 SB。
4. 发送从机地址。
5. 等待 ADDR。
6. 按正确顺序处理 ADDR。
7. 发送指定长度的数据。
8. 正确处理 TXE 和最后一个字节的 BTF。
9. 产生 STOP。
10. 为所有关键等待阶段增加软件超时。
11. 区分地址无应答、数据无应答、总线错误和超时。
12. 说明每一步涉及的寄存器或状态标志。

### 参考答案

**核心结论：** 设计空闲检查、START/SB、地址/ADDR、清ADDR、逐字节TXE、末尾BTF、STOP结束等阶段，输入地址/长度/指针先校验。

**必要解释：** 每阶段同时检查AF/BERR/ARLO和截止时间，按阶段区分地址/数据NACK；0长度语义应明确，ARLO不强行STOP，退出保留错误和已传长度供上层决策。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-082 | 单字节接收函数设计

标签：I2C, 接收时序, 驱动设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

设计一个 STM32F103 I2C 单字节接收函数。

要求：

1. 正确发送读方向地址。
2. 正确处理 ADDR。
3. 正确控制 ACK。
4. 正确安排 STOP。
5. 等待 RXNE 并读取 DR。
6. 恢复必要的外设配置。
7. 为关键等待阶段增加超时。
8. 说明每一步的硬件时序依据。

### 参考答案

**核心结论：** 读地址应答后、清ADDR前置ACK=0并确认POS适合1字节；受保护地清ADDR并请求STOP，等RXNE读DR，确认结束后恢复ACK/POS。

**必要解释：** 所有等待有界并检查错误；关键区只覆盖AN2824/勘误要求的短序列，恢复原中断状态；失败不得宣称已取得有效字节或忽略卡线。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-083 | 任意长度接收函数设计

标签：I2C, 接收时序, 驱动设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

设计一个支持任意长度数据读取的 I2C 底层函数。

要求：

1. 能处理长度为 1、2 和大于等于 3 的情况。
2. 正确处理 POS、ACK、BTF、RXNE 和 STOP。
3. 考虑最后三个字节的特殊收尾时序。
4. 对每个关键阶段增加超时和错误检查。
5. 明确区分底层 I2C 事务与器件内部寄存器协议。
6. 参考 RM0008 和 AN2824 验证实现。
7. 检查适用的 ES0340 勘误。
8. 使用逻辑分析仪验证实际波形。

### 参考答案

**核心结论：** 先校验长度/地址/缓冲；长度1走单字节分支，2走POS/ACK与BTF双字节分支，至少3先正常收、余3时BTF关ACK后专门收尾。

**必要解释：** 给每状态超时/错误与退出后ACK/POS恢复，定义0长度、重复START和部分数据语义；参考AN2824/ES0340核对关键区，再以1/2/3/更长、NACK和卡线抓波形。本文未交付已验证板上驱动。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-084 | 读取8位内部地址的组合函数

标签：I2C, 器件协议, 驱动设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

设计一个读取器件内部 8 位寄存器的函数。

假设器件的 7 位地址为 0x50，内部寄存器地址为 0x10。

要求：

1. 使用写方向传输内部寄存器地址。
2. 正确产生重复 START。
3. 使用读方向重新寻址。
4. 根据读取长度正确处理 ACK/NACK。
5. 在事务结束时正确产生 STOP。
6. 处理地址无应答、数据阶段错误和软件超时。
7. 说明哪些内容属于 I2C 硬件控制，哪些内容属于器件协议。

### 参考答案

**核心结论：** 先发写方向0xA0和内部地址0x10，再重复START发读方向0xA1，按读取长度接收，最后NACK/STOP。

**必要解释：** 7位0x50与内部8位地址为明确假设，不能因0x50就认定是24LC256；总线状态机管时序/错误，器件层管地址宽度与递增。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-085 | 统一错误返回设计

标签：I2C, 错误处理, 接口设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

为 I2C 驱动设计统一的错误返回机制。

要求至少区分：

- 事务成功。
- 地址无应答。
- 数据无应答。
- 总线错误。
- 仲裁丢失。
- 软件超时。
- 总线无法恢复。

请说明每种错误的检测位置、清除或恢复策略，以及调用层如何根据错误码处理。

### 参考答案

**核心结论：** 返回成功、地址NACK、数据NACK、BERR、ARLO、软件超时和恢复失败，并携带阶段与已传长度等必要信息。

**必要解释：** 按状态机位置区分AF来源，清指定错误并按主机角色安全收尾；上层对读可有界重试，对已可能生效的写需先确认副作用，不能统一无限重试。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-086 | 开漏总线恢复设计

标签：I2C, 总线恢复, 驱动设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

设计 I2C 总线恢复流程。

假设 SDA 被从机持续拉低，而 SCL 可以被控制。

要求：

1. 说明进入恢复流程前必须确认什么。
2. 说明如何安全地切换 GPIO 模式。
3. 说明如何释放和检查 SDA、SCL。
4. 说明何时可以尝试 SCL 恢复脉冲。
5. 说明何时可以尝试产生 STOP。
6. 说明何时重新初始化 I2C。
7. 说明为什么该方案不能保证恢复所有故障。
8. 说明 STM32F103 相关勘误在设计中的作用。

### 参考答案

**核心结论：** 先确认独占恢复权限、不是其他主机合法事务；停外设、以开漏释放线，确认SCL能被拉高，按规范最多尝试9个SCL脉冲并持续检查SDA。

**必要解释：** SDA释放且SCL可高时构造合法STOP，再按适用ES0340/时钟配置重新初始化并验证空闲；若SCL被拉低、短路、掉电或器件状态不可恢复，应返回失败，禁止推挽强高和无界脉冲。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-087 | GenerateSTART源码职责

标签：I2C, SPL, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

打开工程中的 stm32f10x_i2c.c，分析 I2C_GenerateSTART()。

请说明：

1. 它修改了哪个寄存器和位？
2. 调用后是否意味着 START 已经在物理总线上完成？
3. 调用者应等待什么状态？
4. 如果等待超时，应如何处理？

### 参考答案

**核心结论：** 本机SPL V3.5.0修改CR1.START，ENABLE时置位，DISABLE时清位；调用只提出控制请求。

**必要解释：** 需按状态等待SB并同时查错误/超时；失败后按当前角色和线路状态恢复，函数不保证物理START已经完成。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-088 | Send7bitAddress源码职责

标签：I2C, SPL, 地址编码, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析 I2C_Send7bitAddress()。

请说明：

1. 地址参数的编码约定是什么？
2. 读写方向如何指定？
3. 函数是否负责等待地址应答？
4. 如果调用者重复左移地址，会产生什么问题？

### 参考答案

**核心结论：** 本机实现接收已左移的地址，方向为读则置最低位、为写则清最低位，然后写DR。

**必要解释：** 函数不等待地址ACK；对已编码参数重复左移会改变目标地址并可能截断，接口须统一只编码一次。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-089 | CheckEvent事件拼接

标签：I2C, SPL, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析 I2C_CheckEvent()。

请说明：

1. 它读取了哪些状态寄存器？
2. 如何形成事件判断条件？
3. 为什么读取 SR2 可能影响 ADDR？
4. 为什么必须核对事件宏定义，而不能只看宏名称？

### 参考答案

**核心结论：** 本机实现读SR1，再读SR2左移16位，与固定有效位掩码组合，再检查目标事件掩码是否全部满足。

**必要解释：** SR1后SR2可能清ADDR；宏要求的角色/方向位也参与，名称相似不等于条件相同，返回SUCCESS仍不替代独立错误检查。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-090 | ReceiveData读取职责

标签：I2C, SPL, RXNE, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析 I2C_ReceiveData()。

请说明：

1. 它从哪个寄存器读取数据？
2. 读取 DR 对 RXNE 有什么影响？
3. 为什么不能认为调用该函数就自动完成了正确的 ACK/NACK 和 STOP 时序？
4. 哪些接收时序应由调用者负责？

### 参考答案

**核心结论：** 函数从DR读取低8位，正常消费后影响RXNE；它不自动完成ACK/NACK和STOP控制。

**必要解释：** 接收长度分支、ADDR清除、POS/ACK安排与末尾BTF/STOP由调用者负责，盲读会破坏数据和时序。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-091 | 两种清除接口的边界

标签：I2C, SPL, 错误标志, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析 I2C_ClearFlag() 与 I2C_ClearITPendingBit() 的实现。

请说明：

1. 两个函数的职责是否完全相同？
2. 哪些标志可以直接通过规定的寄存器写操作清除？
3. 哪些标志需要特定的读取顺序或其他硬件动作？
4. 为什么必须根据参考手册确认，而不能统一套用一种清除方式？

### 参考答案

**核心结论：** 两接口分别接受FLAG与IT编码，本机实现都掩码后写SR1清指定可写清错误；不能因此任意互换参数。

**必要解释：** AF/ARLO/BERR等按允许位写0清，ADDR需SR1后SR2，SB需SR1后写DR，RXNE/发送TXE等依DR动作；必须查手册和断言允许集，不能整写0替代序列。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-092 | SoftwareResetCmd源码职责

标签：I2C, SPL, 总线恢复, 源码分析
难度：进阶

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

分析 I2C_SoftwareResetCmd()。

请说明：

1. 它控制哪个寄存器位？
2. 软件复位可能解决哪些外设状态问题？
3. 为什么软件复位不等于清除物理总线上的低电平？
4. 复位后需要重新检查哪些配置和状态？

### 参考答案

**核心结论：** 函数控制CR1.SWRST，可复位某些外设逻辑状态，但不保证外部拉低线路释放。

**必要解释：** 复位后按手册检查PE、时钟参数、ACK/POS、地址/模式及线路空闲；内部BUSY勘误可能另需特定流程，不能把软件复位当万能总线恢复。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-093 | SB始终不置位排查

标签：I2C, SB, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

程序运行后一直等待 SB，但 SB 始终没有置位。请按照从硬件到软件的顺序列出排查步骤。

### 参考答案

**核心结论：** 先查电源共地、上拉与SDA/SCL电平及其他主机，再查正确引脚/AFIO、GPIO与I2C时钟、PE和START请求、BUSY及相关勘误。

**必要解释：** 抓实际START波形，排除读错实例或状态被探针改变；等待有界，保留失败阶段而非不断复位覆盖现场。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-094 | 地址后AF的分类定位

标签：I2C, AF, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

发送地址后检测到 AF。请说明应如何区分地址错误、从机未上电、线路问题和地址编码错误。

### 参考答案

**核心结论：** 确认线上地址字节与分析仪显示约定，核对7位地址/移位和方向、地址引脚，再测供电、电平、上拉和时钟及器件是否处于忙/复位。

**必要解释：** 用波形确认NACK发生在地址阶段，不能仅看编译成功；按主机当前状态安全收尾并返回地址NACK。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-095 | 能发不能正确读完

标签：I2C, 接收时序, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 可以发送数据，但读取数据时始终无法正确结束。请重点检查 ACK、POS、BTF、RXNE 和 STOP 的使用顺序。

### 参考答案

**核心结论：** 按1/2/至少3字节分支检查ACK/POS、ADDR清除、BTF与RXNE取数及STOP相对时机。

**必要解释：** 发送成功不验证接收收尾；检查关键区、中断延迟和勘误，并以各长度波形确认最后NACK与STOP。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-096 | 软件事件与波形不符

标签：I2C, 调试副作用, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

调试器显示 I2C 发送流程中的事件已经满足，但逻辑分析仪没有观察到预期波形。请说明为什么需要同时检查时钟使能、PE、引脚配置、AFIO、线路电平和实际外设状态。

### 参考答案

**核心结论：** 检查实际运行实例、RCC/PE、引脚模式/AFIO、线电平以及事件组合和读取副作用，确认分析仪探头位置/采样门限。

**必要解释：** 寄存器快照可能是历史或不同阶段，不能仅因事件宏返回就断言目标引脚已完成正确事务；需时间对应的软件记录与波形。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## i2c2-097 | 第二次通信BUSY卡住

标签：I2C, BUSY, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

I2C 第一次通信正常，第二次通信时 BUSY 一直为 1。请说明应如何检查第一次事务的结束流程、STOP 生成情况、线路电平和芯片勘误。

### 参考答案

**核心结论：** 先复核首事务最后应答、BTF与STOP是否实际完成，ACK/POS是否复位，再测线路和目标延展/掉电情况及芯片勘误。

**必要解释：** 正常首轮不证明退出状态可复用；记录两次之间状态并区分物理卡线与内部BUSY，不能统一加延时掩盖。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-098 | 两字节读取偶发错误

标签：I2C, POS, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

驱动能够读取单字节，却在读取两个字节时偶发错误。请说明为什么这可能与通用接收流程、POS、ACK、BTF 和最后一个字节的时序有关。

### 参考答案

**核心结论：** 重点检查是否错误复用单字节/普通多字节流程，以及POS预设、清ADDR后关ACK、BTF和STOP/读取关键区。

**必要解释：** 中断或断点会改变软件窗口，按AN2824与修订适用勘误验证；单字节成功不能代签双字节。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-099 | 长期偶发卡死排查

标签：I2C, 超时, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

驱动在实验室短时间运行正常，但长时间运行偶发卡死。请说明如何使用超时、错误分类、调试日志和逻辑分析仪定位问题，并解释为什么不能仅通过增加延时解决。

### 参考答案

**核心结论：** 为各等待设置基于可靠时间源的截止，记录阶段、错误、计数与必要寄存器摘要，用触发波形对照卡住前后的总线。

**必要解释：** 检查溢出回绕、抢占、复用退出状态、供电与干扰、器件忙和勘误；增加延时可能只改变概率，不能取代根因和连续故障注入验证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 接收关键区与恢复方案需按实物修订核对ES0340，并验证实际波形；本文为参考设计。

## i2c2-100 | 完整I2C驱动审查方法

标签：I2C, 代码审查, 验证设计
难度：综合

### 题目

平台为STM32F103RCT6、SPL V3.5.0，普通I2C 7位寻址、轮询主机模式；接收时序与勘误限定F1。

阅读一份已有的 STM32F103 I2C 驱动源码，从初始化到读写完成进行完整审查。请至少检查：

1. RCC 时钟配置。
2. GPIO 与 AFIO 配置。
3. CR2.FREQ、CCR 和 TRISE。
4. START、ADDR、TXE、BTF、RXNE 和 STOP 的处理。
5. 单字节、双字节和多字节接收。
6. 7 位地址的编码方式。
7. 错误标志的检测与清除。
8. 软件超时。
9. 总线恢复。
10. 适用的官方勘误。
11. 实际波形与源码时序的一致性。

请列出发现的问题、对应的依据、修改方案和验证方法。

### 参考答案

**核心结论：** 未提供具体待审驱动，不能虚构已发现缺陷；应从RCC/GPIO/AFIO、时钟参数、地址编码、收发各长度、状态清除、超时与恢复逐路径核对。

**必要解释：** 每个发现记录位置、触发条件、手册/源码依据、最小修复和验证方法；按芯片修订核对ES0340，并比对实际ACK/STOP等波形。本文给审查准则，不代表任何驱动已完成硬件验收。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 轮询接收依AN2824；勘误适用性待核对实物修订号。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST AN2824 Rev4 §1.2.1：轮询接收1/2/N字节](https://www.st.com/content/ccc/resource/technical/document/application_note/5d/ae/a3/6f/08/69/4e/9b/CD00209826.pdf/files/CD00209826.pdf/jcr:content/translations/en.CD00209826.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 未提供要审查的具体驱动工程，本题给出审查方法，不能声称已经发现或修复某份驱动缺陷。
