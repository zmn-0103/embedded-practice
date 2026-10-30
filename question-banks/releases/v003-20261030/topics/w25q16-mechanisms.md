---
schema_version: 1
topic_id: w25q16-spi-nor
topic_title: W25Q16JV 存储机制
---

## spi1-022 | 识别器件的完整事务

标签：SPI, NOR, 事务分析
难度：基础

### 题目

适用器件：Winbond W25Q16JV，标准单线 SPI，已知读取 JEDEC ID 的命令为 0x9F。为什么发送命令后还要继续提供时钟？应从哪个阶段提取 ID？

### 参考答案

**核心回答：** 命令之后继续提供时钟，器件才把 ID 位移出；命令阶段同时收到的内容不能当作第一个 ID 字节。

#### 回答要点

保持片选有效完成命令和后续响应，再按器件时序结束；读回厂商/类型/容量等字节，与所指定完整型号比对。

#### 易混点与适用边界

占位发送用于产生接收时钟，不表示把占位值写入存储阵列；ID 正常也不能证明所有存储操作正确。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-013 | 总线地址与字节顺序

标签：SPI, NOR, 地址
难度：进阶

### 题目

适用器件：Winbond W25Q16JV，标准单线 SPI。给定普通读取命令 0x03、24 位地址、地址高字节先传，目标地址 0x001000。命令后应发送什么地址字节？普通读是否额外插入快速读的 dummy 周期？

### 参考答案

**核心回答：** 依次发送 00、10、00，再为数据提供时钟；本题普通 0x03 读不插入快速读命令要求的额外 dummy 周期。

#### 回答要点

地址宽度和顺序属于器件命令协议，不能按 CPU 内存小端布局直接传地址对象。

#### 易混点与适用边界

其他指令和器件可能有不同地址宽度、等待周期与总线位宽。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-014 | 写使能与可编程条件

标签：NOR, 写使能, 状态标志
难度：基础

### 题目

适用器件：Winbond W25Q16JV。已知 WEL 是写使能锁存、BUSY 是内部操作忙标志。为什么设置 WEL 后仍不能保证页编程一定成功？

### 参考答案

**核心回答：** WEL 只是允许接受相关写操作的必要条件之一；器件还要就绪、目标未受保护、地址和长度合法，并满足命令时序。

#### 回答要点

写使能与页编程是独立命令事务；每次新的编程/擦除应按手册重新处理 WEL，并等待完成后回读验证。

#### 易混点与适用边界

WEL 有效不表示内部写入完成，也不表示数据已经校验正确。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-016 | 页边界与写入拆分

标签：NOR, 页边界, 参数计算
难度：进阶

### 题目

适用器件：Winbond W25Q16JV，256 字节页，目标单元已擦除且未受保护。从地址 0x0010F0 连续编程 32 字节，为什么不能用一次普通页编程跨越页尾？应如何拆分？

### 参考答案

**核心回答：** 当前页剩 16 字节，应先写 16 字节，再从 0x001100 写后 16 字节；一次页编程越界会在当前页内回绕。

#### 回答要点

每段各自完成写使能、页编程、结束片选及等待内部就绪，不能把两段继续放在同一页编程事务里。

#### 易混点与适用边界

拆页不等于自动擦除，必须同时检查总容量、保护范围和原数据。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-017 | 控制器完成与器件完成

标签：SPI, NOR, 状态辨析
难度：进阶

### 题目

适用芯片：STM32F103RCT6 SPI1；外部器件：Winbond W25Q16JV。SPI_SR.BSY 已清零，能否认为 Flash 页编程也已完成？

### 参考答案

**核心回答：** 不能。BSY 反映 MCU 串行传输活动，Flash BUSY 反映器件内部编程/擦除，两者属于不同状态机。

#### 回答要点

按 MCU 传输结束条件结束片选，再按器件状态寄存器轮询内部忙，设置适合该操作的截止时间，最终回读比较。

#### 易混点与适用边界

不把 TXE、DMA 搬运完成、串行移位完成和非易失写完成混成同一个阶段。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-023 | 编程过程与数据正确性

标签：NOR, 写入流程
难度：进阶

### 题目

适用器件：Winbond W25Q16JV，标准 SPI。给定需要在已授权区域更新数据，为什么完成一次页编程事务后还需要等待和回读？如果原位需要从 0 改为 1，又应考虑什么？

### 参考答案

**核心回答：** 事务结束只是启动内部编程；等 BUSY 清除后回读才能检查结果。NOR 编程通常使 1 变 0，0 变 1 要通过擦除。

#### 回答要点

按页分段、每次写使能、等待完成；擦除按扇区等粒度进行，更新前要处理同一擦除单元内其他有效数据。

#### 易混点与适用边界

这里只分析流程，不授权操作真实存储；掉电一致性、寿命和错误恢复需另行设计。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi1-026 | 回读不一致的分层分析

标签：NOR, 故障分析
难度：综合

### 题目

适用器件：Winbond W25Q16JV，已知参考流程为标准 SPI 读取/页编程。写后回读不一致时，如何区分总线传输、命令协议和内部存储操作问题？

### 参考答案

**核心回答：** 先检查电源、接线、片选和采样时序，再核对命令、地址、长度与字节对齐，最后检查写使能、保护、忙状态、页边界和擦除条件。

#### 回答要点

用读 ID/状态缩小范围，抓取完整事务并与数据手册对照，在明确可覆盖区域做最小复现并逐字节比较。

#### 易混点与适用边界

全 0、全 1 或错位都不是单一故障的充分证据；给定信息不足时保留多个假设。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi2-016 | 三种使能的职责

标签：STM32F103RCT6, NOR, 初始化
难度：进阶

### 题目

适用芯片：STM32F103RCT6 SPI1；器件：Winbond W25Q16JV。已知 RCC 的 SPI1EN 控制外设时钟，SPI_CR1.SPE 控制 SPI 外设运行，Flash WEL 控制写许可。为什么三者不能相互替代？

### 参考答案

**核心回答：** 三者分别作用于 MCU 时钟、MCU 串行状态机、外部器件写权限；任意一个有效都不能推导其余两个已满足。

#### 回答要点

完整配置仍需引脚、模式、频率、片选和器件就绪；分层检查可以定位初始化与写入失败的阶段。

#### 易混点与适用边界

题设给出各位含义，不考库 API 或指令编码背诵。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。

## spi2-023 | 片选与命令执行边界

标签：NOR, 事务分析
难度：进阶

### 题目

适用器件：Winbond W25Q16JV，标准 SPI 页编程。为什么命令、地址和数据要在同一次有效片选内完成，而写使能应作为另一笔事务？何时开始内部编程？

### 参考答案

**核心回答：** 片选界定该器件的一条命令；页编程的命令、地址和数据应连续处于有效片选中，写使能另行完成，页编程事务正确结束并拉高片选后才启动内部操作。

#### 回答要点

满足片选建立/保持时间和完整字节时钟；过早结束会截断命令，长时间保持又可能没有触发内部执行。

#### 易混点与适用边界

这是所指定器件的协议，不是所有 SPI 从机共有的命令规则。

#### 来源

[Winbond W25Q16JV：§7状态寄存器，§8标准SPI指令与页编程](https://www.winbond.com/resource-files/w25q16jv%20spi%20revd%2008122016.pdf)；[ST 官方 F1 SPI 实现：传输状态与结束条件](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_spi.c)。
