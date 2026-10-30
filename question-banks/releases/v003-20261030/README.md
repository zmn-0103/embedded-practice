# V0.0.3 库无关嵌入式题库

2026-10-30后续状态：当前桌面已按用户要求删除归档旧题与历史版本，并将所有使用记录重置；只保留下列23专题382题，各一个首版、全部未练习。下方旧身份去向及归档对照仅为题库编辑历史，不表示正式软件仍保留旧题；程序日常导入仍遵守原归档契约。[实际重置报告](../../../docs/evidence/v003-reset-20261030/README.md)。

题库版本：bank-20261030.1-library-independent。全量处理10主题30份自测资料的595个源编号，整理为 **23专题、382题**；逐条来源和旧419身份去向见[manifest.json](manifest.json)，可阅读[276道旧题归档对照](旧题归档对照.md)。原始学习笔记未修改，不复制原始资料或生成备份。

每个 topics/*.md 都是完整专题快照，一次选择全部23份导入；不要选择说明或 editorial JSON。相同考点保留身份，API与重复题归档，旧历史和收藏继续保留，原活动轮使用原版本。旧13专题均有完整快照，不能把局部题目文件覆盖旧专题。

| 推荐板块 | 完整专题 | 题数 |
| --- | --- | ---: |
| 存储与文件系统 | [24LC256 存储机制](topics/24lc256-mechanisms.md) | 3 |
| 存储与文件系统 | [W25Q16JV 存储机制](topics/w25q16-mechanisms.md) | 9 |
| 通信协议 | [CAN 通用原理](topics/can-general.md) | 15 |
| 通信协议 | [I2C通用原理与事务](topics/general-i2c.md) | 17 |
| 通信协议 | [SPI通用原理与时序](topics/general-spi.md) | 9 |
| 通信协议 | [UART 通用原理](topics/UART通用原理.md) | 20 |
| C语言 | [C 语言数据与表示](topics/c-data.md) | 5 |
| MCU与外设原理 | [定时器通用原理](topics/定时器通用原理.md) | 13 |
| MCU与外设原理 | [时钟、复位与时钟树通用原理](topics/general-rcc.md) | 16 |
| MCU与外设原理 | [中断、事件与并发通用原理](topics/general-exti.md) | 11 |
| MCU与外设原理 | [ADC 通用原理](topics/general-adc.md) | 14 |
| MCU与外设原理 | [DMA通用原理与缓冲管理](topics/DMA通用原理与缓冲管理.md) | 13 |
| MCU与外设原理 | [GPIO 通用原理与分析](topics/general-gpio.md) | 14 |
| STM32 | [STM32F103C8T6 时钟机制与寄存器](topics/stm32f103c8-rcc.md) | 20 |
| STM32 | [STM32F103RCT6 定时器机制与寄存器](topics/STM32F103RCT6-定时器机制与寄存器.md) | 25 |
| STM32 | [STM32F103RCT6 ADC寄存器与机制](topics/stm32f103-adc.md) | 21 |
| STM32 | [STM32F103RCT6 CAN 寄存器与机制](topics/can-registers.md) | 21 |
| STM32 | [STM32F103RCT6 DMA机制与寄存器](topics/STM32F103RCT6-DMA机制与寄存器.md) | 16 |
| STM32 | [STM32F103RCT6 EXTI与NVIC机制](topics/stm32f103-exti.md) | 23 |
| STM32 | [STM32F103RCT6 GPIO机制与寄存器](topics/stm32f103-gpio.md) | 28 |
| STM32 | [STM32F103RCT6 I2C寄存器与状态机](topics/stm32f103-i2c.md) | 25 |
| STM32 | [STM32F103RCT6 SPI寄存器与机制](topics/stm32f103-spi.md) | 13 |
| STM32 | [STM32F103RCT6 USART机制与寄存器](topics/STM32F103RCT6-USART机制与寄存器.md) | 31 |

源条目去向：{"改写":302,"合并":261,"不纳入":32}；旧题身份处理：{"归档":276,"更新":143}。合并是多来源指向同一主要考点，不代表原题无说明丢弃。

题库以概念、原因、边界和轻量情境分析为主。芯片题在题干写明型号/外设，器件题明确器件与时序前提；不要求背诵HAL/SPL函数或结构体成员。寄存器位域计算给定必要布局；参考答案区提供核心回答、要点、易混点和来源。

来源保持理论整理边界；技术资料、AI核对、格式与程序运行分别证明对应事实，未代签用户逐题技术审阅、实验和硬件验证。软件仍离线、自评，不自动判分。
