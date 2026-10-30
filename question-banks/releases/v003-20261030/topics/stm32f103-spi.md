---
schema_version: 1
topic_id: stm32f103-spi
topic_title: STM32F103RCT6 SPI寄存器与机制
---

## spi2-001 | SPI外设时钟与使能

标签：SPI, STM32F103RCT6, 寄存器, 时钟
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

SPI1时钟属于哪条总线？RCC_APB2ENR.SPI1EN与SPI_CR1.SPE分别解决什么问题？为何二者都不代表外部Flash已写使能？

### 参考答案

**核心回答：** SPI1在APB2；SPI1EN开放外设时钟，SPE使能SPI模块，外部器件写使能由器件自身协议控制。

**回答要点：** 先有正确时钟、引脚和参数，SPE使能后才具备按配置传输的条件。

**边界与易错点：** 这里区分片内两层控制；外部命令不属于RCC或SPE的职责。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-002 | SPI1默认引脚

标签：SPI, STM32F103RCT6, 寄存器, 引脚映射
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

不启用SPI1重映射时，SCK/MISO/MOSI通常分别是哪三个引脚？使用软件管理独立CS时，还需核对哪些配置？

### 参考答案

**核心回答：** SPI1默认PA5/PA6/PA7；核对GPIO复用/输入模式、独立CS输出及默认无效电平、时钟与板卡连线。

**回答要点：** 主机SCK/MOSI是输出路径，MISO为输入；外部器件CS可以由独立GPIO管理。

**边界与易错点：** 本题明确不重映射，不能把这组引脚当成所有F103板卡都已连接的事实。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi2-021 | TXE、RXNE与BSY

标签：SPI, STM32F103RCT6, 寄存器, 状态标志
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

SR中的TXE、RXNE、BSY分别说明什么？TXE=1为什么不能单独证明最后一个数据帧已经传输完成？

### 参考答案

**核心回答：** TXE表示发送缓冲可写，RXNE表示接收数据可读，BSY反映通信忙；发送缓冲空时移位器可能仍在发送末帧。

**回答要点：** 收尾应结合最后接收数据、TXE和BSY按主机模式规定处理。

**边界与易错点：** 这里限定SPI主机；BSY在其他工作模式和具体勘误中的限制不能忽略，片选释放还需满足目标时序。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-004 | 参数配置与启动条件

标签：SPI, STM32F103RCT6, 寄存器, 初始化
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

不要求写代码：SPI1从未配置到可进行主机全双工传输，时钟、GPIO、CR1参数、NSS和SPE之间有哪些依赖？为什么只写参数不一定会开始通信？

### 参考答案

**核心回答：** 先配置外设与端口时钟、引脚与CS，再在允许状态设置主从、模式、帧宽、位序、分频及NSS策略，最后使能SPE。

**回答要点：** 传输还需通过数据寄存器供数；使能不等于已产生完整业务事务。

**边界与易错点：** 有些参数应在禁用时修改；不能把任何开发库的一次初始化调用视为全部硬件链路已完成。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-005 | 帧宽与DR访问宽度

标签：SPI, STM32F103RCT6, 寄存器, 数据帧
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

CR1.DFF=0或1分别选择什么帧宽？在该F1 SPI中，DFF=0时一次16位DR写是否因此必然在线上产生两个8位帧？写入次数与帧格式应如何区分？

### 参考答案

**核心回答：** DFF=0为8位、1为16位；F1帧宽由DFF决定，一次16位DR写在8位模式下不因此自动变成两个帧。

**回答要点：** 按规定的访问宽度、有效低位和写入次数理解数据；传输多帧需要相应供数。

**边界与易错点：** 不同系列带FIFO/数据打包的SPI可能语义不同，不能把其访问宽度经验直接套到F103。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-006 | SPI1分频计算

标签：SPI, STM32F103RCT6, 寄存器, 参数计算
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

PCLK2=72 MHz，SPI1 CR1.BR[2:0]=101，分频编码从000对应2分频到111对应256分频。求分频系数与SCK；若目标最高20 MHz，该配置是否满足频率上限？

### 参考答案

**核心回答：** 101为64分频，SCK=72/64=1.125 MHz，低于20 MHz上限。

**回答要点：** BR按2的幂选择分频；还需核对CPOL/CPHA、建立保持和目标指令条件。

**边界与易错点：** 满足频率上限不代表吞吐率达到业务目标或线路已经验证。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-007 | 由条件推导CR1字段

标签：SPI, STM32F103RCT6, 寄存器, 位域推导
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

给定CR1位号：CPHA=0、CPOL=1、MSTR=2、BR=5:3、SPE=6、LSBFIRST=7、SSI=8、SSM=9、DFF=11。其余位0。要求Mode0、主机、8位、MSB先、软件NSS且SSI=1、64分频、使能。求字段和值。

### 参考答案

**核心回答：** CPOL=0、CPHA=0、MSTR=1、BR=101、SPE=1、LSBFIRST=0、SSI=1、SSM=1、DFF=0，合计0x036C。

**回答要点：** 将MSTR的0x0004、BR的0x0028、SPE的0x0040、SSI的0x0100、SSM的0x0200相加。

**边界与易错点：** 这里由给定位表推导，不要求背常量；修改已有字段要先清目标位，不能破坏其他配置。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi2-012 | 接收溢出的清除与恢复

标签：SPI, STM32F103RCT6, 寄存器, 错误处理
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

全双工SPI1中OVR表示什么？规定的清除访问顺序是什么？清除后能否直接把原事务记为成功？

### 参考答案

**核心回答：** OVR表示接收数据服务不及时导致溢出；按规定先读DR、再读SR清除。清标志不能恢复已经丢失的数据。

**回答要点：** 还应按目标协议结束/重同步事务，并核对接收服务速度、缓冲或DMA处理。

**边界与易错点：** 不要统一写0清除所有SPI错误；是否可重试取决于业务命令是否产生副作用。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-009 | MODF与CRCERR的不同处理

标签：SPI, STM32F103RCT6, 寄存器, 错误处理
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

MODF与CRCERR分别反映什么问题？它们和OVR为何不能统一用同一清除方法？

### 参考答案

**核心回答：** MODF是模式错误，常与主机NSS条件冲突有关，按规定读SR后写CR1并恢复正确配置；CRCERR是CRC不匹配，按规定写0清除。

**回答要点：** MODF可能改变MSTR/SPE，应排查NSS管理与总线争用；CRC错误需核对CRC配置、帧边界和数据完整性。

**边界与易错点：** 本题CRCERR以已启用硬件CRC为前提；清除不等于原事务数据可靠，也不等于外部器件内部CRC规则相同。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi1-021 | 单帧收发与事务结束

标签：SPI, STM32F103RCT6, 寄存器, 状态机
难度：进阶

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

SPI1主机、8位全双工，CS由GPIO按器件要求保持。请口述发送并接收一个字节的硬件状态流程，包含有界等待、接收消费和事务收尾，不要求函数或代码。

### 参考答案

**核心回答：** 在有效CS内等TXE→写一帧DR→等RXNE→读DR；最后按规定确认TXE及BSY清零，满足目标CS保持时间后结束事务。

**回答要点：** 每阶段检查错误/超时；已有OVR应按规定处理并判该次数据是否失效。

**边界与易错点：** 单帧完成不等于Flash内部编程完成；超时后的CS与外设状态要形成明确可恢复边界。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi2-017 | GPIO速度与串行时钟

标签：SPI, STM32F103RCT6, 寄存器, 时钟, 电气接口
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

GPIO输出速度档位和SPI1的BR分频分别控制什么？为何将GPIO设置为某MHz档位，不能据此认定SCK就是该频率？

### 参考答案

**核心回答：** GPIO速度档位影响输出驱动/边沿能力；SCK由SPI输入时钟经BR分频决定。

**回答要点：** 按信号频率、负载、EMI和电气时序选择合适输出能力，不能混淆时钟频率与驱动特性。

**边界与易错点：** 更高GPIO档位不必然更可靠，具体边沿与负载还需测量。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi2-024 | SPI资料与验证证据

标签：SPI, STM32F103RCT6, 寄存器, 资料核对
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

为F103RCT6 SPI主机确认模式、寄存器和末帧结束，为什么需要同时核对参考手册、具体芯片勘误与外部目标数据手册？

### 参考答案

**核心回答：** 参考手册定义片内寄存器与状态机；芯片资料/勘误限定实际型号与硅版本；目标手册定义命令、频率、CS和就绪条件。

**回答要点：** 可用逻辑分析仪观察事务，用示波器检查电平与建立保持，核对实际修订。

**边界与易错点：** 编译、短时读对或寄存器配置符合预期，都不能替代完整波形、电气和长期验证。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## spi-reg-013 | 中断使能与状态发生

标签：SPI, STM32F103RCT6, 寄存器, 中断
难度：基础

### 题目

适用芯片：STM32F103RCT6；SPI1主机、双线全双工，除题目另述外使用8位帧，不依赖外设库。

CR2.RXNEIE与SR.RXNE分别代表什么？把RXNEIE置1是否意味着接收缓冲已含一个新数据帧？

### 参考答案

**核心回答：** RXNEIE控制对应中断请求是否允许；RXNE表示接收缓冲已有数据，两者是使能与事件状态。

**回答要点：** 还需配置NVIC及中断处理，并及时读取接收数据；若使用DMA，应明确接收数据由谁消费。

**边界与易错点：** 配置中断使能不制造数据；无数据时不能仅因中断打开就读取并认定新结果有效。

#### 依据

[ST RM0008：SPI状态、帧宽、错误清除与禁用流程](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC资料与勘误入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。
