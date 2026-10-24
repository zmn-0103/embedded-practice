---
schema_version: 1
topic_id: w25q16-spi-nor
topic_title: W25Q16 SPI NOR
---

## spi1-009 | JEDEC ID指令

标签：SPI, NOR, 命令, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

W25Q16 系列常见的 JEDEC ID 读取命令是？

A. `0x02`  
B. `0x03`  
C. `0x06`  
D. `0x9F`

### 参考答案

**核心结论：** 选D，标准SPI读取JEDEC ID使用0x9F。

**必要解释：** ID包含厂商、存储类型和容量等字节；实际期望值随完整型号后缀变化，不能统一写死EF4015。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-010 | 普通读取指令

标签：SPI, NOR, 命令, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

W25Q16 系列常见的普通读取命令是？

A. `0x03`  
B. `0x05`  
C. `0x06`  
D. `0x20`

### 参考答案

**核心结论：** 选A，0x03为普通读取指令。

**必要解释：** 在本题24位寻址条件下接三字节地址，随后提供数据时钟；不要混用快速读取的dummy周期。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-011 | Flash写使能指令

标签：SPI, NOR, WEL, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

W25Q16 系列常见的写使能命令是？

A. `0x9F`  
B. `0x06`  
C. `0x03`  
D. `0xFF`

### 参考答案

**核心结论：** 选B，0x06设置器件内部写使能锁存WEL。

**必要解释：** 它是独立片选事务；不能与MCU的SPE或RCC使能混为一谈。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-012 | 读数据时的占位发送

标签：SPI, NOR, 时钟, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

为什么读取 Flash 数据时，STM32 需要继续发送占位字节？

A. 为了让 Flash 自己产生 SCK  
B. 为了自动擦除目标地址  
C. 为了由主机继续产生时钟，让 Flash 输出数据  
D. 为了关闭 SPI1

### 参考答案

**核心结论：** 选C，控制器持续移出占位字节以产生SCK，使Flash返回数据。

**必要解释：** 占位发送不表示把这些字节写入Flash；接收与发送共用帧时钟。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-013 | 读取命令后的地址阶段

标签：SPI, NOR, 地址, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

发送普通读取命令 `0x03` 后，通常还需要发送什么？

A. 只需要立即拉高 CS  
B. 目标地址的三个字节，然后提供时钟接收数据  
C. 只发送 `0x06`  
D. 先关闭 SPI1 时钟

### 参考答案

**核心结论：** 选B，发送高字节在前的三个地址字节，然后提供时钟接收。

**必要解释：** 限定普通0x03与24位地址；其他器件/指令需核对地址宽度及等待周期。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-014 | 页编程的WEL条件

标签：SPI, NOR, WEL, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

页编程前，为什么通常需要检查或处理 Flash 的写使能状态？

A. 因为 `0x06` 用来选择 SPI Mode 0  
B. 因为写使能是允许后续编程/擦除操作的重要条件  
C. 因为写使能会自动完成数据校验  
D. 因为写使能等于 MCU 的 `SPE`

### 参考答案

**核心结论：** 选B，编程/擦除前通常要求WEL有效。

**必要解释：** 还需就绪、未受保护、地址长度合法等条件；WEL置位不等于写入已完成或已校验。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-015 | 页内剩余空间计算

标签：NOR, 页边界, 计算题
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

从地址 `0x0010F0` 开始写入 32 字节，若页大小为 256 字节，当前页还剩多少字节？

A. 8 字节  
B. 16 字节  
C. 32 字节  
D. 240 字节

### 参考答案

**核心结论：** 选B，偏移0xF0=240，当前256字节页还剩16字节。

**必要解释：** 若总长32字节，应按16加16分两页处理，每页独立写使能并等待内部完成。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-016 | 跨页编程限制

标签：NOR, 页边界, 单选题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

为什么 Flash 页编程不能简单假定可以任意跨页写入？

A. 因为 SPI 只能发送 1 字节  
B. 因为跨页编程可能发生页内地址回绕，应按页拆分  
C. 因为 Flash 不支持地址  
D. 因为每次写入都会自动擦除整个芯片

### 参考答案

**核心结论：** 选B，跨过页尾可能回绕覆盖当前页起始位置，须按页边界拆分。

**必要解释：** 还需核对总地址范围与目标单元擦除状态，不能假定页编程自动擦除。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-017 | MCU忙与器件内部忙

标签：SPI, NOR, 状态分层, 单选题
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

`SPI_SR.BSY` 与 Flash 状态寄存器中的 `BUSY/WIP` 有什么区别？

A. 两者完全相同  
B. `SPI_SR.BSY` 是 MCU 的 SPI 传输状态；Flash 的 BUSY/WIP 是内部编程/擦除状态  
C. `SPI_SR.BSY` 表示 Flash 已写使能  
D. Flash 的 BUSY/WIP 表示 GPIO 时钟是否开启

### 参考答案

**核心结论：** 选B，SPI_SR.BSY是MCU串行传输状态，Flash BUSY/WIP是内部操作状态。

**必要解释：** 片选事务结束后Flash仍可能编程/擦除，需另读器件状态等待完成。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-022 | JEDEC ID完整事务

标签：SPI, NOR, 时序分析
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

请按顺序写出读取 JEDEC ID 的命令事务。

### 参考答案

**核心结论：** CS拉低，发0x9F，再发占位字节接收ID，确认末帧结束后CS拉高，对照完整型号。

**必要解释：** 指令期间的首个接收值通常不是第一个ID字节，需正确对齐收发位置并检查超时/溢出。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-023 | 页编程到回读验证

标签：NOR, 页编程, 流程设计
难度：综合

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

请按顺序写出页编程的基本流程，从准备到回读验证。

### 参考答案

**核心结论：** 确认测试区域与地址长度，等待就绪，必要时擦除并等完成；每页写使能，发送0x02及地址数据，结束CS，轮询内部忙，再回读比较。

**必要解释：** NOR通常只能把1编程为0，0变1需擦除；擦除以扇区为单位，须保留同扇区其他有效数据并考虑掉电及写保护。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-024 | SPI空闲不能证明写完

标签：SPI, NOR, 状态分层
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

为什么不能只检查 STM32 的 `SPI_SR.BSY` 就认为 Flash 擦除或编程已经完成？

### 参考答案

**核心结论：** BSY清零仅证明MCU端串行事务结束，不代表Flash内部操作已完成。

**必要解释：** 结束片选后按器件状态寄存器轮询WIP/BUSY并设置适合操作的截止时间，最终回读验证。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-025 | Flash读写回验设计

标签：NOR, 测试设计, 数据保护
难度：综合

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

第一层测试要求“读出原值、写入新值、再读回来比较并打印结果”。请写出你会如何设计这项测试。

### 参考答案

**核心结论：** 使用明确可覆盖区域，记录原值，按需求保护同扇区其他内容后擦除、写使能、分页写、等待忙结束并回读逐字节比较。

**必要解释：** 记录地址长度/期望实际与错误阶段，测试正常、边界和失败；原值打印并不是可靠备份，也不授权擦除未知区域。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi1-026 | Flash回读不一致排查

标签：SPI, NOR, 故障定位
难度：综合

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

写入后读回数据不一致，至少列出五个可能的排查方向。

### 参考答案

**核心结论：** 分层检查电源/接线/CS、模式频率、引脚映射与DR访问、TXE/RXNE/OVR、命令地址顺序、页边界、WEL/保护、内部BUSY与擦除状态。

**必要解释：** 先抓命令事务与状态，再用安全已知区域复核；全0或全1不能单独证明具体损坏原因。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi2-008 | 24位地址字节顺序

标签：NOR, 地址, 计算题
难度：基础

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

地址 0x001000 的三个地址字节是？  
A. 10 00 00　B. 00 00 10　C. 00 10 00　D. 01 00 00

### 参考答案

**核心结论：** 选C，0x001000从高到低发送00、10、00。

**必要解释：** 字节内位序也须符合器件MSB优先要求，不能按CPU内存小端顺序直接发送地址对象。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi2-010 | 32字节跨页分配

标签：NOR, 页边界, 计算题
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

从 0x0010F0 写 32 字节，页大小 256 字节，应？  
A. 一次写完　B. 当前页 16 字节、下一页 16 字节　C. 擦除全芯片　D. 地址改成 FFFFFF

### 参考答案

**核心结论：** 选B，当前页写16字节，下一页再写16字节。

**必要解释：** 每页写入分别检查就绪、写使能和内部完成；不能把两段连成同一个页编程事务。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi2-016 | 三类使能的层次

标签：SPI, RCC, WEL, 概念辨析
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

区分 RCC SPI1EN、SPI_CR1.SPE、Flash 命令 0x06。

### 参考答案

**核心结论：** SPI1EN开启MCU外设时钟，SPE使能SPI状态机，0x06请求Flash内部写使能。

**必要解释：** 三者分属RCC、SPI和外部器件，不能互相替代；完整初始化仍含GPIO等依赖。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## spi2-023 | CS与Flash事务边界

标签：SPI, NOR, 片选时序
难度：进阶

### 题目

器件题以W25Q16JV、24位地址、256字节页为例。涉及MCU状态时限定STM32F103；实物后缀需另核对。

为什么 CS 必须遵守 Flash 命令事务边界？

### 参考答案

**核心结论：** CS界定器件命令序列，提前拉高可能截断命令/地址/数据，写命令常在CS上升沿后进入内部执行。

**必要解释：** 需满足手册最小时序并保持整条命令期间片选有效；写使能与页编程通常为独立事务。

**适用条件与依据：** 以已查W25Q16JV的标准SPI指令为参考；实物完整后缀、供电、ID、保护位及时序待核实；不得把所有W25Q16后缀视为完全相同。

[Winbond W25Q16JV：指令、状态与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST ES0340 Rev17 §2.9：I2C限制与恢复](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。
