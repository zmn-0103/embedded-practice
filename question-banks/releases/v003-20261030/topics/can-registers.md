---
schema_version: 1
topic_id: stm32f103-can
topic_title: STM32F103RCT6 CAN 寄存器与机制
---

## can-r-001 | 控制器与缓冲资源

标签：资源与队列, CAN, STM32F103RCT6, 寄存器
难度：基础

### 题目

适用芯片：STM32F103RCT6，CAN1（bxCAN）。一个控制器的 3 个发送邮箱和 2 个接收 FIFO 分别解决什么问题？是否代表 3 条独立 CAN 总线？

### 参考答案

**核心回答：** 三个发送邮箱容纳待发请求，两个接收 FIFO 分流接收消息；它们都属于同一个 CAN 控制器，不是多条总线。

#### 回答要点

该型号有一个 bxCAN、14 组过滤器，每个接收 FIFO 深度为 3 帧；发送仍须在同一总线上仲裁。

#### 易混点与适用边界

不能套用 F105/F107 的双 CAN 资源配置。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-002 | 时钟与引脚映射前提

标签：初始化, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。采用默认 PA11/PA12 或重映射 PB8/PB9 时，时钟、引脚方向和 AFIO 映射分别应核对什么？

### 参考答案

**核心回答：** CAN1 使用 APB1 时钟；GPIO/AFIO 使用 APB2 时钟。RX/TX 分别对应 PA11/PA12，重映射可选 PB8/PB9，TX 由外设复用输出驱动。

#### 回答要点

RX 按输入电路配置，核对 CAN_REMAP 和引脚占用；还需要外部收发器、电平与终端。

#### 易混点与适用边界

仅讨论本型号的这两组映射，不表示实际板卡已这样接线；不要求记忆任何库宏。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-003 | 控制位与管理策略

标签：寄存器, CAN, STM32F103RCT6
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。MCR 中 NART、TXFP、RFLM、ABOM、AWUM 分别控制哪类策略？为什么 NART=1 不能理解为允许重传？

### 参考答案

**核心回答：** 它们分别控制禁止自动重传、发送邮箱优先策略、接收 FIFO 锁定、自动 Bus-Off 管理和自动唤醒；NART=1 表示禁止自动重传。

#### 回答要点

TXFP 区分按请求顺序或标识符优先级；RFLM=1 时 FIFO 满会丢弃新消息，非锁定时可覆盖最后存入的消息。

#### 易混点与适用边界

策略位不会增加缓冲容量，也不能替代应用层超时和错误恢复决策。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-004 | 初始化请求与硬件确认

标签：状态机, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。配置位时序时，为什么既要改变 MCR.INRQ 又要检查 MSR.INAK？初始化成功是否证明外部通信正常？

### 参考答案

**核心回答：** INRQ 是软件请求，INAK 是硬件已进入相应状态的确认；应等进入初始化后修改位时序，再请求退出并等待确认。

#### 回答要点

SLEEP/SLAK 同样区分请求与确认。等待须有界；退出初始化还涉及总线隐性状态同步。外部收发器、引脚、终端和其他节点仍需验证。

#### 易混点与适用边界

不能以写入请求位代替硬件状态检查，也不能用单一初始化结果证明整条总线正常。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-005 | 自检与监听能证明什么

标签：工作模式, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。正常、环回、静默、静默环回各适合什么场景？内部环回通过能否证明线缆、收发器与 ACK 正常？

### 参考答案

**核心回答：** 正常模式参与总线收发；环回用于内部收发自检；静默用于不主动干扰总线的监听；静默环回用于隔离外部的内部自检。

#### 回答要点

环回主要验证控制器内部收发和过滤路径，不能证明外部物理链路或其他节点已接收。

#### 易混点与适用边界

模式由 BTR 的 LBKM/SILM 配置；不要求写库函数。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-006 | 提交发送与最终结果

标签：发送流程, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。已向空闲发送邮箱提交请求，为什么不能立即向应用报告发送成功？软件等待超时后还要处理什么？

### 参考答案

**核心回答：** 提交只是把帧交给控制器，最终可能成功、仲裁等待、错误或被中止；要针对该次请求检查最终状态。

#### 回答要点

轮询应有截止时间；超时不自动撤销硬件请求，需决定是否中止并确认结果，避免上层重发造成重复执行。

#### 易混点与适用边界

邮箱可被复用，必须把结果与具体请求关联。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-007 | 邮箱完成状态判读

标签：状态标志, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。TSR 的 TME、RQCP、TXOK、ALST、TERR 各表示什么？若 TME=1、RQCP=1、TXOK=0、ALST=1，可否判为成功？

### 参考答案

**核心回答：** 分别表示邮箱空、请求完成、成功、仲裁丢失和发送错误；给定组合不能判成功。

#### 回答要点

应结合 NART、是否中止及本次请求生命周期判断；完成不等于成功，空闲也不说明刚才的请求成功。

#### 易混点与适用边界

对 W1C 完成标志按手册清除，避免读改写意外清其他邮箱事件。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-008 | 接收数据与释放顺序

标签：接收流程, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1 FIFO0。直接读取输出邮箱后，应在何时置 RF0R.RFOM0？如果上层接收操作已经释放，为什么不能再次释放？

### 参考答案

**核心回答：** 先确认 FMP0 非零，再完整读取头部与有效数据，最后释放当前输出邮箱；重复释放可能丢掉下一条未读取消息。

#### 回答要点

RFOM0 是释放请求，FMP0 表示待处理数；消息所有权和释放责任应只由一个流程承担。

#### 易混点与适用边界

不假设某个库的接收操作是否自动释放，需核对它的契约；本题直接寄存器路径只释放一次。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-009 | 中断开关与处理时间

标签：中断, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。为什么外设 IER 中断源与 NVIC 通道都需要配置？接收处理过慢会发生什么？

### 参考答案

**核心回答：** 外设源决定是否产生请求，NVIC 决定内核是否受理相应通道；任一侧屏蔽都可能使预期处理不发生。

#### 回答要点

硬件 FIFO 容量有限，处理过慢会溢出；中断中及时取出消息，再由有界软件队列交给后续处理。

#### 易混点与适用边界

还需核对向量和共享中断分派，不能把所有未入中断都归咎于优先级。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-010 | 过滤器尺度与模式

标签：过滤器, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。每组过滤器在 16/32 位尺度、列表/屏蔽模式下分别能表达多少条规则？16 位尺度能完整精确匹配任意 29 位扩展 ID 吗？

### 参考答案

**核心回答：** 32 位列表容纳 2 个标识符，32 位屏蔽容纳 1 对 ID/Mask；16 位列表容纳 4 条，16 位屏蔽容纳 2 对。16 位尺度不能完整比较任意 29 位扩展 ID。

#### 回答要点

16 位表示只保留标准 ID、帧属性和部分扩展位；列表模式的各条目是独立标识符，屏蔽模式的半字按 ID/Mask 成对，它们不能拼成同一扩展 ID 的剩余部分。

#### 易混点与适用边界

具体有效位布局以 RM0008 过滤器映射图为准。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-011 | 精确过滤包含哪些字段

标签：过滤器, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1，32 位屏蔽过滤。给定位布局 STID[31:21]、IDE[2]、RTR[1]，只接收标准数据帧 ID=0x123，应如何构造 ID 和 Mask？

### 参考答案

**核心回答：** ID=0x123<<21=0x24600000；Mask=(0x7FF<<21)|0x6=0xFFE00006，比较全部标准 ID 以及 IDE/RTR。

#### 回答要点

屏蔽规则是 (接收字 & Mask)==(过滤字 & Mask)；Mask 为 1 的位置必须相同，0 表示不关心。

#### 易混点与适用边界

若只比较 ID 而忽略帧属性，不能声称精确限定标准数据帧。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-012 | 范围过滤的掩码推导

标签：过滤器, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1，32 位屏蔽模式。只接收标准数据帧 0x120～0x12F，已知标准 ID 置于过滤字[31:21]，IDE/RTR 置于[2:1]，应比较哪些位？

### 参考答案

**核心回答：** 低 4 个 ID 位不关心，高 7 个 ID 位必须一致；ID 字为 0x120<<21=0x24000000，Mask 为 (0x7F0<<21)|0x6=0xFE000006。

#### 回答要点

0x11F 和 0x130 的受比较高位不同，应被拒绝。

#### 易混点与适用边界

掩码只能直接表达特定二进制集合，任意连续区间不一定只用一条规则表示。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-013 | 待处理、满与溢出

标签：状态标志, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。接收 FIFO 的 FMP、FULL、FOVR 有什么区别？为什么 FIFO 满与已经丢帧不能混为一谈？

### 参考答案

**核心回答：** FMP 表示当前待处理消息数，FULL 表示达到满条件，FOVR 表示满后又有匹配消息到来造成溢出。

#### 回答要点

满时仍可能尚未丢数据；是否覆盖与 RFLM 策略有关。应分别记录消费不足和真实溢出。

#### 易混点与适用边界

各标志读写/清除语义不同，按手册处理，不能用清标志代替取走消息。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-014 | 错误状态与恢复控制

标签：错误处理, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。为什么判断 Bus-Off 应看 ESR.BOFF，而不能只看 TEC 显示值？MCR.ABOM 控制什么？

### 参考答案

**核心回答：** BOFF 明确指示 Bus-Off；ESR 提供的 TEC 字段只反映计数的一部分，不能单独覆盖所有状态。ABOM 控制自动启动 Bus-Off 恢复。

#### 回答要点

满足协议规定的恢复序列仍需时间；自动关闭时由软件按初始化请求流程管理恢复。恢复前应定位持续错误原因。

#### 易混点与适用边界

恢复不等于物理故障已消除；不能通过无限重初始化掩盖接线或位时序错误。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-015 | 寄存器地址布局阅读

标签：读寄存器, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。已给基址 0x40006400，BTR 偏移 0x01C；发送邮箱 0 起始偏移 0x180，邮箱步长 0x10；过滤器 0 的 FR1 偏移 0x240，组步长 8。求 BTR、邮箱 2 首寄存器、过滤组 5 的两个字地址，并说明它们职责。

### 参考答案

**核心回答：** 地址依次为 0x4000641C、0x400065A0、0x40006668 和 0x4000666C；分别属于位时序、发送邮箱头部、过滤器配置字。

#### 回答要点

地址=基址+对应偏移，过滤组第二字再加 4；先读手册布局，再结合寄存器职责解释。

#### 易混点与适用边界

题设给出布局，不要求死记地址；不能把发送邮箱步长套用到过滤器组。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-016 | 提交发送请求的最后一步

标签：寄存器, CAN, STM32F103RCT6
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。发送邮箱的 TIR、TDTR、TDLR、TDHR 各保存哪类信息？为什么应最后设置 TIR.TXRQ？

### 参考答案

**核心回答：** TIR 保存标识符、帧属性和请求位，TDTR 保存长度及相关控制，TDLR/TDHR 保存数据；最后置 TXRQ，避免硬件使用尚未写完整的帧。

#### 回答要点

先确认邮箱空，再设置格式、长度和数据，最后提交；标准/扩展 ID 按各自字段对齐。

#### 易混点与适用边界

提交期间应保证邮箱只有一个软件所有者，长度不得超过本控制器经典 CAN 的 8 字节能力。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-017 | 位时序编码与计算

标签：参数计算, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1，PCLK1=36 MHz。给定 BTR 的 BRP[9:0]、TS1[19:16]、TS2[22:20]、SJW[25:24] 都以实际值减一编码。选分频 12、BS1=9、BS2=2、SJW=1，求波特率和不含模式位的 BTR；再给出 125 kbit/s 的一组合法参数。

### 参考答案

**核心回答：** 第一组为 250 kbit/s，BTR=0x0018000B。第二组可选分频 18、BS1=13、BS2=2、SJW=1，对应 125 kbit/s，BTR=0x001C0011。

#### 回答要点

先按实际段长度算总 TQ，再将各实际参数减一放入字段；解并不唯一。

#### 易混点与适用边界

位时序还要满足控制器参数范围和实际总线传播条件。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-018 | 从位时序寄存器反推参数

标签：读寄存器, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1，PCLK1=36 MHz。已知 BTR=0x00180005；BRP[9:0]、TS1[19:16]、TS2[22:20]、SJW[25:24] 均为实际值减一。求实际参数、波特率和采样点。

### 参考答案

**核心回答：** 分频 6、BS1=9、BS2=2、SJW=1；总计 12 TQ，500 kbit/s，采样点约 83.3%。

#### 回答要点

字段还原后再计算，不把编码值直接代入位时间公式。

#### 易混点与适用边界

只按题设 PCLK1 计算，不默认外设时钟永远等于 36 MHz。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-019 | 过滤器配置的受控过程

标签：状态机, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。配置过滤器时，FMR、FM1R、FS1R、FFA1R、FA1R 分别承担什么职责？为什么需要先进入过滤器初始化并停用目标组？

### 参考答案

**核心回答：** 依次控制过滤器初始化、列表/屏蔽、尺度、FIFO 分配和激活；先在受控状态下配置，避免使用半更新规则。

#### 回答要点

FINIT=1，停用目标组，设置模式/尺度/FIFO 和 FR1/FR2，再激活目标组并退出 FINIT。

#### 易混点与适用边界

修改过滤配置可能影响接收，应由应用协调时机；不把它当成无影响的在线写字段。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-020 | 过滤命中索引的含义

标签：过滤器, CAN, STM32F103RCT6, 寄存器
难度：基础

### 题目

适用芯片：STM32F103RCT6，CAN1。接收头中的 FMI 是否就是过滤器组号？它与消息 CAN ID 有什么区别？

### 参考答案

**核心回答：** FMI 是命中过滤条目的索引，不等于消息标识符，也不总等于过滤器组号。

#### 回答要点

条目编号与模式、尺度和组配置有关；软件应按已配置的规则表解释它。

#### 易混点与适用边界

不要用 FMI 代替对实际 ID/IDE/RTR 的业务解析。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。

## can-r-021 | 错误中断的门控与定位

标签：中断, CAN, STM32F103RCT6, 寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6，CAN1。IER 中 ERRIE 与 EWGIE、EPVIE、BOFIE、LECIE 如何配合？ESR.LEC 适合用于什么，不能替代什么？

### 参考答案

**核心回答：** ERRIE 是错误中断总门控，具体错误事件还受对应源使能控制；LEC 提供最近错误类别供定位。

#### 回答要点

区分位、填充、格式、ACK、CRC 等错误，并结合 BOFF、计数、总线波形和应用日志判断。

#### 易混点与适用边界

LEC 是最近事件信息，不是累计错误次数，也不能仅凭一项就认定物理故障根因。

#### 来源

[ST RM0008：bxCAN 与相关外设章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST 官方 bxCAN 驱动：寄存器配置、收发与状态处理](https://github.com/STMicroelectronics/stm32f1xx-hal-driver/blob/master/Src/stm32f1xx_hal_can.c)；[ST STM32F103xE 设备头文件：适用高密度 F103 的寄存器定义](https://github.com/STMicroelectronics/cmsis-device-f1/blob/master/Include/stm32f103xe.h)。
