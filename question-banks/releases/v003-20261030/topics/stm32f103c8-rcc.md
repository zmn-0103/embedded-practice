---
schema_version: 1
topic_id: stm32f103c8-rcc
topic_title: STM32F103C8T6 时钟机制与寄存器
---

## rcc-f103-001 | RCC寄存器职责

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

从职责说明CR、CFGR、CIR、ENR、RSTR、BDCR和CSR分别管理什么。

### 参考答案

**口述核心：** RCC分别管理时钟源、时钟树、就绪和故障状态、门控、复位及备份域。

#### 回答要点

- CR控制时钟源与PLL及就绪；CFGR选择系统源、分频和PLL配置；CIR处理中断与CSS标志；ENR管门控、RSTR管外设复位；BDCR管LSE与RTC、CSR含LSI和复位原因。

#### 易错点与边界

门控、复位和时钟选择不是同一操作，读写前应核对相应字段的访问语义。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-002 | 硬件复位后的系统时钟

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

芯片刚经历系统复位、启动代码尚未改时钟时，默认系统时钟源是什么？在哪里确认？

### 参考答案

**口述核心：** 默认使用内部8 MHz HSI，CFGR的SW/SWS复位值对应HSI。

#### 回答要点

- 内部源让芯片能在外部晶振未就绪时启动；进入应用主循环时可能已被启动代码重新配置，应读回实际状态。

#### 易错点与边界

“main未配置”不等于“始终保持硬件复位时钟”，也不直接证明实际精度。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第2题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-003 | 时钟源控制与就绪位

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

CR中的HSEON、HSERDY、PLLON、PLLRDY各表示什么？PLLON为1却未就绪时该如何处理？

### 参考答案

**口述核心：** ON位表示使能请求，RDY位表示对应源就绪或PLL锁定。

#### 回答要点

- HSEON/HSERDY对应外部高速源，PLLON/PLLRDY对应PLL；等待应有超时，后续切换还需确认SWS。

#### 易错点与边界

不要把请求开启当成已经稳定，也不要只写系统源选择后就按新频率使用通信与时基。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第3题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第22题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第6题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-004 | SW与SWS及切换验证

标签：RCC, STM32F103C8T6, 情景分析, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103C8T6。

软件请求PLL作为系统时钟，但SWS仍显示HSI。应该怎样解释与检查？

### 参考答案

**口述核心：** SW是选择请求，SWS是当前实际选择；两者不一致说明尚未完成预期切换。

#### 回答要点

- 核对HSE和PLL就绪、PLL参数、请求是否实际写入、等待与超时，以及是否发生时钟故障回退。
- 计算当前频率应依据实际状态。

#### 易错点与边界

不能仅凭一次函数调用、缓存变量或请求位认定系统已在PLL上运行。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第4题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第21题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第26题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第7题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-005 | PLL输入路径

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

该型号的PLL可从哪些路径取输入？HSE路径如何分频？

### 参考答案

**口述核心：** PLLSRC选择HSI除2或HSE路径，HSE路径再由PLLXTPRE选择不分频或除2。

#### 回答要点

- 通过PLLMUL选择倍频，计算输入和输出并校核允许范围；HSI路径的除2不能和HSE路径设置混为一谈。

#### 易错点与边界

不把其他STM32系列或连接型F1的PLL结构套入本型号。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第6题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第4题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-006 | 重新配置正在使用的PLL

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

若系统当前由PLL供时，想改变PLL参数，为什么不能直接关闭PLL或在线改倍频？应怎样安排状态转换？

### 参考答案

**口述核心：** 应先准备并切换到可用的其他系统源，确认切换后再关闭和重配PLL。

#### 回答要点

- 按手册依次确认替代源就绪、SWS切换、PLL关闭；修改允许字段后重新使能并等待锁定，再请求切回并确认。

#### 易错点与边界

具体还要维持总线与Flash允许范围，必要时暂停或重配受影响外设；不能切断正在供CPU的唯一时钟。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第5题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-007 | 软件频率值与真实频率

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

软件根据RCC寄存器和预设晶振频率计算时钟。如果预设晶振值与真实硬件不同，会出现什么？软件频率值能当测量值吗？

### 参考答案

**口述核心：** 计算会依据错误的输入假设给出错误频率，软件数值不是物理测量。

#### 回答要点

- 影响波特率、定时参数和延时等后续计算；需核对实际晶振、当前源与分频，并用独立参考验证。
- 更新软件变量不会改变硬件时钟。

#### 易错点与边界

仅改软件常量不能让真实晶振变频；应区分配置值、计算值和实测值。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第10题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第11题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第13题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-008 | 启动阶段的时钟配置归属

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

应用主循环未配置时钟，却观察到软件频率值为72 MHz，可能有哪些原因？为什么不宜盲目再初始化一遍？

### 参考答案

**口述核心：** 启动阶段可能已配置时钟，也可能软件变量过时或预设不符，应核对启动路径和寄存器状态。

#### 回答要点

- 明确一个模块负责系统时钟，检查启动代码的实际行为；重复配置可能影响已经运行的外设、时基或锁定状态。

#### 易错点与边界

软件显示72 MHz本身不能证明硬件实际72 MHz，更不能证明启动阶段一定配置成功。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第14题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第22题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-009 | 8MHz到72MHz的配置流程

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

假设HSE为8 MHz且电路合格、供电与频率满足手册，从安全内部源建立72 MHz系统时钟应依次确认什么？

### 参考答案

**口述核心：** 按源就绪、Flash与总线约束、PLL锁定、系统源切换和实际状态确认推进。

#### 回答要点

- 准备HSI；开启HSE并带超时等就绪；先配置足够Flash等待及安全AHB/APB分频；PLL选择HSE乘9，开启并等锁定；切换SYSCLK并确认SWS，更新软件频率及受影响外设。

#### 易错点与边界

如改变正在运行的PLL，需先切到其他源；任何等待失败都不能无条件继续后续步骤。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第15题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-010 | 门控寄存器与复位寄存器

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

APB2ENR与APB2RSTR的作用有何区别？APB1上同类寄存器是否也应区分？

### 参考答案

**口述核心：** ENR控制外设时钟门控，RSTR控制外设复位。

#### 回答要点

- 复位改变外设内部状态并可能清配置；开启门控只提供时钟。
- 应分别核对对应总线、位号及是否需要重新初始化。

#### 易错点与边界

不能把关闭时钟当作复位，也不能用复位替代开启时钟。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第8题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第27题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-011 | 72MHz的Flash等待配置

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

明确HCLK为72 MHz、供电在该型号数据手册允许条件内。Flash等待周期应是多少？升频前为什么要先设置？预取又是什么？

### 参考答案

**口述核心：** 需要2个等待周期，即LATENCY=010；等待设置必须在升频前满足访问时序。

#### 回答要点

- LATENCY控制等待，PRFTBE使能预取，PRFTBS表示预取状态；预取可改善某些访问情形，但不能代替必要等待。

#### 易错点与边界

Flash约束针对其实际访问时钟和电压条件；SYSCLK为72 MHz但AHB另有分频时，不能直接套用同一计算。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第11题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第18题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第23题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第18题；20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第21题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-012 | 分频编码与完整时钟计算

标签：RCC, STM32F103C8T6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103C8T6。

HSE=8 MHz且PLL乘9。情形A：AHB除1、APB1除2、APB2除1、ADC除6；情形B：HPRE=1000、PPRE1=100、PPRE2=0xx。分别计算各级频率。

### 参考答案

**口述核心：** 先把字段编码还原为分频系数，再逐级计算。

#### 回答要点

- A：SYSCLK/HCLK=72 MHz，PCLK1=36 MHz、PCLK2=72 MHz、ADCCLK=12 MHz。
- B：AHB除2、APB1除2、APB2除1，因此HCLK=36 MHz、PCLK1=18 MHz、PCLK2=36 MHz。

#### 易错点与边界

字段值不是分频系数本身；0xx表示该字段可编码的除1组合，未给出的ADC条件不自行猜测。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第19题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第13题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第16题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第20题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第5题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-013 | APB1频率上限

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

SYSCLK=HCLK=72 MHz且APB1不分频，PCLK1是多少？该配置是否在型号保证范围内？

### 参考答案

**口述核心：** PCLK1为72 MHz，超过该型号APB1的36 MHz上限。

#### 回答要点

- 应选择合适分频并重新计算APB1外设时钟；程序偶尔能运行不构成超规格配置正确的证据。

#### 易错点与边界

总线频率与定时器内核时钟仍应分别计算，不把36 MHz上限误套给所有定时器时钟。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第20题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-014 | CSS故障状态与恢复

标签：RCC, STM32F103C8T6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103C8T6。

时钟安全系统CSS检测到相关HSE故障后，为什么不能只读取一个CSS标志就结束处理？

### 参考答案

**口述核心：** 还需处理NMI与标志、确认实际系统源，并使时序和业务进入可控状态。

#### 回答要点

- 检查RCC_CIR中的CSSF并按规定清除；结合CR/CFGR确认硬件故障处理后的源与频率，重算通信和定时配置，记录故障并决定恢复或安全停机。

#### 易错点与边界

具体自动切换与PLL影响依赖所用路径；不得在未确认源可用时直接切回，也不把普通外设IRQ处理照搬到NMI。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第7题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第24题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-015 | RTC时钟与备份域保护

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

BDCR中的RTCSEL、RTCEN、BDRST分别做什么？写备份域配置前为何要检查PWR保护？

### 参考答案

**口述核心：** 它们分别选择RTC源、使能RTC时钟和复位备份域；相关写入受备份域保护控制。

#### 回答要点

- 需按手册准备PWR/BKP访问条件并设置DBP，再修改允许字段；备份域复位可能丢失RTC与备份状态，切换RTC源也有规定流程。

#### 易错点与边界

不能把BDRST当普通配置开关；涉及已有RTC数据时必须先明确影响。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第9题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第28题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-016 | 复位标志与RMVF

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

CSR中的复位原因标志和RMVF有什么作用？启动排障时应怎样使用？

### 参考答案

**口述核心：** 原因标志记录复位线索，RMVF按规定用于清除这些标志。

#### 回答要点

- 在启动早期先读并保留需要的状态，再执行清除；结合电源、看门狗和软件复位路径综合判断。

#### 易错点与边界

多个原因标志可能同时存在，读到某一位不一定能还原唯一复位过程。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第10题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-017 | PLLMUL编码与频率推导

标签：RCC, STM32F103C8T6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103C8T6。

HSE=8 MHz、PLLXTPRE=0、PLLMUL=0111且系统已成功选择PLL。输出系统频率是多少？

### 参考答案

**口述核心：** 0111编码表示乘9，HSE不先除2，因此SYSCLK为72 MHz。

#### 回答要点

- 应先确认PLLSRC选择HSE，再解码输入分频与倍频；最后使用SWS确认PLL确实生效。

#### 易错点与边界

不能把编码0111当乘7；若源未选择成功，公式不代表实际SYSCLK。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第14题；20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第15题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-018 | ADC分频与时钟上限

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

PCLK2=72 MHz、ADCPRE=10时，ADCCLK是多少？是否满足该型号ADC时钟限制？

### 参考答案

**口述核心：** ADCPRE=10表示除6，ADCCLK为12 MHz，未超过14 MHz上限。

#### 回答要点

- 若误选除4得到18 MHz就超规格；分频应结合PCLK2实际状态与ADC要求校核。

#### 易错点与边界

时钟合规不等于采样时间、电源、源阻抗或通道配置也已正确。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-019 | APB分频与定时器时钟

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

TIM2使用APB1时钟路径，当APB1分频为除1或除4时，TIM2内核时钟与PCLK1分别是什么关系？

### 参考答案

**口述核心：** APB1分频为1时TIM2CLK等于PCLK1，否则TIM2CLK等于2倍PCLK1。

#### 回答要点

- 除4时先由HCLK得到PCLK1，再乘2得到TIM2CLK；计数器实际频率还要经过自身预分频。

#### 易错点与边界

该规则限定题设F103路径，不能推广到所有MCU或所有定时器来源。

#### 来源与适用条件

原始资料：20-RCC/第二层-寄存器/RCC 第二层 寄存器 自测题.md 第19题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。

## rcc-f103-020 | 四类时钟源的用途

标签：RCC, STM32F103C8T6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103C8T6。

HSI、HSE、LSI、LSE通常各用于哪些功能？选择时应考虑什么？

### 参考答案

**口述核心：** HSI/HSE常用于系统高速时钟，LSI/LSE常用于低速、看门狗或RTC相关功能。

#### 回答要点

- HSI为内部高速RC、HSE为外部高速路径，LSI为内部低速RC、LSE为外部低速路径；比较精度、功耗、启动时间和可用路由。

#### 易错点与边界

实际RTC、看门狗和系统源的可选路径须查时钟树，不是四个源可任意互换。

#### 来源与适用条件

原始资料：20-RCC/第一层-库函数/RCC 第一层 库函数 自测题.md 第2题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5319：STM32F103x8/B时钟与电气条件](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf)。
