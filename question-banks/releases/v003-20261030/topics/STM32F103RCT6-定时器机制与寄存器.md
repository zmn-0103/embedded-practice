---
schema_version: 1
topic_id: stm32f103-timer
topic_title: STM32F103RCT6 定时器机制与寄存器
---

## timer-reg-001 | 定时器资源总线与基址

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

列出TIM1至TIM8的类型和总线，给出TIM1、TIM3、TIM8基址；哪些没有普通PWM通道？

### 参考答案

**口述核心：** TIM1/8高级定时器在APB2；TIM2至5通用、TIM6/7基本定时器在APB1；TIM6/7没有普通捕获比较PWM通道。

#### 回答要点

TIM1基址0x40012C00，TIM3为0x40000400，TIM8为0x40013400；按本型号资源表确认。

#### 常见误区与边界

不能把高密度型号资源默认推广到F103C8等器件；基本定时器不具有CCMR/CCER/CCR和BDTR。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-002 | 定时器引脚复用冲突

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

默认映射下TIM1_CH2与USART1哪个引脚冲突？TIM2与TIM5的默认通道引脚有何冲突，怎样确定实际可用引脚？

### 参考答案

**口述核心：** TIM1_CH2和USART1_TX都默认用PA9；TIM2和TIM5默认通道都对应PA0至PA3。

#### 回答要点

先查DS5792封装引脚，再查AFIO重映射和板卡占用；同一引脚不能同时输出独立外设信号。

#### 常见误区与边界

别把手册复用功能表当成已经在板上可用的证明；还要核对ES0340复用限制。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-003 | APB定时器倍频规则

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

HCLK=72 MHz，APB1分频2、APB2分频1。TIM1和TIM3输入时钟各多少？CR1.CKD能否代替PSC改变计数节拍？

### 参考答案

**口述核心：** 两者均为72 MHz；APB分频1时TIMCLK=PCLK，否则该组定时器通常取2×PCLK。

#### 回答要点

TIM3取2×36 MHz，TIM1取72 MHz；CKD控制滤波/死区的tDTS基准，PSC控制计数预分频。

#### 常见误区与边界

本题规则限定STM32F103RCT6；不能套到USART或所有MCU的定时器。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-004 | PSC和ARR时基计算

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3内部时钟72 MHz，向上边沿计数，PSC=71、ARR=999，无重复计数和门控。求计数节拍、更新周期和频率。

### 参考答案

**口述核心：** fCNT=1 MHz、节拍1微秒，完整周期1 ms，更新频率1 kHz。

#### 回答要点

fCNT=fTIM/(PSC+1)，T=(ARR+1)/fCNT；PSC和ARR必须是已经生效的值。

#### 常见误区与边界

外部时钟、门控、中央对齐或更新禁止会改变观察结果；未回读和测量不宣称实测频率。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-005 | 20kHz PWM的参数

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3CLK=72 MHz，PSC=0，向上边沿对齐PWM。要20 kHz，ARR应为多少，名义占空比步长多少？

### 参考答案

**口述核心：** ARR=3599；每周期3600节拍，步长1/3600，约0.02778个百分点。

#### 回答要点

ARR+1=72000000/20000；比较值按目标占空比乘3600计算。

#### 常见误区与边界

频率与分辨率还受可用计数宽度和输入时钟约束；这不是所有配置下的固定ARR。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-006 | 初始化UG与意外触发

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3初始化时软件写EGR.UG，UDIS=0、URS=0。为何通常先处理UIF再开放中断？还可能影响什么？

### 参考答案

**口述核心：** UG重装相关预装载并初始化计数相位，也会置UIF；提前开UIE/NVIC可能多一次中断。

#### 回答要点

TRGO若选更新或其他相关路径，还可能影响下游；先控制链路，再装载和清初始标志。

#### 常见误区与边界

URS=1时UG仍可装载但不置UIF/发更新请求，不能断言所有UG都置UIF。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-007 | UDIS与URS的区别

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3的CR1.UDIS=1和URS=1各限制什么？URS=1能否阻止预装载在更新事件生效？

### 参考答案

**口述核心：** UDIS禁止UEV并保持相应影子寄存器；URS限制更新标志/中断/DMA请求来源，不能用来禁止UEV。

#### 回答要点

URS=1时软件UG仍可装载而不产生该更新请求；UDIS=1也不能简单理解为UG不再初始化计数器。

#### 常见误区与边界

更新事件、UIF和中断是不同层次；请求源选择不等同硬件装载开关。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-008 | 不同字段的预装载机制

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

比较PSC、ARR、CCR1，以及高级TIM1/8通道1至3的CCxE/CCxNE/OCxM预装载控制与生效事件。

### 参考答案

**口述核心：** PSC始终有预装载；ARR由ARPE、输出CCR由OCxPE控制并在UEV生效；高级控制字段由CCPC与COM控制。

#### 回答要点

ARPE在CR1，OC1PE在CCMR1；CCPC在CR2，COM用于带互补输出的通道控制字段。

#### 常见误区与边界

不能把COM预装载推广到TIM3或CH4；写入完成不等于影子值已更新。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-009 | TIM3_CH1 PWM硬件配置链

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3内部时钟已知，默认PA6输出CH1，输出PWM1高有效。无需列函数名，说明从时钟到波形需要哪些配置。

### 参考答案

**口述核心：** 开GPIOA和TIM3时钟，PA6设复用推挽，配置PSC/ARR和CCMR1输出PWM1、CCR1、CC1E，最后启动计数。

#### 回答要点

按需要开启ARR/CCR预装载并装载初值；确认AFIO未改映射和引脚未被占用。

#### 常见误区与边界

TIM3没有高级TIM1/8的MOE门控，不能机械要求所有定时器都设MOE。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-010 | 运行中改变占空比

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3向上PWM1、高有效，fCNT=1 MHz、ARR=999；原占空比25%，要改50%，CCR1填多少？为什么只改比较值更合适？

### 参考答案

**口述核心：** CCR1由250改为500；若OC1PE=1，则等下一次UEV生效。

#### 回答要点

CCR=占空比×(ARR+1)；只更新比较值可避免重写模式、极性和通道使能造成跳变。

#### 常见误区与边界

500只对应本题ARR；超过ARR的边界输出行为及100%波形还需查本型号勘误并测量。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-011 | 捕获值不变的排查

标签：Timer, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3做输入捕获，预期输入有周期边沿但CCR始终不变。按信号、GPIO/映射、通道和计数链给出检查。

### 参考答案

**口述核心：** 测输入是否到达，再查GPIO与通道映射、CCxS/CCxE、边沿极性、滤波/捕获预分频，以及CNT是否计数。

#### 回答要点

看CCxIF和过捕获；核对调试冻结和输入幅度共地；先确认真实边沿再查中断。

#### 常见误区与边界

无捕获中断不能直接证明硬件没捕获；读取CCR还可能清输入捕获标志。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-013 | 高级定时器主输出门控

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1.CEN=1且CNT变化，已配置PWM，为什么引脚仍可能无输出？MOE与Break分别影响什么？

### 参考答案

**口述核心：** 高级定时器还需通道使能及BDTR.MOE；Break可异步清MOE并令输出进入配置的非运行状态。

#### 回答要点

同时核对GPIO映射、CCxE/CCxNE、模式极性和保护输入；计数运行不等于输出通路全开。

#### 常见误区与边界

输出关闭电平受OSSI/OSSR/OIS及外部电路影响，不能笼统保证总是低电平。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-014 | 定时器主从级联

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1的TRGO选更新、频率1 kHz；按本芯片ITR映射TIM2选ITR0作为外部时钟模式1输入，PSC=0、ARR=99，向上计数。求TIM2更新频率。

### 参考答案

**口述核心：** TIM2每接收一次触发计1，100次形成更新，所以更新频率10 Hz。

#### 回答要点

核对TIM2.TS选ITR0、SMS选外部时钟模式1，且触发路由确来自TIM1；确认触发边沿与CEN。

#### 常见误区与边界

内部触发映射随定时器实例和芯片变化，不能把任意TIMx的ITR0都当TIM1。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-015 | TIM3触发ADC1再到DMA

标签：Timer, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3更新作为TRGO，ADC1规则组外触发选择本型号的TIM3_TRGO，DMA1_CH1搬运到SRAM。说明触发链与至少两个故障点。

### 参考答案

**口述核心：** TIM3更新到TRGO，再触发ADC1规则组，转换完成产生DMA请求，CH1搬运数据。

#### 回答要点

查MMS、ADC EXTSEL/EXTTRIG与启动状态、DMA映射/使能；保证采样序列能在触发周期内完成。

#### 常见误区与边界

并非任意TRGO都能连任意ADC组；首次软件UG可能额外触发下游，需控制初始化顺序。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-016 | PWM异常的统一排查

标签：Timer, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

同一TIM3_CH1/PA6工程分别出现无PWM、频率差2倍、修改CCR后占空比不变。给出统一排查顺序与各现象的首要检查。

### 参考答案

**口述核心：** 沿时钟、计数、事件、通道、引脚及联动检查；无输出看复用/通道，倍频错误看APB与模式，CCR不变看目标通道和预装载生效。

#### 回答要点

读RCC/CNT/PSC/ARR/CCR/CCMR/CCER；测PA6波形；区分PWM与每周期翻转一次的Toggle输出。

#### 常见误区与边界

寄存器读回与仪器波形分别证明对应事实；没有测量时只提出可验证假设。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-017 | 常用定时器寄存器偏移

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

写出TIM3的CR1、SR、CCMR1、CCER、CNT、PSC、ARR、CCR1偏移；TIM1/8的BDTR偏移是多少？

### 参考答案

**口述核心：** 依次为0x00、0x10、0x18、0x20、0x24、0x28、0x2C、0x34；高级定时器BDTR为0x44。

#### 回答要点

绝对地址=该实例基址+偏移；按对应定时器寄存器表核对有效字段。

#### 常见误区与边界

TIM3没有BDTR，不能因偏移存在于高级定时器表就访问所有实例相同位置。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-018 | CR1字段与中央对齐

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3.CR1的CEN、UDIS、URS、OPM、DIR、CMS、ARPE、CKD在何处？CMS=01有什么含义？

### 参考答案

**口述核心：** 位依次为0、1、2、3、4、[6:5]、7、[9:8]；CMS=01为中央对齐模式1。

#### 回答要点

模式1在向下计数阶段产生配置为输出的通道比较中断标志；中央对齐完整波形包含上数和下数。

#### 常见误区与边界

CKD改变tDTS相关基准，不是计数预分频；中央对齐时DIR由硬件表征方向。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-019 | MMS的更新脉冲与OC1REF

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3.CR2.MMS=010和100分别输出什么TRGO？为什么下游不能把这两种来源一概当每次更新一个脉冲？

### 参考答案

**口述核心：** 010选择更新事件，100选择OC1REF信号。

#### 回答要点

前者关联UEV，后者跟随比较输出参考信号；下游对边沿、电平和触发方式的要求不同。

#### 常见误区与边界

OC1REF不是必然等同引脚电平，后面还有极性、门控及输出级。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-020 | TS和SMS的分工

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3.SMCR的TS和SMS各负责什么？SMS=100、101、110分别表示什么模式？

### 参考答案

**口述核心：** TS选择TRGI来源，SMS选择从模式；100复位、101门控、110触发。

#### 回答要点

TS来源可含ITR及输入滤波/外部触发路径；先核对实例路由，再理解复位、门控或启动行为。

#### 常见误区与边界

选择同一触发源不等于采用同一种从模式，外部时钟模式1的编码另为111。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-021 | UIE与NVIC

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3.SR.UIF置1后，DIER.UIE与NVIC各起什么作用？只开一层会怎样？

### 参考答案

**口述核心：** UIE允许定时器把更新事件送成中断请求，NVIC允许CPU响应该IRQ，两层都需正确配置。

#### 回答要点

还要考虑CPU屏蔽、优先级、向量表和共享IRQ；先清不需要的初始化事件。

#### 常见误区与边界

UIF可以在中断关闭时置位；开NVIC本身不会生成更新事件。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-022 | SR标志与清除副作用

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1的UIF、CC1IF、BIF、CC1OF位号及清除方式是什么？输入捕获读CCR1会影响什么？

### 参考答案

**口述核心：** 位号为0、1、7、9；软件按rc_w0向目标写0清，输入模式读CCR1还可清CC1IF。

#### 回答要点

写1对这些状态位无清除作用；构造清除值需保护其他有效标志并遵守保留位约定。

#### 常见误区与边界

不要用先读SR再把读值改写回的方式盲清，以免丢掉读后新到事件；BIF是高级定时器字段。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-023 | CCMR输出与输入视图

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM3.CCMR1在输出和输入配置时字段含义怎样变化？OC1M=110和111分别是什么？

### 参考答案

**口述核心：** 输出视图含CCxS、OCxFE/PE/M/CE；输入视图含CCxS、ICxPSC、ICxF；110为PWM1，111为PWM2。

#### 回答要点

先由CCxS确定通道角色，再解释其余复用字段；PWM1/2的有效关系与计数方向有关。

#### 常见误区与边界

不能把相同位号的输入滤波编码当作输出模式编码，配置通道选择还需满足手册使能前提。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-024 | CCER主与互补输出

标签：Timer, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1.CCER的CC1E、CC1P、CC1NE、CC1NP各控制什么？为什么CH4没有同等互补输出使能？

### 参考答案

**口述核心：** 分别控制主通道使能/极性、互补通道使能/极性；CH4没有硬件互补输出。

#### 回答要点

CH1至3的主/互补输出还受MOE、死区和保护门控；核对封装引脚。

#### 常见误区与边界

不能把CCxNE/CCxNP推广到TIM3或所有通道，互补不代表可省略功率级死区验证。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-025 | BDTR保护与自动恢复

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1.BDTR的MOE、BKE、BKP、AOE、DTG各是什么？Break有效时硬件如何动作，恢复应注意什么？

### 参考答案

**口述核心：** 分别为主输出使能、Break使能/极性、自动输出使能和死区编码；Break会异步清MOE并记录BIF。

#### 回答要点

输出非运行状态由OSSI/OSSR/OIS等共同决定；恢复需检查故障已解除及配置允许。

#### 常见误区与边界

ES0340含自动输出使能相关限制；不可把AOE当作无需复核的安全恢复保证。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## timer-reg-026 | 线性段死区计算

标签：Timer, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（LQFP64、高密度）；具体TIM实例、时钟与模式按题设，未给时不假定72 MHz。与软件库无关。

TIM1时钟72 MHz，CR1.CKD选DIV1，死区处于DTG的0至127线性段。要求名义1微秒，DTG应取多少？

### 参考答案

**口述核心：** tDTS=1/72 MHz，1微秒为72个tDTS，DTG=72=0x48。

#### 回答要点

在线性段tdead=DTG×tDTS；先求时间基准再选分段编码。

#### 常见误区与边界

此计算给出数字名义时间，实际驱动器延迟和功率管开关特性必须另测；其他DTG段公式不同。

#### 依据

[ST RM0008：RCC及高级/通用/基本定时器章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：资源和引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：定时器与引脚复用勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。
