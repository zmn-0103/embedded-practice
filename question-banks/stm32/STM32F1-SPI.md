---
schema_version: 1
topic_id: stm32f103-spi
topic_title: STM32F1 SPI
---

## spi1-005 | SPI参数初始化接口

标签：SPI, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

标准外设库中，通常用哪个函数初始化 SPI 参数？

A. `GPIO_Init()`  
B. `SPI_Init()`  
C. `RCC_APB2PeriphClockCmd()`  
D. `SPI_Cmd()`

### 参考答案

**核心结论：** 选B，SPI_Init按结构体配置SPI参数。

**必要解释：** GPIO、RCC和SPI_Cmd分别承担其他职责，不能由函数名推断它们已全部完成。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-006 | SPI_Cmd使能层次

标签：SPI, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

`SPI_Cmd(SPI1, ENABLE)` 的主要作用是什么？

A. 使能 SPI1 外设  
B. 使能 Flash 写入  
C. 擦除 Flash 扇区  
D. 设置 GPIO 引脚模式

### 参考答案

**核心结论：** 选A，该调用控制SPI1的SPE使能位。

**必要解释：** 它不向Flash发送写使能命令，也不设置RCC时钟或擦除存储区。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-007 | SPI发送缓冲状态

标签：SPI, TXE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

标准外设库中的 `SPI_I2S_FLAG_TXE` 表示什么？

A. 接收数据已准备好  
B. Flash 内部擦除结束  
C. SPI 发送缓冲区可写  
D. SPI 外设时钟已开启

### 参考答案

**核心结论：** 选C，TXE表示发送缓冲区可写。

**必要解释：** 最后一帧可能仍在移位，结束片选前需按主机模式检查传输结束条件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-008 | SPI接收缓冲状态

标签：SPI, RXNE, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

`SPI_I2S_FLAG_RXNE` 表示什么？

A. 接收数据可读  
B. 发送缓冲区为空  
C. Flash 写使能已开启  
D. CS 已拉高

### 参考答案

**核心结论：** 选A，RXNE表示接收缓冲数据可读。

**必要解释：** 读取DR及时消费数据，接收值是否有效还由具体事务阶段决定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-018 | 轮询等待的超时

标签：SPI, 超时, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

为什么等待 TXE、RXNE 或 Flash BUSY 时应设置超时？

A. 防止硬件异常或接线问题导致程序无限等待  
B. 为了自动提高 SPI 频率  
C. 为了跳过状态检查  
D. 为了让 Flash 自动复位

### 参考答案

**核心结论：** 选A，防止未满足状态让程序无限等待。

**必要解释：** 超时后返回明确失败并按阶段恢复，不能跳过标志直接把事务当成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-020 | SPI标准库职责链

标签：SPI, SPL, 函数辨析
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

请解释以下标准外设库函数分别负责什么：

- `RCC_APB2PeriphClockCmd()`
- `GPIO_Init()`
- `SPI_Init()`
- `SPI_Cmd()`
- `SPI_I2S_GetFlagStatus()`
- `SPI_I2S_SendData()`
- `SPI_I2S_ReceiveData()`

### 参考答案

**核心结论：** RCC函数管APB2门控，GPIO_Init管引脚，SPI_Init管参数，SPI_Cmd管SPE，GetFlagStatus读标志，SendData写DR，ReceiveData读DR。

**必要解释：** 收发接口不自动完成轮询、片选、超时或Flash协议；RCC_APB2函数适用于SPI1，SPI2/3需按总线另查。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi1-021 | 单帧轮询收发流程

标签：SPI, 轮询, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

请按顺序写出单字节 SPI 轮询收发的基本流程。

### 参考答案

**核心结论：** 等待TXE，写DR，等待RXNE，读DR；每个等待检查错误和超时。

**必要解释：** 最后一帧结束按F1主机时序检查TXE/BSY后处理CS；收到字节是否有意义由命令阶段决定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-001 | SPI1EN时钟门控

标签：SPI, RCC, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

RCC 的 SPI1EN 置 1 表示什么？  
A. SPI 自动开始发送　B. SPI1 外设时钟已使能　C. Flash WEL 置位　D. Flash 擦除完成

### 参考答案

**核心结论：** 选B，SPI1EN置1使能SPI1外设时钟。

**必要解释：** 它不等于SPE使能、数据发送或Flash的WEL写使能。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-004 | 轮询收发先后顺序

标签：SPI, 轮询, 单选题
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

基本单字节轮询流程是？  
A. 读 DR→写 DR→等 TXE　B. 等 TXE→写 DR→等 RXNE→读 DR　C. 清 RCC→写 DR　D. 写 DR 后无需接收

### 参考答案

**核心结论：** 选B，等TXE、写DR、等RXNE、读DR。

**必要解释：** 实际实现还需超时、错误处理和最后一帧结束判断。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-011 | SPI OVR含义

标签：SPI, OVR, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

OVR 表示？  
A. 时钟未开　B. 接收溢出、数据可能丢失　C. WEL 置位　D. 擦除成功

### 参考答案

**核心结论：** 选B，接收溢出，接收数据可能丢失。

**必要解释：** 不应忽略该标志而将整笔接收事务视作完整成功。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-012 | SPI OVR清除顺序

标签：SPI, OVR, 寄存器, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

STM32F1 的 OVR 常见清除顺序是？  
A. 先 SR 再 DR　B. 直接写 0　C. 先 DR 再 SR　D. 清 SPI1EN

### 参考答案

**核心结论：** 选C，在本题F1全双工SPI场景中按先读DR再读SR清OVR。

**必要解释：** 与USART的ORE先SR后DR不同；清除前后应处理当前事务失败，不能补回丢字节。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-017 | GPIO档位与SCK频率

标签：SPI, 时钟分频, GPIO
难度：基础

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

为什么 GPIO 输出速度不是 SPI SCK 频率？

### 参考答案

**核心结论：** GPIO速度是驱动边沿档位，SCK由SPI输入时钟和BR分频决定。

**必要解释：** 实际负载还影响边沿；应让分频与双方时序、电气要求相容。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-021 | SPI三个状态与末帧

标签：SPI, TXE, RXNE, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

解释 TXE、RXNE、SPI BSY，以及 TXE=1 为什么不等于整笔事务结束。

### 参考答案

**核心结论：** TXE表示发送缓冲空，RXNE表示接收可读，BSY表示通信进行中；TXE可早于当前帧发送完。

**必要解释：** 在本题F1主机模式下按TXE和BSY等规则确认末帧结束再改变CS；从机及勘误条件另行核对。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-022 | OVR后的事务处理

标签：SPI, OVR, 错误恢复
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

OVR 后为什么不能直接把事务视为成功？

### 参考答案

**核心结论：** OVR使接收数据完整性失去保证，当前事务应失败并按协议恢复或重试。

**必要解释：** 按DR后SR清OVR只恢复标志状态；还要处理CS边界、缓存和可能已执行的器件命令，不能盲目重复非幂等写入。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## spi2-024 | 三类官方资料的用途

标签：SPI, 资料核对
难度：进阶

### 题目

平台为STM32F103RCT6，SPL V3.5.0；除特别说明外采用SPI主机、双线全双工、8位帧。

应核对哪三类官方资料，各自核对什么？

### 参考答案

**核心结论：** RM0008核对MCU寄存器/清除序列；DS5792核对引脚和电气；完整Flash型号手册核对命令、ID、状态、容量、页大小及时序。

**必要解释：** 还应按具体芯片修订核对ES0340；资料说明、软件测试和硬件实测分别提供不同证据。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。
