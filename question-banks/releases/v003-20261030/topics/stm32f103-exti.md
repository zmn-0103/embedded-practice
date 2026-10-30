---
schema_version: 1
topic_id: stm32f103-exti
topic_title: STM32F103RCT6 EXTI与NVIC机制
---

## exti-f103-001 | EXTI寄存器职责与布局

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

EXTI的六个主要寄存器及偏移各是什么？怎样按检测、屏蔽和挂起职责分类？

### 参考答案

**口述核心：** IMR/EMR控制请求通路，RTSR/FTSR选择边沿，SWIER产生软件请求，PR保存挂起状态。

#### 回答要点

- 基址为0x40010400；偏移依次为IMR 0x00、EMR 0x04、RTSR 0x08、FTSR 0x0C、SWIER 0x10、PR 0x14。

#### 易错点与边界

地址与布局只用于题设型号；使用前需核对访问语义，尤其PR不是普通读写变量。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-002 | 中断屏蔽与事件屏蔽

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

IMR和EMR分别控制什么？硬件能否同时允许同一线路的中断与事件？

### 参考答案

**口述核心：** IMR控制中断请求，EMR控制事件请求，两条通路可按硬件规则分别配置。

#### 回答要点

- 它们不等于NVIC使能；RTSR/FTSR还负责检测边沿。
- 配置某通路时应检查是否意外覆盖另一通路或其他线路。

#### 易错点与边界

事件请求不等同CPU进入ISR；唤醒行为还需结合CPU和低功耗模式。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第2题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-003 | 触发方向与端口冲突

标签：EXTI, STM32F103RCT6, 情景分析, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

RTSR和FTSR控制什么？低电平有效按键应怎样确定边沿？配置双边沿能否解决PA7与PB7共用EXTI7？

### 参考答案

**口述核心：** RTSR选上升沿、FTSR选下降沿；方向由电路与需要检测的动作决定，双边沿不能解决来源映射冲突。

#### 回答要点

- 上拉接地按键按下通常产生下降沿、释放产生上升沿；EXTI7仍只能选定一个端口来源。

#### 易错点与边界

机械抖动可能产生多个边沿；不能仅因“低有效”就忽略释放事件和电气条件。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第3题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第9题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-004 | PR写1清除与事件合并

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

PR怎样清除？若线路5、6都挂起，只处理线路5后读PR再按位或bit5写回，有何风险？PR能保存准确事件次数吗？

### 参考答案

**口述核心：** PR对应位写1清除、写0不影响；读改写可能把未处理的线路6一起清掉。

#### 回答要点

- 应只对已经处理且准备确认的位写1；PR是挂起锁存，重复边沿可能合并，不能当计数器。
- 应结合事件源特点安排处理与确认时机。

#### 易错点与边界

W1C规则不是所有寄存器通用规则；清除与新事件同时发生的边界仍需按手册和时序设计。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第4题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第5题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第8题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第8题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-005 | 软件线路请求与NVIC挂起

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

线路和NVIC均已正确配置并允许请求。通过SWIER产生软件请求，与仅设置NVIC挂起有什么区别？为什么后者ISR内可能看不到PR？

### 参考答案

**口述核心：** SWIER走EXTI线路请求路径，仅置NVIC挂起不必产生EXTI_PR来源。

#### 回答要点

- 前者会按规定形成线路挂起，清PR也清相应SWIER状态；后者直接作用于中断控制器，ISR仍应区分真正外设来源。

#### 易错点与边界

不要把两种软件刺激当成同等的端到端测试；具体重复软件触发要遵守SWIER状态转换规则。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第6题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第25题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第15题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第22题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-006 | EXTI线路与保留位

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

EXTI的0至18号线路与更高保留位如何区分？是不是每一位都能连接GPIO？

### 参考答案

**口述核心：** 0至15用于GPIO编号映射，16至18连接特定内部来源，不能把保留位当可用线路。

#### 回答要点

- 该型号内部线路对应PVD、RTC闹钟和USB唤醒；GPIO端口选择通过AFIO配置，只针对0至15。

#### 易错点与边界

不同F1型号可能具有不同内部线路集合，不能把其他型号的bit19功能套入RCT6。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第7题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-007 | AFIO映射规则与字段计算

标签：EXTI, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

同编号的PA7和PB7能否同时映射到EXTI7？EXTICR怎样定位字段？以PB7和EXTI12说明。

### 参考答案

**口述核心：** 同一EXTIn一次只能选一个端口；四个EXTICR各管理四条GPIO线路。

#### 回答要点

- 寄存器数组索引为n除4取整，移位为4乘(n模4)。
- PB7使用EXTICR2[15:12]写端口编码0001；EXTI12使用EXTICR4[3:0]。
- 端口编码0000至0110对应A至G。

#### 易错点与边界

编码表不表示每个端口都在RCT6封装引出；双边沿也不能让同一线路同时选择两个端口。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第9题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第10题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第11题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第12题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第13题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-008 | 线路编号与位掩码

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

线路编号12与选择线路12的位掩码0x1000有什么区别？为什么不能把两者混用于寄存器字段选择和线路屏蔽？

### 参考答案

**口述核心：** 编号表示索引，掩码表示对应位集合，两者数值和用途不同。

#### 回答要点

- 根据编号计算EXTICR中的索引与字段移位；IMR或PR等单比特线路寄存器使用1U左移12的掩码。
- 必须先确定目标布局。

#### 易错点与边界

不能因某个库参数接受整数就随意互换；本题考索引和位集合概念，不要求记库常量名称。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第2题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-009 | GPIO与AFIO时钟

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

配置GPIO外部中断来源前，为什么要同时考虑GPIO端口和AFIO时钟？

### 参考答案

**口述核心：** GPIO时钟用于输入配置，AFIO时钟用于端口到EXTI线路的映射配置。

#### 回答要点

- 两者都在相应RCC门控中核对；线路触发、屏蔽和NVIC还需另行配置。
- 打开AFIO不等于输入模式已经正确。

#### 易错点与边界

不把其他系列使用SYSCFG的配置方式照搬到本型号。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第3题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-010 | 不依赖库的外部中断配置链

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

为某GPIO设置外部边沿中断，不写函数调用，按硬件层次描述配置与启用顺序。

### 参考答案

**口述核心：** 先建立正确输入与映射，再设置边沿和请求通路，处理旧挂起后配置并启用CPU响应。

#### 回答要点

- 核对电气与偏置；使能GPIO/AFIO时钟并设置输入；选择EXTI端口；配置RTSR/FTSR、IMR；按策略清旧PR；设置NVIC优先级与向量后开启响应。

#### 易错点与边界

启用过程可能出现新事件，应按应用要求设计竞态窗口；不要以一条固定顺序替代所有场景分析。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第4题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-011 | EXTI12的共享IRQ

标签：EXTI, STM32F103RCT6, 情景分析, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

EXTI12对应哪个IRQ入口？同组线路能否分别拥有独立NVIC硬件优先级？

### 参考答案

**口述核心：** EXTI12进入EXTI15_10共享IRQ，NVIC优先级针对整个IRQ而不是每条组内线路。

#### 回答要点

- ISR需要检查组内具体PR与使能状态再分发；EXTI5至9同样共用另一组入口。

#### 易错点与边界

软件可以安排组内服务顺序，但这不等于为每条线路设置独立硬件抢占级。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第10题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-012 | 双边沿后能否判断历史方向

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

同一EXTI线路使能上升、下降双边沿。只看到PR为1，能否确定造成挂起的边沿方向？读取当前输入是否能完整还原历史？

### 参考答案

**口述核心：** 不能仅凭单个PR位确定历史方向，当前输入只能反映读取时刻的状态。

#### 回答要点

- 期间可能出现多个边沿、延迟或抖动，方向信息已合并；需要精确历史时可评估输入捕获或其他硬件记录。

#### 易错点与边界

在受限条件下可结合先前状态推断，但必须说明最大事件率与延迟假设，不能当普遍保证。

#### 来源与适用条件

原始资料：30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第4题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-013 | NVIC寄存器与外设挂起

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

ISER、ICER、ISPR、ICPR、IPR分别负责什么？禁用NVIC或清NVIC挂起，是否等于清除EXTI_PR？

### 参考答案

**口述核心：** 它们分别用于使能、禁用、置挂起、清挂起和设置优先级；NVIC状态与EXTI源状态不同。

#### 回答要点

- 禁用响应不会自动确认外设事件；外设请求未消除时，单清NVIC挂起可能再次形成请求。
- 应查源状态及规定确认顺序。

#### 易错点与边界

不要把CPU屏蔽、NVIC禁用和外设线路屏蔽视为同一个开关。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第14题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第7题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-014 | IRQ编号定位到ISER

标签：EXTI, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

外部IRQ编号为40时，对应ISER数组哪个元素、哪一位？

### 参考答案

**口述核心：** 元素索引为1，位号为8，即40除32取整和40模32。

#### 回答要点

- 向对应ISER位写1使能该IRQ，不能把异常号56拿来当外部IRQ编号计算ISER位置。

#### 易错点与边界

本题区分中断号和异常号，不要求记忆库函数；实际操作还需正确权限和寄存器访问语义。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第15题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-015 | 有效优先级位与抢占

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

该型号Cortex-M3的NVIC优先级寄存器实现哪些位？数值、抢占级和子优先级怎样影响嵌套？提高优先级能否解决全部漏事件？

### 参考答案

**口述核心：** 每个优先级字节实现高4位，编码数值越小优先级越高；抢占关系还取决于分组。

#### 回答要点

- 抢占级决定能否抢占，子优先级用于同抢占级挂起请求的仲裁。
- 提高优先级可能改善等待，但不能增加单比特锁存容量或消除过长处理。

#### 易错点与边界

这些数值规则限定该Cortex-M3实现，不写成所有MCU通用规律。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第16题；30-EXTI/00-通用知识/EXTI 通用知识 自测题.md 第15题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-016 | 优先级字节编码

标签：EXTI, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

明确将4个有效优先级位分为2位抢占与2位子优先级。抢占值1、子优先级值2，对应IPR字节是多少？

### 参考答案

**口述核心：** 有效4位值为0110，放在字节高4位后为0x60。

#### 回答要点

- 先计算1乘4加2等于6，再左移4位；分组设置必须与此解释一致。

#### 易错点与边界

不直接使用有歧义的“分组2”名称，也不能把0x60再次交给预期未移位值的接口。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-017 | 向量表、异常号与VTOR

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

对外部IRQ40，异常号与向量表入口偏移是多少？VTOR重定位改变的是什么？

### 参考答案

**口述核心：** 异常号为56，入口偏移为56乘4即0xE0；VTOR给出向量表基址。

#### 回答要点

- 外部IRQ号需加16，再加到正确对齐的向量表基址；表项保存处理入口，表项地址与处理函数地址不是同一个量。

#### 易错点与边界

这条换算只用于外部IRQ；核心异常有自身编号规则，重定位还需保持有效向量与芯片对齐要求。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第18题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第19题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第12题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-018 | PWR控制与低功耗状态

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

PWR_CR和PWR_CSR在低功耗配置中各承担什么职责？为什么不能只看一个休眠指令？

### 参考答案

**口述核心：** CR负责模式及控制选择，CSR反映相关状态和唤醒配置，CPU休眠控制还涉及SCB。

#### 回答要点

- 结合PDDS、LPDS、唤醒/待机状态及需要的唤醒源，核对Sleep、Stop、Standby的供电、时钟和上下文保留。

#### 易错点与边界

不是所有模式都保留相同RAM与外设状态；清标志和使能唤醒需遵守各字段的访问语义。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第20题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-019 | WFI、WFE与Stop后恢复

标签：EXTI, STM32F103RCT6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103RCT6。

WFI与WFE关注的通知路径有什么区别？Stop唤醒后为什么不能立即假定原PLL、串口与时基均已恢复？

### 参考答案

**口述核心：** WFI等待中断类唤醒条件，WFE等待事件；具体条件还受CPU状态与配置影响。

#### 回答要点

- EXTI的IMR和EMR控制相应请求路径，仍需结合CPU掩码、事件状态、SEVONPEND和低功耗模式判定。
- 唤醒后读回实际时钟，按需求恢复PLL、分频、外设时钟与时基。

#### 易错点与边界

不能简化为“开了NVIC就一定唤醒”或“WFE只看EMR”；完整掩码组合依PM0056及RM0008，需对具体配置验证。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第21题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第26题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第18题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-020 | PR、IMR与NVIC的分层判断

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

不考虑软件强制NVIC挂起或其他同组源。线路PR为1时，若IMR为0，或IMR为1但NVIC禁用，CPU会因此进入ISR吗？

### 参考答案

**口述核心：** 都不会因该线路的正常请求进入ISR，但线路挂起状态可能仍存在。

#### 回答要点

- 第一种在EXTI请求路径被屏蔽，第二种在NVIC响应层被禁用；还需考虑CPU全局掩码、优先级与向量。
- 读取PR不是完整的“CPU可响应”判定。

#### 易错点与边界

同组其他来源或软件直接挂起可能使共享ISR进入，进入ISR也不证明该线路是来源。

#### 来源与适用条件

原始资料：30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第22题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第23题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第11题；30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-021 | 软件触发测试能证明什么

标签：EXTI, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

通过软件让EXTI产生请求并成功进入ISR，可以验证哪些路径？还不能证明哪些硬件条件？

### 参考答案

**口述核心：** 可验证被实际经过的软件请求、控制器响应、向量与ISR处理路径，不能验证外部引脚全过程。

#### 回答要点

- 仍需测实际电平、输入配置、AFIO映射、真实边沿和抖动；不同软件触发位置覆盖的上游链路也不同。

#### 易错点与边界

测试结论应列出具体触发点，不能把仅置NVIC挂起的结果称为外部中断全链路通过。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第16题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-022 | 按键不进ISR的分层排查

标签：EXTI, STM32F103RCT6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103RCT6。

按键有动作却不进ISR，沿电气到CPU响应依次应检查哪些证据？

### 参考答案

**口述核心：** 按电气、GPIO、时钟、AFIO映射、边沿、PR/IMR、NVIC与向量逐层查找请求在哪一层消失。

#### 回答要点

- 先测输入波形与读回输入，再查时钟和映射；观察PR是否置位、IMR是否放行，之后查NVIC使能、优先级、CPU掩码及实际向量入口。

#### 易错点与边界

不要一开始反复修改所有配置；软件触发可分段定位，但不能替代输入侧验证。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第19题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## exti-f103-023 | 只触发一次与反复重入

标签：EXTI, STM32F103RCT6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103RCT6。

EXTI发生一次后不再进入，或ISR反复重入，应分别怎样分析？持续低电平本身是否会反复产生下降沿请求？

### 参考答案

**口述核心：** 先区分没有新边沿、请求被屏蔽，以及旧挂起未正确确认；持续低本身不产生新的下降沿。

#### 回答要点

- 一次后不再进入可查后续边沿、屏蔽与向量；反复重入可查PR写1清除、清错位、共享源遗漏、抖动和真实新边沿。

#### 易错点与边界

F103 GPIO EXTI按边沿检测，不能把别种控制器的电平触发结论直接套入；清挂起时还需防止漏掉未处理源。

#### 来源与适用条件

原始资料：30-EXTI/第一层-库函数/EXTI 第一层 库函数 自测题.md 第20题；30-EXTI/第二层-寄存器/EXTI 第二层 寄存器 自测题.md 第27题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST PM0056：Cortex-M3异常、NVIC与休眠](https://www.st.com/resource/en/programming_manual/cd00228163-stm32f10xxx20xxx21xxxl1xxxx-cortexm3-programming-manual-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。
