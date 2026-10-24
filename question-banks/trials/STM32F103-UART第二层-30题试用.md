---
schema_version: 1
topic_id: m5-trial-uart-level-2
topic_title: STM32F1 UART 与寄存器
---

## uart2-019 | 发送缓冲与线上的完成状态

标签：UART, TXE, TC, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TXE=1 就意味着最后一个停止位已经从 TX 引脚发送完毕。

### 参考答案

**核心结论：** 错误。TXE只表示发送DR为空，移位发送可能尚未结束。

**必要解释：** 需确认本批数据最后停止位发完时检查TC，不能以TXE替代。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-020 | TC与最后一帧

标签：UART, TC, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TC=1 时，表示发送数据寄存器与移位寄存器均为空，最后一帧已经发送完成。

### 参考答案

**核心结论：** 正确。该描述是普通USART发送中TC的含义。

**必要解释：** 先清理复位/历史状态并关联本次发送；不能仅凭初始TC=1断言某个计划字节已实际发出。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-021 | RXNE与线路电平

标签：UART, RXNE, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

RXNE=1 表示 RX 引脚当前一定处于低电平。

### 参考答案

**核心结论：** 错误。RXNE表示接收DR非空，不能推出RX此刻一定低。

**必要解释：** 帧结束后线路可已空闲为高，而数据仍未读取。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-022 | SendData是否等待

标签：UART, SPL, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

`USART_SendData()` 的作用是将待发送数据写入数据寄存器，它本身不负责等待 TXE。

### 参考答案

**核心结论：** 正确。SPL V3.5.0的USART_SendData写DR，不自行等待TXE。

**必要解释：** 调用者应保证发送空间和访问时序，不能在未就绪时连续覆盖待发数据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-023 | ReceiveData是否等待

标签：UART, SPL, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

`USART_ReceiveData()` 本身会等待 RXNE 置位，因此可以不检查接收状态就安全调用。

### 参考答案

**核心结论：** 错误。USART_ReceiveData读取DR，不负责等待RXNE。

**必要解释：** 调用者先确认数据就绪，并协调ISR、DMA与轮询，避免重复消费。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-024 | ORE清除顺序判断

标签：UART, ORE, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

在 STM32F103 中，清除 ORE 时，按照手册规定执行读取 SR、再读取 DR 的操作。

### 参考答案

**核心结论：** 正确。F1按读取SR后再读取DR清ORE。

**必要解释：** 同时保存必要错误信息并恢复应用消息边界；清除动作不补回丢失数据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-025 | volatile与复合操作

标签：C语言, volatile, 并发分析, 判断题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

`volatile` 能够保证寄存器读—改—写操作具有原子性。

### 参考答案

**核心结论：** 错误。volatile不保证读、修改、写三个步骤整体原子。

**必要解释：** 本机GCC样例也展示多个指令的读改写；即使单次访问原子，仍可能被ISR或其他执行者插入。[GCC官方说明](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)限定volatile而不提供互斥。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-026 | 中断链路完整性

标签：UART, 中断, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

使能 USART 的 RXNE 中断源后，就不需要配置 NVIC，也不需要编写中断服务程序。

### 参考答案

**核心结论：** 错误。外设源使能后仍需NVIC和正确ISR/向量。

**必要解释：** 还应核对CPU屏蔽位、优先级、UE/RE以及RXNE是否真的产生。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-027 | DMA控制器独立配置

标签：UART, DMA, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

使能 USART 的接收 DMA 请求后，仍然需要正确配置 DMA 控制器。

### 参考答案

**核心结论：** 正确。USART只开放请求，DMA通道仍需映射、地址、方向、长度和使能。

**必要解释：** 若接收缓冲不再有效或计数耗尽，USART请求本身不能保证数据被正确保存。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-028 | USART寄存器地址表

标签：UART, 寄存器, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

寄存器地址计算

已知 USART1 基地址为 `0x40013800`，请写出以下寄存器的绝对地址：

1. SR
2. DR
3. BRR
4. CR1
5. CR2
6. CR3

同时说明为什么寄存器偏移地址不能直接当作绝对地址使用。

### 参考答案

**核心结论：** SR=0x40013800，DR=0x40013804，BRR=0x40013808，CR1=0x4001380C，CR2=0x40013810，CR3=0x40013814。

**必要解释：** 六者分别加偏移0、4、8、0xC、0x10、0x14；仅拿偏移当绝对地址会访问错误位置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-029 | BRR完整推导

标签：UART, BRR, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

BRR 波特率计算

已知：

- USART1 输入时钟：72 MHz
- 目标波特率：115200 baud
- 过采样倍数：16

请计算：

1. USARTDIV
2. 整数部分
3. 小数部分
4. BRR 的最终值

写出计算过程。

### 参考答案

**核心结论：** USARTDIV=39.0625，整数部分39即0x27，小数编码1，BRR为0x0271。

**必要解释：** BRR由整数左移4后加小数编码组成；使用实际PCLK2，其他频率/波特率需重新计算舍入和误差。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-030 | CR1数值解析

标签：UART, CR1, 位操作
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

CR1 解析

已知：

`CR1 = 0x200C`

请分析：

1. UE、TE、RE 分别是什么状态？
2. M、PCE、PS 是什么状态？
3. 是否启用了 RXNE 中断？
4. 该配置是否符合普通 8N1 收发的 CR1 要求？

### 参考答案

**核心结论：** 0x200C使UE、TE、RE为1；M、PCE、PS和RXNEIE为0。

**必要解释：** 它满足普通8N1收发的CR1部分，STOP仍取决于CR2，流控/特殊模式取决于CR3，时钟和GPIO另验。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-031 | STOP字段与相邻位

标签：UART, CR2, 位字段
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

CR2 停止位解析

CR2 的 STOP 字段位于 bit 13:12。

请回答：

1. STOP=`00` 表示什么？
2. STOP=`01` 表示什么？
3. STOP=`10` 表示什么？
4. 如果只修改 STOP 字段，为什么不能直接用新字段值覆盖整个 CR2？

### 参考答案

**核心结论：** STOP=00为1停止位，01为0.5停止位，10为2停止位；11对应1.5停止位。

**必要解释：** 修改时只清bit13:12再写合法编码，并按工作模式核对支持性；整写CR2会改变其他控制位。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-032 | SR十六进制解析

标签：UART, SR, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

SR 状态标志解析

已知：

`SR = 0x00A0`

请判断：

1. TXE 是否置位？
2. TC 是否置位？
3. RXNE 是否置位？

写出对应的掩码判断过程。

### 参考答案

**核心结论：** 0xA0与0x80非零所以TXE=1，与0x40为0所以TC=0，与0x20非零所以RXNE=1。

**必要解释：** 每个标志按独立掩码判断；不能把整个寄存器非零当作某个标志为1。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-033 | 七个SPL函数职责

标签：UART, SPL, 函数辨析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

库函数底层原理

请分别解释以下函数的作用，以及它们是否会自动等待状态标志：

1. `USART_Init()`
2. `USART_Cmd()`
3. `USART_SendData()`
4. `USART_ReceiveData()`
5. `USART_GetFlagStatus()`
6. `USART_ITConfig()`
7. `USART_DMACmd()`

### 参考答案

**核心结论：** Init配置参数，Cmd控制UE，SendData写DR，ReceiveData读DR，GetFlagStatus读状态，ITConfig配置中断源，DMACmd配置DMA请求。

**必要解释：** 这些接口不自动替调用者完成等待、NVIC/DMA初始化或错误恢复；读取DR和状态序列还可能有硬件副作用。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-034 | USART标志清除规则

标签：UART, 错误标志, 寄存器
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

状态标志清除

请说明以下标志的含义与清除方式：

1. TXE
2. TC
3. RXNE
4. IDLE
5. ORE
6. FE
7. NE
8. CTS
9. LBD

特别说明：为什么不能把所有标志都统一交给 `USART_ClearFlag()` 处理？

### 参考答案

**核心结论：** TXE由写DR清；TC可写0或按SR读后DR写清；RXNE可读DR清或按允许方式写0；IDLE/ORE/FE/NE按SR读后DR读清；CTS和LBD可写0清。

**必要解释：** CTS仅适用支持该硬件的实例。ClearFlag只接受它实现允许的标志，不能统一替代各序列；读取接收DR会消费数据，要保存必要值并协调接收者。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-035 | 从依赖关系初始化USART

标签：UART, 初始化, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

初始化流程

请从硬件依赖关系出发，写出 USART1 默认映射下的主要初始化步骤，并说明 RCC、GPIO、BRR、CR1、CR2、CR3 分别负责什么。

### 参考答案

**核心结论：** 先使能RCC并配置GPIO/AFIO，设置BRR、CR1帧字长校验方向、CR2停止位、CR3流控/DMA等，最后按方案使能。

**必要解释：** 若用中断/DMA，先准备ISR/NVIC或通道和缓存再开放请求；普通轮询不强加这些功能，实际PCLK2和引脚须核对。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-036 | 字节发送的硬件过程

标签：UART, TXE, TC, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

发送时序

请按照硬件执行顺序，描述软件发送一个字节时，从写入 DR 到 TC 置位的主要过程。

解释 TXE 为什么可能早于 TC 置位。

### 参考答案

**核心结论：** DR数据进入发送移位寄存器后DR腾空并置TXE；移位器依次发送帧，最后停止位完成且DR空才置TC。

**必要解释：** 因此可在前帧线上发送时准备下一份数据；需要关闭发送或切换方向时再确认本次TC。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-037 | 字节接收的硬件过程

标签：UART, RXNE, ORE, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

接收时序

请描述一个字节从 RX 引脚进入 USART，到软件读取 DR 的主要过程。

说明 RXNE 的产生条件、读取 DR 的作用，以及 ORE 可能如何产生。

### 参考答案

**核心结论：** RX信号经采样形成一帧，数据转入DR后置RXNE；软件读DR取数并清RXNE。

**必要解释：** DR旧值未取走又有新帧到来可能ORE；需及时服务和错误处理，不认为软件数组会自动承接硬件数据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-038 | 应用SPL与寄存器链路

标签：UART, SPL, 调用链
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

寄存器与库函数

请解释以下调用链的关系：

应用程序 → SPL 函数 → 寄存器访问 → USART 硬件。

为什么只记住库函数名称，不足以满足第二层的学习要求？

### 参考答案

**核心结论：** 应用调用SPL，库按约定访问寄存器，外设状态机再驱动或采样引脚。

**必要解释：** 需要理解参数编码、寄存器副作用和等待条件，才能处理时钟、时序、错误与重试；记函数名不能替代这些关系。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-039 | CR1标志掩码计算

标签：UART, 位掩码, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

CR1 掩码计算

请计算以下掩码的十六进制值：

1. UE：bit 13
2. TE：bit 3
3. RE：bit 2
4. RXNEIE：bit 5
5. TXEIE：bit 7
6. TCIE：bit 6

然后回答：如果只需要启用 UE、TE、RE，应该将哪些位设置为 1？

### 参考答案

**核心结论：** UE=0x2000，TE=0x0008，RE=0x0004，RXNEIE=0x0020，TXEIE=0x0080，TCIE=0x0040；UE/TE/RE合计0x200C。

**必要解释：** 本题列的是单个位的掩码；用整值覆盖仍须保证其他控制位应为0。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-040 | 两位字段更新与并发

标签：C语言, 位字段, 并发分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

寄存器读—改—写

假设某寄存器中的目标字段位于 bit 5:4，现在需要将该字段设置为二进制 `10`。

请说明：

1. 目标字段掩码是多少？
2. 应先清除哪些位？
3. 为什么不能简单地对寄存器执行 `REG |= VALUE`？
4. 普通读—改—写操作有哪些潜在风险？

### 参考答案

**核心结论：** 目标掩码为0x30，先清bit5:4，再写入0x20表示二进制10。

**必要解释：** 直接按位或无法清掉旧1；普通读改写还可能丢失并发更新或触发寄存器副作用，应结合互斥/临界区和手册选择访问方法。本题已有身份保留在原UART专题，通用C题用另一完整示例说明原理。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-041 | 9600对应BRR

标签：UART, BRR, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

波特率变化

假设 USART1 输入时钟仍为 72 MHz，但目标波特率改为 9600 baud。

请计算：

1. USARTDIV
2. BRR 的整数部分
3. BRR 的小数部分
4. 最终 BRR 值

说明与 115200 baud 相比，BRR 为什么发生变化。

### 参考答案

**核心结论：** USARTDIV=72000000/(16×9600)=468.75；整数468=0x1D4，小数编码12=0xC，BRR=0x1D4C。

**必要解释：** 同输入时钟下降低波特率需要更大分频，不能沿用115200的0x0271。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-042 | 普通异步寄存器目标

标签：UART, 初始化, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

初始化目标值

在以下假设下，写出 BRR、CR1、CR2、CR3 的目标值：

- USART1
- PCLK2 = 72 MHz
- 波特率 115200
- 8 个有效数据位
- 无奇偶校验
- 1 个停止位
- 发送和接收都启用
- 不使用 DMA、硬件流控或其他特殊模式

同时说明这些寄存器值为什么不能代替 RCC 和 GPIO 配置。

### 参考答案

**核心结论：** 按题设BRR=0x0271，CR1=0x200C，CR2=0，CR3=0。

**必要解释：** 只在明确其余特殊功能都禁用的初始化目标下成立；RCC门控、实际PCLK2、GPIO和映射另行配置，不能盲写正在工作的外设。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-043 | 寄存器发送无输出排查

标签：UART, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TX 无输出

USART1 初始化后，程序已经执行发送函数，但电脑收不到任何字符。

请从以下层次分析可能原因：

1. RCC
2. GPIO
3. AFIO 映射
4. USART 控制寄存器
5. BRR 与帧格式
6. 物理连接

### 参考答案

**核心结论：** 分层检查USART1/GPIO/AFIO时钟、PA9模式和重映射、UE/TE、BRR与帧格式、TX/RX交叉及电平共地。

**必要解释：** 确认代码实际写入正确实例DR，再对照引脚波形与电脑接收，区分芯片内配置和外部链路故障。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-044 | TXE正常但TC异常

标签：UART, TXE, TC, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TXE 正常但 TC 不置位

程序发现 TXE 已置位，但一直无法观察到预期的 TC 状态。

请说明：

1. TXE 置位能够证明什么？
2. 为什么它不能证明最后一帧发送完成？
3. 应重点检查哪些因素？

### 参考答案

**核心结论：** TXE只证明DR空，不能证明移位器已结束；检查持续供数、UE/TE、时钟、帧模式及TC是否被其他代码清除。

**必要解释：** 结合一次有界发送和波形观察，不把电脑接收状态当作TC来源，也不假定任意一次TXE后立即出现TC。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-045 | ORE与数据流恢复

标签：UART, ORE, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

接收出现 ORE

USART1 连续接收数据时出现 ORE。

请分析：

1. ORE 的产生条件。
2. 为什么扩大软件数组容量不一定解决问题？
3. 应如何处理硬件标志与软件缓冲区？
4. 清除错误标志后，是否能够恢复已经丢失的数据？

### 参考答案

**核心结论：** 及时服务DR，按先SR后DR清ORE；区分硬件丢帧与软件数组溢出，并使当前消息失效或按协议恢复。

**必要解释：** 排查中断屏蔽、阻塞路径、消费者速度与流控；扩数组不改善DR服务延迟，已丢失数据需重发才能恢复。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-046 | RXNE中断未进入

标签：UART, 中断, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

中断没有进入

程序已经执行：

`USART_ITConfig(USART1, USART_IT_RXNE, ENABLE)`

但接收字符时没有进入中断服务程序。

请列出至少五项需要检查的内容。

### 参考答案

**核心结论：** 检查UE/RE、RXNE是否产生、RXNEIE、NVIC通道与优先级、CPU屏蔽位、向量表和ISR符号及实际引脚参数。

**必要解释：** 不要仅重复ITConfig；先看线路和标志，再追踪中断链路，注意调试读DR可能提前清RXNE。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-047 | 接收乱码的分层排查

标签：UART, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

接收数据乱码

电脑发送字符后，STM32 观察到的数据不符合预期。

请从时钟、BRR、数据帧格式、GPIO、物理连接和接收逻辑六个方面分析可能原因。

### 参考答案

**核心结论：** 核对实际PCLK2和BRR、双方帧格式、GPIO/映射、供电电平共地接线，以及错误标志、缓冲边界和文本编码。

**必要解释：** 使用固定已知字节并对照波形与原始接收值，区分位时序错误、丢字节和显示编码问题，避免一次改所有参数。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-048 | ClearFlag无法清ORE

标签：UART, ORE, SPL, 错误处理
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

清除标志失败

程序试图使用 `USART_ClearFlag()` 清除 ORE，但错误标志仍然存在。

请解释原因，并说明正确的处理思路。

### 参考答案

**核心结论：** ORE不属于该版USART_ClearFlag可直接写SR清除的标志，应按先读SR再读DR清除。

**必要解释：** 读取前保存所需错误快照，读取后恢复消息状态；参数断言通过与否不改变硬件清除规则，也不能恢复已丢数据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-003 | USART1默认引脚

标签：UART, 引脚映射, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

STM32F103 的 USART1 默认映射下，TX 和 RX 分别对应哪个引脚？

A. PA10、PA9

B. PA9、PA10

C. PA2、PA3

D. PB6、PB7

### 参考答案

**核心结论：** 选B，USART1默认PA9为TX、PA10为RX。

**必要解释：** 重映射后引脚改变，需核对AFIO及实际封装；不能把默认映射当作所有工程的接线。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-004 | USART1发送脚模式

标签：UART, GPIO, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

使用 STM32 标准外设库配置 USART1 的 TX 引脚 PA9 时，通常应使用哪种 GPIO 模式？

A. GPIO_Mode_Out_PP

B. GPIO_Mode_IPU

C. GPIO_Mode_AF_PP

D. GPIO_Mode_AIN

### 参考答案

**核心结论：** 选C，PA9配置为复用推挽输出。

**必要解释：** 让USART控制发送引脚；接收脚应按输入需求配置，不能直接复制发送模式。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-005 | USART1和GPIOA时钟

标签：UART, RCC, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

STM32F103 中，GPIOA 和 USART1 的时钟通常分别由哪个总线控制？

A. GPIOA：APB1；USART1：APB1

B. GPIOA：APB2；USART1：APB2

C. GPIOA：AHB；USART1：APB1

D. GPIOA：APB1；USART1：APB2

### 参考答案

**核心结论：** 选B，GPIOA与USART1均使用APB2外设时钟门控。

**必要解释：** 使能端口和USART是独立步骤，APB2频率还受时钟树分频影响。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-009 | 读取DR的副作用

标签：UART, RXNE, 寄存器, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

在常规接收流程中，软件读取 USART 的 DR 后，通常会发生什么？

A. RXNE 被清除

B. TXE 永久清零

C. USART 自动关闭

D. 波特率自动改变

### 参考答案

**核心结论：** 选A，正常读取接收DR会清除RXNE。

**必要解释：** 读取有硬件副作用，调试窗口或多个消费者也可能影响接收流程。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-010 | 接收溢出条件

标签：UART, ORE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

如果接收数据寄存器中的旧数据尚未被读取，新数据又完成接收，可能发生什么？

A. 自动切换为 DMA 模式

B. USART 自动提高波特率

C. 接收溢出错误 ORE，导致后续新数据丢失

D. GPIO 自动切换为输出模式

### 参考答案

**核心结论：** 选C，旧接收数据未及时读取而新帧到达，可能出现ORE并丢失新数据。

**必要解释：** 软件数组大不代表硬件DR会自动缓存多帧，应保证及时取数并处理错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-014 | 发送链路排查优先级

标签：UART, 故障分析, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

电脑收不到STM32F103 USART1发送的字符，尚未确认初始化和连线无误。以下哪项通常不属于发送链路的优先排查项目？

A. TX引脚的复用推挽配置。
B. USART1时钟及使能。
C. 波特率与帧格式。
D. 仅用于接收的软件字符串缓冲区容量。

### 参考答案

**核心结论：** 选D，纯接收字符串缓冲区容量通常不是发送无输出的首要原因。

**必要解释：** 先核对时钟、使能、引脚、波特率、帧格式与物理连接；综合故障仍需证据而非排除式断言。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-015 | 轮询接收方式

标签：UART, 轮询, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

以下关于轮询接收的说法，哪项正确？

A. 轮询接收不需要使能 USART

B. 程序可以持续检查 RXNE，置位后读取接收数据

C. 轮询方式能够保证永远不会丢失数据

D. 轮询接收只能使用 DMA

### 参考答案

**核心结论：** 选B，检查RXNE，置位后读取接收数据。

**必要解释：** 轮询本身不保证及时处理或永不丢数据，还要检查错误并保证最大服务间隔。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-018 | RXNE与引脚电平

标签：UART, RXNE, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

RXNE 反映的是接收数据寄存器状态，而不是 RX 引脚当前的电平状态。

### 参考答案

**核心结论：** 正确。RXNE反映未读接收数据，而非当前RX脚逻辑值。

**必要解释：** 一帧结束后引脚可已回到空闲高，RXNE仍保持到读取DR。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-020 | 初始化与外部连接

标签：UART, 初始化, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

只要 USART 初始化成功，就不需要再检查 GPIO 引脚配置和硬件连接。

### 参考答案

**核心结论：** 错误。USART参数正确不能替代GPIO、时钟、映射和硬件连接检查。

**必要解释：** 完整链路的每一层都需要满足，编译或库函数返回不证明线路通信成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-023 | 阻塞等待无数据

标签：UART, 轮询, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

如果程序一直等待 RXNE，而电脑没有发送数据，阻塞式轮询程序可能一直停留在等待循环中。

### 参考答案

**核心结论：** 正确。没有超时或其他退出条件时，等待RXNE可无限持续。

**必要解释：** 工程中按需求使用有界等待、非阻塞轮询或中断/DMA，不是简单提高主频。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-024 | ORE后的数据可信性

标签：UART, ORE, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

发生 ORE 后，可以不检查错误状态，直接假设所有数据都已正确接收。

### 参考答案

**核心结论：** 错误。ORE表明接收可能丢失，不能继续假设数据流完整。

**必要解释：** 需按SR后DR序列清标志并处理当前消息失效；清标志不能补回已丢失字节。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-026 | USART1初始化流程

标签：UART, RCC, SPL, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

USART 初始化

请按合理顺序列出 STM32F103 使用标准外设库初始化 USART1 的主要步骤，并说明 GPIO 配置与 USART 配置分别负责什么。

### 参考答案

**核心结论：** 使能GPIOA和USART1时钟，配置TX/RX与映射，设置波特率和帧格式、收发功能，最后使能USART。

**必要解释：** 中断/DMA方案先准备NVIC/处理程序或DMA通道缓冲再开放请求；GPIO决定引脚路径，USART决定串行功能。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-027 | 连续发送时的TXE与TC

标签：UART, TXE, TC, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TXE 与 TC

请分别解释 TXE 和 TC 的含义，并说明为什么发送字符串时通常不必在每个字符发送前都等待 TC。

### 参考答案

**核心结论：** 每份数据写入前等待TXE；需要结束整批发送时再等待TC。

**必要解释：** 逐字节等TC会等待前帧完全结束，可能引入额外间隔；外设关闭、RS-485方向切换等要求TC。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-028 | RXNE与数据读取顺序

标签：UART, RXNE, 寄存器
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

RXNE 与 DR

请说明 RXNE 和 DR 的关系，并解释为什么程序通常先检查 RXNE，再读取接收数据。

### 参考答案

**核心结论：** 硬件接收一帧并将其交给DR后置RXNE，软件先确认再读DR。

**必要解释：** 盲读可能取得旧值或提前消费数据；需避免多个接收者争用同一DR。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-029 | ORE检测与恢复

标签：UART, ORE, 错误处理
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

ORE

什么是接收溢出错误 ORE？请解释其产生条件、可能后果，以及 STM32F1 中清除该错误标志时需要注意的寄存器访问顺序。

### 参考答案

**核心结论：** 未读DR时新数据到来可能溢出；F1按先SR后DR清ORE，并将不完整消息交给恢复策略。

**必要解释：** 记录错误、重置或丢弃到协议边界，必要时请求重发；清标志不恢复丢失数据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-034 | USART发送无输出排查

标签：UART, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

串口没有输出

STM32 已经下载程序，但电脑串口助手完全收不到字符。请按优先级列出至少五项排查内容。

### 参考答案

**核心结论：** 依次检查供电/共地/电平与交叉接线、端口和串口助手、RCC、GPIO/映射、UE/TE、BRR与帧格式及实际发送路径。

**必要解释：** 用示波器或分析仪区分MCU引脚无波形与电脑接收失败，再查对应层；不要同时修改所有配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-035 | USART接收不到数据排查

标签：UART, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

接收不到数据

程序持续等待 RXNE，但电脑已经发送字符。请列出至少五种可能原因，并说明如何逐步缩小故障范围。

### 参考答案

**核心结论：** 检查电脑TX到MCU RX连线、共地及电平、正确引脚映射与输入模式、RCC、UE/RE、波特率帧格式和程序是否真正服务RXNE。

**必要解释：** 抓RX波形并观察SR；避免调试窗口读DR消耗数据，按有无波形及错误标志逐层缩小范围。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-038 | 软件数组与硬件ORE

标签：UART, ORE, 缓冲区
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

接收溢出

程序在接收过程中出现 ORE。请说明为什么只增加接收缓冲区的容量不一定能解决问题。

### 参考答案

**核心结论：** ORE发生在硬件接收与DR读取之间，软件数组变大不能保证DR被及时服务。

**必要解释：** 检查临界区、阻塞发送、服务间隔和流控，再评估中断/DMA；缓冲仍需容量与消费者速度保证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-041 | 单字节轮询回显

标签：UART, 轮询, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

单字节回显

请描述一个单字节回显程序的完整执行流程，并说明接收和发送阶段分别需要关注哪个状态标志。

### 参考答案

**核心结论：** 初始化后等RXNE，读取并保存字节；等TXE写回DR，再处理下一字节，需最终物理完成时检查TC。

**必要解释：** 所有等待按需求有超时/退出，检查ORE等错误；阻塞发送时间过长可能影响持续接收。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart1-043 | UART模块与异常设计

标签：UART, 模块设计, 错误处理
难度：综合

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

独立综合实现

不参考原例程，设计一个基于 STM32F103RCT6、USART1 和标准外设库的基础串口程序，要求：

1. 初始化 USART1，设置 115200、8N1。
2. 周期性发送固定字符串。
3. 接收电脑发送的字符串。
4. 以 LF 为结束符。
5. 收到完整字符串后进行回传。
6. 处理缓冲区边界。
7. 避免程序因无数据而永久阻塞。
8. 能解释 TXE、TC、RXNE 和 ORE 的作用。

请先写出程序模块设计、数据流和关键状态管理方法，再自行完成代码和实机调试。

### 参考答案

**核心结论：** 分离初始化、非阻塞收发服务、接收消息状态机与周期任务；以长度、丢弃态、截止时间和错误码串联。

**必要解释：** 验证正常/空消息、31字节边界、超长、缺LF、连续帧及ORE恢复；本答案提供设计检查点，不代替学习者代码和实机独立验收。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-001 | USART1绝对地址计算

标签：UART, 寄存器, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

寄存器地址

STM32F103 的 USART1 基地址为 `0x40013800`，CR1 的偏移地址为 `0x0C`。那么 CR1 的绝对地址是多少？

A. `0x40013804`

B. `0x40013808`

C. `0x4001380C`

D. `0x40013810`

### 参考答案

**核心结论：** 选C，CR1地址为0x4001380C。

**必要解释：** 基地址0x40013800加偏移0x0C；偏移不是可单独使用的绝对地址。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-002 | 寄存器结构体访问

标签：UART, 寄存器, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

寄存器访问

执行以下表达式：

`USART1->CR1`

其含义是什么？

A. 调用 USART1 的初始化函数

B. 读取或访问 USART1 的控制寄存器 CR1

C. 读取 USART1 的接收缓冲区变量

D. 使能 USART1 的 APB2 时钟

### 参考答案

**核心结论：** 选B，USART1->CR1是对USART1控制寄存器CR1的访问表达式。

**必要解释：** 是否发生读或写由上下文决定，表达式不是初始化函数调用或RCC时钟命令。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-003 | USART1分频输入时钟

标签：UART, 时钟树, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

USART1 时钟

STM32F103 中，USART1 的波特率计算应使用哪个时钟？

A. SYSCLK，任何情况下都直接使用系统时钟

B. PCLK1

C. PCLK2

D. AHB 时钟，不考虑 APB 分频

### 参考答案

**核心结论：** 选C，USART1使用PCLK2。

**必要解释：** 必须由实际时钟树得到PCLK2，不能始终以SYSCLK替代。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-004 | 115200对应BRR

标签：UART, BRR, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

BRR 计算

假设 USART1 的输入时钟为 72 MHz，目标波特率为 115200 baud，STM32F103 使用 16 倍过采样。正确的 BRR 值是哪一个？

A. `0x0271`

B. `0x2710`

C. `0x0048`

D. `0x200C`

### 参考答案

**核心结论：** 选A，USARTDIV=72000000/(16×115200)=39.0625，BRR=0x0271。

**必要解释：** 整数39写入高12位，小数0.0625×16=1写低4位；该题没有量化舍入误差。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-005 | UE TE RE控制职责

标签：UART, CR1, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

UE、TE、RE

以下关于 CR1 中 UE、TE、RE 的说法，哪一项正确？

A. UE 控制发送，TE 控制接收，RE 控制整体使能

B. UE 控制 USART 整体使能，TE 控制发送器，RE 控制接收器

C. UE 控制波特率，TE 控制停止位，RE 控制校验位

D. 三个位的功能完全相同

### 参考答案

**核心结论：** 选B，UE整体使能，TE发送器使能，RE接收器使能。

**必要解释：** 三者职责不同，时钟和引脚另行配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-006 | 普通8N1的CR1目标

标签：UART, CR1, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

8N1 配置

USART1 使用 8 个数据位、无奇偶校验、1 个停止位，同时启用发送与接收。假设 UE、TE、RE 已置位，CR2 和 CR3 采用默认的普通异步通信配置，那么 CR1 的目标值应为：

A. `0x000C`

B. `0x2008`

C. `0x200C`

D. `0x300C`

### 参考答案

**核心结论：** 选C，UE/TE/RE置位且M/PCE等为0时，CR1为0x200C。

**必要解释：** 1停止位由CR2.STOP=00控制；只有CR1数值不能证明全部初始化完成。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-007 | 8有效位加偶校验

标签：UART, 校验位, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

奇偶校验

STM32F103 USART 要实现 8 个有效数据位、偶校验，应如何设置 CR1 的 M、PCE、PS？

A. M=0，PCE=0，PS=0

B. M=0，PCE=1，PS=0

C. M=1，PCE=1，PS=0

D. M=1，PCE=0，PS=1

### 参考答案

**核心结论：** 选C，M=1、PCE=1、PS=0。

**必要解释：** F1的校验位占用所选字长最高位，9位字长配置提供8位有效数据加1位校验。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-008 | TXE单选辨析

标签：UART, TXE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TXE 标志

TXE=1 表示什么？

A. 最后一个停止位已经发送完成

B. 接收数据寄存器中存在新数据

C. 发送数据寄存器为空，可以写入下一份数据

D. USART 已经关闭

### 参考答案

**核心结论：** 选C，发送DR为空，可写入下一份数据。

**必要解释：** 移位寄存器可能仍在发送，TXE不是最后停止位完成标志。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-009 | TC单选辨析

标签：UART, TC, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

TC 标志

TC=1 表示什么？

A. 发送数据寄存器为空，但移位寄存器仍可能正在发送

B. 最后一帧已发送完成，发送数据寄存器和移位寄存器均为空

C. 接收数据寄存器非空

D. 接收发生溢出

### 参考答案

**核心结论：** 选B，最后一帧已发完，发送DR和移位寄存器均为空。

**必要解释：** 必须关联本次发送观察，复位初态或后续发送会改变解释。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-010 | RXNE单选辨析

标签：UART, RXNE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

RXNE 标志

RXNE=1 表示什么？

A. RX 引脚当前为高电平

B. USART 的发送过程已经完成

C. 接收数据寄存器中有可供软件读取的数据

D. USART 已经关闭

### 参考答案

**核心结论：** 选C，接收DR中有可读数据。

**必要解释：** 该状态独立于RX脚此刻高低；读取接收DR会清RXNE。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-011 | 接收错误清除序列

标签：UART, 错误标志, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

状态标志清除

在 STM32F103 中，清除 IDLE、ORE、FE、NE 等标志时，通常需要遵循哪一种寄存器访问顺序？

A. 先写 CR1，再写 CR2

B. 先读 SR，再读 DR

C. 先写 DR，再读 SR

D. 只调用 USART_Cmd(DISABLE)

### 参考答案

**核心结论：** 选B，按先读SR、再读DR的硬件序列。

**必要解释：** IDLE、ORE、FE、NE等适用该序列，不能统一用写SR清除。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-012 | USART_Init边界

标签：UART, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

标准外设库函数

调用 `USART_Init(USART1, &USART_InitStructure)`，哪一项描述最准确？

A. 自动完成所有 RCC、GPIO、USART 配置，并自动使能整个外设

B. 根据初始化结构体配置 USART 的相关通信参数，但不替代 RCC 时钟使能、GPIO 配置和整体使能

C. 只修改软件结构体，不访问 USART 寄存器

D. 只负责发送第一个字节

### 参考答案

**核心结论：** 选B，它按结构体配置USART相关参数，不替代RCC、GPIO和整体使能。

**必要解释：** 不同库函数各有职责，函数名字含Init也不表示完整系统链路就绪。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-013 | RXNE中断源使能

标签：UART, 中断, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

中断配置

调用 `USART_ITConfig(USART1, USART_IT_RXNE, ENABLE)`，其主要作用是什么？

A. 自动开启所有 NVIC 中断

B. 自动启动 DMA 接收

C. 使能 USART 的 RXNE 中断源

D. 立即读取 DR 并清除 RXNE

### 参考答案

**核心结论：** 选C，仅使能USART内部RXNE中断源。

**必要解释：** 还需正确NVIC、向量和ISR，并满足UE/RE及实际接收条件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-014 | USART的DMA请求

标签：UART, DMA, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

DMA 配置

调用 `USART_DMACmd(USART1, USART_DMAReq_Rx, ENABLE)` 后，哪项说法正确？

A. 整个 DMA 通道已经完成所有配置并立即开始接收

B. USART 接收 DMA 请求已使能，但 DMA 控制器仍需单独配置

C. USART 已切换为中断模式

D. USART 的 UE 位被清零

### 参考答案

**核心结论：** 选B，USART侧请求使能后DMA控制器仍需单独配置。

**必要解释：** 通道映射、地址、宽度、计数、使能及缓冲区生命周期都必须正确。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-015 | 时钟分频和引脚分工

标签：UART, RCC, GPIO, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

波特率与 GPIO

以下哪一项正确？

A. GPIO 输出速度直接决定 USART 波特率

B. 修改 BRR 可以代替 GPIO 引脚配置

C. RCC 提供 USART 输入时钟，BRR 配置波特率分频，GPIO 决定引脚工作模式

D. 只要 PA9 配置正确，USART1 就一定能正常发送

### 参考答案

**核心结论：** 选C，RCC提供时钟，BRR设置分频，引脚模式和映射确定输出路径。

**必要解释：** GPIO速度档位不是波特率，任何单项配置正确都不足以保证整条链路工作。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-016 | 基地址与偏移

标签：UART, 寄存器, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

USART1 的寄存器绝对地址等于 USART1 基地址加寄存器偏移地址。

### 参考答案

**核心结论：** 正确。对应寄存器地址由外设基地址加其偏移得到。

**必要解释：** 偏移及布局必须按STM32F103手册核实，不推广到所有系列。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-017 | USART总线归属

标签：UART, 时钟树, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

在 STM32F103 中，USART1 使用 PCLK2，而 USART2、USART3 使用 PCLK1。

### 参考答案

**核心结论：** 正确。USART1使用PCLK2，USART2和USART3使用PCLK1。

**必要解释：** 由各自外设时钟计算波特率，不能因同为USART而共用未经核对的频率。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## uart2-018 | BRR配置与使能

标签：UART, 初始化, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，库函数为SPL V3.5.0；使用普通异步USART，特殊模式另作题设。

在普通 8N1 配置中，只要将 BRR 设置正确，即使 UE=0，也能够正常完成 USART 通信。

### 参考答案

**核心结论：** 错误。UE=0时仅设置正确BRR不能正常完成普通USART通信。

**必要解释：** 还需收发方向、GPIO、时钟和帧格式满足要求。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。
