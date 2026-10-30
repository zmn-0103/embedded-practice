---
schema_version: 1
topic_id: general-exti
topic_title: 中断、事件与并发通用原理
---

## exti-general-001 | 轮询、中断与事件

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

轮询、中断和硬件事件通知各有什么特点，选择时如何权衡？

### 参考答案

**口述核心：** 轮询由软件主动检查，中断请求CPU执行处理，事件可通知硬件或用于唤醒而不一定进入ISR。

#### 回答要点

- 比较响应期限、事件速率、功耗、并发复杂度和可用硬件；轮询可能漏短脉冲，中断也可能因锁存与服务能力限制而合并事件。

#### 易错点与边界

不同平台的“事件”含义不同，应先确认硬件定义，不能仅凭名称推断行为。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-002 | 完整中断链路

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

一个外部信号到ISR处理完毕，需要经过哪些环节？“无中断”为什么不能只查ISR？

### 参考答案

**口述核心：** 需依次经过信号检测、外设请求、路由与仲裁、CPU响应、向量分派、处理及确认。

#### 回答要点

- 检查电气与输入配置、触发条件、源屏蔽、控制器和CPU掩码、优先级、向量表及处理后的清除语义。

#### 易错点与边界

某个平台可能合并或增设环节；应顺着真实硬件链路定位，不用软件调用成功代替状态证据。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第2题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-003 | 边沿触发与持续电平

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

边沿触发与电平触发有何区别？下降沿按键中断在持续按下时只出现一次，是否一定故障？

### 参考答案

**口述核心：** 边沿检测电平变化，持续低电平不再产生新的下降沿，因此只触发一次可能完全正常。

#### 回答要点

- 电平触发则由有效电平保持条件请求服务；仍应核对所用控制器是否支持该类型、触发方向、旧状态及实际波形。

#### 易错点与边界

机械抖动可能产生额外边沿；不能把理论一次边沿等同一次稳定按键事件。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第3题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-004 | 使能、挂起与活动

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

在支持挂起与活动状态的中断控制器中，使能、挂起、活动分别表示什么？是否互相排斥？

### 参考答案

**口述核心：** 使能表示允许参与响应，挂起表示有请求待处理，活动表示正在服务且尚未完成返回。

#### 回答要点

- 某源在服务期间可能再次挂起，因此活动与挂起可同时存在；禁用响应不一定清除已有请求。

#### 易错点与边界

具体状态转换和读写方式依架构而定，不把软件变量的状态模型直接当硬件规范。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第6题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-005 | 共享IRQ的完整分发

标签：EXTI, 通用原理, 情景分析
难度：进阶

### 题目

两个外设源共用IRQ且同时挂起，ISR只检查第一个源后返回，会有什么影响？如何设计分发与确认？

### 参考答案

**口述核心：** 共享入口应识别全部相关来源，并按各源语义处理和确认。

#### 回答要点

- 可用独立判断或有界循环分发；只服务一个来源可能造成其他源延迟、反复重入或饥饿。
- 清除时只确认已经处理且允许清除的源。

#### 易错点与边界

单次只处理一个不必然永久丢失，后果依锁存和重入规则而定；不能一概把所有if/else结构判为错误。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第9题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第18题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第13题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第21题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第24题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-006 | ISR工作量与阻塞

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

高频中断中加入1 ms忙等或执行依赖中断推进的阻塞等待，有什么风险？哪些工作应延后？

### 参考答案

**口述核心：** 长ISR增加响应延迟和CPU占用，某些依赖关系还可能导致无法完成等待。

#### 回答要点

- ISR适合记录必要状态、确认请求并通知后续处理；复杂解析、输出和慢操作可放主循环或任务。
- 必须估计执行时间与允许上下文。

#### 易错点与边界

并非所有短等待都绝对禁止，判断依据是真实上限、优先级关系和期限；不能仅凭API名判断安全。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第10题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第19题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第14题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-007 | volatile与共享数据竞争

标签：EXTI, 通用原理, 情景分析
难度：进阶

### 题目

ISR和主循环共享一个计数值，添加volatile能否保证自增、清零和读取之间不丢更新？

### 参考答案

**口述核心：** volatile不能保证复合操作原子性，也不能代替同步或队列。

#### 回答要点

- 识别谁读写及读改写边界，根据位宽、访问原子性和交互协议选择短临界区、原子操作或消息传递；临界区应正确保留原有屏蔽状态。

#### 易错点与边界

禁止CPU中断不等于暂停DMA或其他总线主设备，保护范围必须覆盖真实并发者。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第11题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第21题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-008 | 中断负载与最坏情况

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

某中断平均5000次每秒、每次平均占用10微秒。平均CPU占用约多少？这能证明不会丢事件吗？

### 参考答案

**口述核心：** 平均约5%，但这个均值不能证明最坏情况下不丢事件。

#### 回答要点

- 5000乘10微秒等于每秒50毫秒；还要检查突发速率、最大服务时间、被更高优先级阻塞的时间、缓冲深度和事件锁存能力。

#### 易错点与边界

测量窗口、嵌套与时间统计方法会影响结果；不能只用平均负载担保截止时间。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第12题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-009 | 低功耗唤醒与恢复

标签：EXTI, 通用原理, 故障排查
难度：综合

### 题目

为什么“CPU已被唤醒”不等于系统已恢复到睡眠前全部功能？串口唤醒后乱码应先查什么？

### 参考答案

**口述核心：** 低功耗可能改变时钟、电源域或外设状态，唤醒后需要按模式恢复运行条件。

#### 回答要点

- 区分保持上下文、停止时钟和复位式启动等模式；先确认系统和外设实际时钟、波特率及供电，再检查状态与初始化。

#### 易错点与边界

Sleep、Stop、Standby等名称及保留范围不能跨芯片机械套用；以具体模式的手册为准。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第14题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第20题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-010 | 中断次数与精确脉冲计数

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

为什么用ISR进入次数统计高速输入脉冲可能偏小？应考虑什么替代方案？

### 参考答案

**口述核心：** 多个输入可能被合并或来不及服务，ISR次数不一定等于物理脉冲数。

#### 回答要点

- 检查输入电气、锁存机制、最短间隔与最大阻塞；精确计数优先评估硬件计数器、输入捕获或DMA，并校核位宽、溢出与读取方式。

#### 易错点与边界

硬件路径也有频率和同步限制，不能在未核规格、未测量时宣称不会漏计。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第16题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第22题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。

## exti-general-011 | 单比特挂起位能保存多少信息

标签：EXTI, 通用原理, 概念题
难度：基础

### 题目

假设某事件状态只有一个挂起位，置位后在软件清除前又发生多个事件。能否由这一位恢复准确次数？

### 参考答案

**口述核心：** 不能，一个挂起位只表示至少发生过待处理事件，不是计数器。

#### 回答要点

- 重复事件可能仍表现为1；需要准确次数或顺序时，应选择硬件计数、捕获、FIFO或其他具有容量的记录路径。

#### 易错点与边界

此结论限定单比特锁存模型，不能推广到本身带计数器或FIFO的外设。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第5题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)。
