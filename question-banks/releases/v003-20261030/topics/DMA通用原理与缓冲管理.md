---
schema_version: 1
topic_id: general-dma
topic_title: DMA通用原理与缓冲管理
---

## dma-general-001 | DMA减少了哪部分CPU工作

标签：DMA, 通用原理, 数据管理
难度：基础

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

DMA的核心作用是什么？对比CPU逐项搬运和DMA搬运一个数据块的流程，它没有消除哪些开销？

### 参考答案

**口述核心：** DMA硬件代替CPU执行重复的数据读写，CPU主要负责配置、同步和后续处理。

#### 回答要点

CPU路径为读源再写目标并循环；DMA路径为配置、触发、硬件搬运、通知或查询完成。

#### 常见误区与边界

仍有总线争用、配置和中断开销，缓冲所有权、协议解析和错误恢复不会自动消失。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-003 | DMA工作的必要条件

标签：DMA, 通用原理, 数据管理
难度：基础

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

对于由外设提出请求的DMA，说明通道可工作的一般条件。为什么外设允许请求与通道使能是两个控制环节？

### 参考答案

**口述核心：** 资源时钟、请求路由、地址/方向/宽度/计数、合法内存和通道使能均需匹配。

#### 回答要点

外设必须产生并允许有效请求，DMA端也要就绪；使能其中一端不代表整条链路成立。

#### 常见误区与边界

寄存器和请求路由由芯片决定；内存到内存模式可能无需外设请求。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-004 | DMA的三类数据流

标签：DMA, 通用原理, 数据管理
难度：基础

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

列出外设到内存、内存到外设、内存到内存的应用，分别说明真正的源和目标。

### 参考答案

**口述核心：** 串口或ADC接收为外设到内存，串口发送为内存到外设，数组复制为内存到内存。

#### 回答要点

先确定数据流，再映射到控制器的端口命名和方向字段；源需可读、目标需可写。

#### 常见误区与边界

“外设端口”寄存器的名字不保证那端永远是源，内存复制也可能复用该端口。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-007 | DMA计数不动怎样定位

标签：DMA, 通用原理, 数据管理
难度：综合

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

外设DMA已配置且声称使能，但剩余计数一直不变。按资源、请求、通道、参数四层至少给出三项检查。

### 参考答案

**口述核心：** 查时钟与请求是否真实产生、路由和外设请求开关、通道状态及地址/方向/宽度/计数。

#### 回答要点

观察外设状态与输入波形；确认没有别的驱动重配通道；检查是否已经正常结束或发生错误。

#### 常见误区与边界

“初始化返回成功”不证明请求有效；暂停或重配可能造成数据空窗，测量需说明状态。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-008 | 串口接收的地址递增

标签：DMA, 通用原理, 数据管理
难度：基础

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

DMA把固定接收数据寄存器逐项写入连续数组。外设端和内存端各应怎样递增？配反可能怎样？

### 参考答案

**口述核心：** 外设端固定，内存端按元素递增。

#### 回答要点

外设端误递增会访问相邻寄存器；内存端固定会反复写同一位置；步长需与访问宽度匹配。

#### 常见误区与边界

硬件未报错不等于写入位置正确；是否越界或访问错误取决于具体地址空间。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-009 | 传输项数与字节数

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

DMA两端均按16位传输，要填满uint16_t数组200项，计数和总字节数多少？把计数误填400有什么风险？

### 参考答案

**口述核心：** 计数200项，共400字节；400项会尝试写800字节并越过该数组。

#### 回答要点

传输计数通常数数据项，不是统一数字节；按内存端访问宽度核算所需空间。

#### 常见误区与边界

若访问仍落在合法RAM，数组越界未必触发硬件错误；两端宽度不同时需核对控制器转换规则。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-010 | 自然对齐与数据宽度

标签：DMA, 通用原理, 数据管理
难度：基础

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

地址0x20000001、02、03、04分别满足8/16/32位自然对齐中的哪些？为什么宽度或对齐错误不一定都有错误标志？

### 参考答案

**口述核心：** 末位01/03只满足8位，02满足8/16位，04满足8/16/32位自然对齐。

#### 回答要点

16位按2字节对齐，32位按4字节对齐；错误地址可能仍能合法访问但落在错误位置或发生截断。

#### 常见误区与边界

具体未对齐行为由DMA和总线手册规定，不应主动依赖容错或假定必然置错误。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-011 | 单轮传输结束与重新启动

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

某DMA支持单轮模式，结束后不自动重装。再次搬运之前应如何处理上一轮数据、状态、计数和并发请求？

### 参考答案

**口述核心：** 先停止或协调新请求并禁用通道，处理旧数据和标志，重装计数/必要参数，再按依赖顺序开放通道与请求。

#### 回答要点

确认缓冲所有权和本轮身份；旧完成标志不能当作新一轮完成；允许外设暂停时控制重配空窗。

#### 常见误区与边界

完成后使能位是否自动清除由具体芯片规定；不能把单轮结束简单等同硬件已禁用。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-012 | 循环位置与回绕歧义

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

某循环DMA初始256项，每完成一项剩余计数减1，末尾自动重装。当前剩余96，逻辑写位置多少？和读位置相等时能否断言无新数据？

### 参考答案

**口述核心：** 写位置为(256-96) mod 256=160；相等可能为空，也可能已完整回绕。

#### 回答要点

需要累计进度或分半事件及可证明的服务时限；只看一次剩余计数不能知道绕过几圈。

#### 常见误区与边界

标志也可能合并多次事件；消费者长期跟不上时必须检测丢失，而非只扩大缓冲。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-013 | 分半处理的时间预算

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

DMA缓冲200项，按等分半区处理，数据率11520项/秒。半区多少项、多久填满？同时看到半完成和全完成一定是错误吗？

### 参考答案

**口述核心：** 半区100项，时间约8.681 ms；两种事件可在CPU晚响应时同时待处理。

#### 回答要点

分别处理事件并确认对应半区仍稳定；消费时间和最坏延迟要满足覆盖前期限。

#### 常见误区与边界

事件共存不自动证明数据未丢，也不必然代表传输错误；已覆盖的数据不能靠晚处理恢复。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-014 | 异步缓冲生命周期与一致性

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

把栈上局部数组交给异步DMA后立即返回，有何风险？volatile能否保证DMA与CPU不冲突？

### 参考答案

**口述核心：** 栈空间可在DMA完成前被复用；volatile不提供生命周期、互斥或一致快照保证。

#### 回答要点

缓冲必须活到传输完成并明确所有者；用稳定半区、双缓冲或暂停握手协调CPU消费。

#### 常见误区与边界

关CPU中断通常不会停止DMA；带数据缓存的芯片还需按缓存一致性规则处理。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-015 | 硬件错误与软件覆盖的证据

标签：DMA, 通用原理, 数据管理
难度：综合

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

DMA访问错误、外设接收溢出、软件缓冲覆盖分别如何发现？为什么一个DMA错误标志不能证明整条链路无错？

### 参考答案

**口述核心：** 分别看DMA错误状态、外设自己的接收状态，以及软件进度/序号/校验和与缓冲占用。

#### 回答要点

保存时间和计数快照，压力下对照生产与消费；错误恢复应按消息协议重新同步。

#### 常见误区与边界

合法地址内的数组越界、消费者落后、协议错通常不等同DMA总线访问错误。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。

## dma-general-016 | 串口循环缓冲容量预算

标签：DMA, 通用原理, 数据管理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；控制器行为与传输参数按题设，具体寄存器另查对应芯片。

115200 baud、8N1、无额外间隔，每项1字节。256字节循环缓冲理论多久写满？这对最长消费延迟有什么要求？

### 参考答案

**口述核心：** 速率11520字节/秒，写满约22.222 ms；消费与调度必须在覆盖前完成并留余量。

#### 回答要点

若分成128字节半区，每半约11.111 ms；结合最坏延迟评估，不能只看平均速度。

#### 常见误区与边界

流控和实际到达模式会改变负荷；理论时间不是已测实时保证。

#### 依据

[ST DMA功能介绍](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_DMA)；[RM0008：DMA的一种具体实现，映射和使能细节不作通用保证](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。
