---
schema_version: 1
topic_id: general-rcc
topic_title: 时钟、复位与时钟树通用原理
---

## rcc-general-001 | 时钟频率与指令时间

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

时钟频率和周期是什么关系？一个时钟周期是否等于一条指令执行时间？

### 参考答案

**口述核心：** 周期T与频率f互为倒数，一条指令耗时不能仅由主频推断。

#### 回答要点

- 执行时间还受指令种类、流水线、访存等待、总线争用和实现结构影响；应区分时钟周期、指令吞吐和任务耗时。

#### 易错点与边界

不能把同主频视为同性能，具体结论需结合处理器和存储器配置。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-002 | 有时钟为何还不能工作

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

某外设已开启时钟却不工作，应如何继续检查？

### 参考答案

**口述核心：** 还需检查复位状态、功能使能、参数、通道与引脚映射以及外部电路。

#### 回答要点

- 时钟提供运行节拍，不自动启动功能。
- 沿输入源、内部配置、输出通道和外部连接逐层验证，避免反复只改门控。

#### 易错点与边界

具体检查项随外设变化；成功写入配置也不证明外围电路正确。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第2题；20-RCC/00-通用知识/RCC 通用知识 自测题.md 第18题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第24题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-003 | 内部RC与外部晶体

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

内部RC振荡器和外部晶体方案各有哪些常见取舍？

### 参考答案

**口述核心：** 通常内部RC成本低、启动方便，外部晶体可提供更好的频率精度与稳定性。

#### 回答要点

- 比较精度、温漂、启动时间、功耗、成本和布线；某些内部源支持校准，外部晶体也受负载电容和环境影响。

#### 易错点与边界

不能无条件认定外部一定更准或内部一定更省电，须看对应器件指标与应用要求。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第3题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-004 | PLL的参考源与倍频

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

PLL是不是独立时钟源？它怎样得到高于参考输入的频率？

### 参考答案

**口述核心：** PLL依靠参考时钟与反馈控制形成锁定输出，倍频不等于独立产生可靠时基。

#### 回答要点

- 参考源、输入输出范围、分频与倍频共同决定工作条件；启用后还需等待锁定并检查实际选择。

#### 易错点与边界

输出受参考源与PLL自身特性影响，不把使能命令当作已锁定。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第4题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-005 | 倍频后的相对误差

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

8 MHz参考源精度为正负100 ppm，理想倍频9得到72 MHz。忽略PLL附加误差，输出相对与绝对频率误差各是多少？

### 参考答案

**口述核心：** 相对误差仍约正负100 ppm，72 MHz对应绝对误差约正负7.2 kHz。

#### 回答要点

- 倍频同比放大频率和绝对偏差，不能自行改善参考源的相对精度。
- 实际还需区分长期频偏、短期抖动与PLL附加噪声。

#### 易错点与边界

本计算忽略PLL自身误差，不把ppm精度等同边沿抖动指标。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第5题；20-RCC/00-通用知识/RCC 通用知识 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-006 | 使能与就绪状态

标签：RCC, 通用原理, 概念题
难度：进阶

### 题目

为什么开启一个时钟源后，不能立即假定输出已经稳定？

### 参考答案

**口述核心：** 使能是软件请求，就绪或锁定状态表示硬件达到可使用条件。

#### 回答要点

- 晶振需要起振、PLL需要锁定；应按手册等待并设置有界超时，失败进入可诊断的处理路径。

#### 易错点与边界

就绪判断要使用规定状态，不能用固定短延时或仅看控制位替代。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第6题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-007 | 时钟请求与实际生效

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

为什么时钟选择请求和实际使用状态需要分别读取？

### 参考答案

**口述核心：** 硬件切换可能尚未完成或受条件限制，请求值不保证已经生效。

#### 回答要点

- 写入后按规定检查实际状态，结合源就绪与分频计算当前时钟；超时保留错误原因并走安全路径。

#### 易错点与边界

软件缓存变量和配置意图也不等于物理测量结果。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第7题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-008 | 门控、功能使能与复位

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

时钟门控、外设内部功能使能和外设复位分别控制什么？能否相互替代？

### 参考答案

**口述核心：** 门控控制时钟供应，功能使能控制工作行为，复位恢复特定状态，三者职责不同。

#### 回答要点

- 例如给串行外设时钟后仍需开启收发；复位可能清除配置，需要重新初始化。
- 关闭门控通常也不等于执行复位。

#### 易错点与边界

具体复位范围与保留内容由芯片定义，不能推断所有寄存器都会被任意复位源清除。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第8题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第16题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-009 | 总线频率与通信速率

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

片上总线频率是否等于外设的对外通信速率？

### 参考答案

**口述核心：** 不是，对外速率还由外设时钟来源、分频和协议规则决定。

#### 回答要点

- 需要先沿时钟树得到外设内核时钟，再按外设公式计算波特率或位时钟，并满足外部器件和电气时序限制。

#### 易错点与边界

部分芯片外设可用独立时钟源，不能仅看所在总线名称推断速率。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第9题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-010 | 升降频与存储器等待周期

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

若要提高系统时钟，Flash等待周期应在升频前还是后调整？降频时呢？

### 参考答案

**口述核心：** 在手册要求需要增加等待时，应先增加等待周期再升频；降频生效后再降低等待周期。

#### 回答要点

- 存储器响应速度有限，频率升高却保持不足等待可能造成取指或访问失败；还需核对供电电压、预取和总线限制。

#### 易错点与边界

具体阈值并非所有芯片相同；不能把24到72 MHz等数字脱离芯片手册当通用规则。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第10题；20-RCC/00-通用知识/RCC 通用知识 自测题.md 第19题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-011 | 复位原因的保留与排查

标签：RCC, 通用原理, 故障排查
难度：综合

### 题目

为什么启动早期要先记录复位原因再清标志？应区分哪些类型的复位？

### 参考答案

**口述核心：** 先记录才能保留上电、外部引脚、软件、看门狗等复位线索。

#### 回答要点

- 区分系统复位、外设复位和备份域复位的影响范围；结合启动日志、电源与复位路径分析，记录后再按策略清除标志。

#### 易错点与边界

多个标志可能并存，未必能单独确定唯一根因；不是所有器件都提供相同标志集合。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第11题；20-RCC/00-通用知识/RCC 通用知识 自测题.md 第20题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-012 | 备份域与掉电保持

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

备份域通常承担什么功能？主电源断开后RTC和数据一定仍保留吗？

### 参考答案

**口述核心：** 备份域常用于RTC及备份状态，掉电保持依赖备用供电和具体存储结构。

#### 回答要点

- 核对VBAT、主电源切换、允许保留的寄存器和复位范围；没有合格备用电源不能假定仍计时或保留全部状态。

#### 易错点与边界

备份寄存器不等同任意断电不丢的非易失存储，须按型号说明。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第12题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-013 | RTC常用32.768kHz的原因

标签：RCC, 通用原理, 概念题
难度：基础

### 题目

为什么实时时钟常使用32.768 kHz时钟？是否意味着RTC只能使用该频率？

### 参考答案

**口述核心：** 32768等于2的15次方，便于通过二进制分频获得1 Hz。

#### 回答要点

- 低频也利于某些低功耗时钟方案；具体RTC可以支持哪些源、精度和校准能力仍取决于器件。

#### 易错点与边界

这不是所有RTC的强制唯一频率，也不保证一秒误差为零。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第13题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-014 | 时钟源故障与有界等待

标签：RCC, 通用原理, 故障排查
难度：综合

### 题目

外部时钟起振超时或运行中失效，软件应遵循怎样的处理思路？

### 参考答案

**口述核心：** 停止依赖失败源继续推进，按硬件支持选择可用备用源或进入安全状态并记录原因。

#### 回答要点

- 先确认备用源可用，按规定完成或确认自动回退，再处理失效源；更新相关时序配置并保留诊断信息。
- 等待应有超时。

#### 易错点与边界

并非所有系统都允许在线回退；处置顺序与安全状态必须满足真实硬件及业务要求。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第14题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第3题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第23题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-015 | 时钟配置如何验证

标签：RCC, 通用原理, 情景分析
难度：进阶

### 题目

如何验证时钟配置？寄存器读回、软件计算和仪器测量各能证明什么？

### 参考答案

**口述核心：** 读回可验证配置与状态，计算可核对时钟树，独立参考测量可验证实际频率。

#### 回答要点

- 可观察时钟输出或已知分频信号；定时器、通信时序可作交叉核对，测量时记录参考源精度与仪器限制。

#### 易错点与边界

两个使用同一错误时钟的模块互相比较可能掩盖偏差；软件变量不能代替物理测量。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第15题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-general-016 | 沿时钟树计算频率

标签：RCC, 通用原理, 计算题
难度：进阶

### 题目

题设时钟树为8 MHz参考经PLL乘9得到系统时钟，AHB除1、APB1除2；忽略误差且所有器件均允许这些频率。各级频率是多少？

### 参考答案

**口述核心：** 系统时钟72 MHz，AHB为72 MHz，APB1为36 MHz。

#### 回答要点

- 沿每个分频节点逐级计算，确认上一级实际使用的源和分频系数，再检查目标器件的允许范围。

#### 易错点与边界

这是给定时钟树的算术题，不说明任意MCU都允许72 MHz或具备同样的树结构。

#### 来源与适用条件

原始资料：20-RCC/00-通用知识/RCC 通用知识 自测题.md 第16题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。
