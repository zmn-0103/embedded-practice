---
schema_version: 1
topic_id: stm32f103-gpio
topic_title: STM32F103RCT6 GPIO机制与寄存器
---

## gpio-002 | GPIO时钟与初始化链

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

为什么配置GPIO前要开启端口时钟？不依赖库函数，描述一次输出初始化应核对哪些步骤。

### 参考答案

**口述核心：** 端口时钟是寄存器配置和外设工作的前提，还需正确设置模式、引脚和初始输出状态。

#### 回答要点

- 开启对应时钟并确认端口，确定安全初值，按手册设置输出类型和速度，再验证实际引脚；漏开时钟时配置不能按预期工作。

#### 易错点与边界

不把时钟使能等同功能已就绪；板卡负载、复用占用和启动顺序也会影响现象。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第1题；10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第7题；10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第10题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-003 | GPIO端口的总线与门控

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

GPIOA、GPIOC属于哪条外设总线？端口门控应检查哪个RCC寄存器？

### 参考答案

**口述核心：** 两者属于APB2外设，通过RCC_APB2ENR中的对应端口使能位开启时钟。

#### 回答要点

- 需区分GPIO端口时钟和AFIO时钟；开启某一个端口不代表其他端口已开启。

#### 易错点与边界

此结论限定题设型号，其他STM32系列的GPIO总线与门控寄存器可能不同。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第2题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-005 | 通用输出与复用输出

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

通用输出与复用输出的信号控制来源有何区别？

### 参考答案

**口述核心：** 通用输出由GPIO输出数据控制，复用输出交给选定的片上外设。

#### 回答要点

- 例如串口发送信号来自USART；普通GPIO输出数据改变不能替代USART产生完整帧。
- 外设、引脚复用和电路都需正确配置。

#### 易错点与边界

复用选择和重映射需按该型号核对；不能同时启用相互冲突的引脚功能。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第14题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-010 | 复用引脚为何仍需配置外设

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

把引脚设为复用输出后，为什么串口或定时器信号仍可能没有输出？

### 参考答案

**口述核心：** 引脚模式仅建立输出通路，外设本身还需时钟、参数、功能使能及正确映射。

#### 回答要点

- 按外设时钟、内部工作模式、通道使能、复用选择和外部负载顺序检查；先确认外设已在产生信号。

#### 易错点与边界

不能靠反复修改GPIO模式解决外设未启动的问题。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第16题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-016 | 输入状态与输出锁存

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

IDR和ODR分别反映什么？为何不能只读ODR判断外部按键或实际引脚电压？

### 参考答案

**口述核心：** IDR反映输入路径采到的状态，ODR保存输出数据锁存状态，两者含义不同。

#### 回答要点

- 外部电路、输出类型和输入路径会影响实际引脚电平；开漏释放或强负载时，锁存数据不等于测得电压。
- 读取按键应使用有效输入路径。

#### 易错点与边界

还要确认模式、复用及电气条件；某些模式下输入缓冲有专门规则。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第35题；10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第20题；10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第21题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-019 | GPIO输入模式及用途

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

数字输入、模拟输入、浮空输入和上下拉输入应如何按用途选择？

### 参考答案

**口述核心：** 模拟采集采用模拟输入，数字输入根据外部驱动和默认电平需求选择浮空或上下拉。

#### 回答要点

- 浮空不等于允许输入长期不受驱动；上下拉提供默认电平。
- 模拟输入还需校核ADC通道映射和模拟电压范围。

#### 易错点与边界

模式名称与寄存器编码限于本型号；不能仅由数字引脚耐压推断模拟输入范围。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第11题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-020 | GPIO输出类型与信号来源

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

从普通/复用、推挽/开漏两个维度，怎样区分该芯片的四类输出模式？

### 参考答案

**口述核心：** 普通或复用决定信号来源，推挽或开漏决定输出级驱动结构。

#### 回答要点

- 四种组合为通用推挽、通用开漏、复用推挽、复用开漏；开漏高电平依靠合适上拉，复用输出仍需配置外设。

#### 易错点与边界

具体编码看MODE/CNF表；输出类型不自动保证允许的电压、电流和速率。

#### 来源与适用条件

原始资料：10-GPIO/第一层-库函数/GPIO 第一层 库函数 自测题.md 第12题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-025 | 配置寄存器范围与字段定位

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

CRL/CRH各管理哪些引脚？每引脚占几位？给出引脚n的字段起始位，并以PA5、PA8、PC1、PC13说明。

### 参考答案

**口述核心：** CRL管理0至7，CRH管理8至15；每个引脚占4位。

#### 回答要点

- n小于8时起始位为4n，否则为4(n−8)。
- PA5在CRL[23:20]，PA8在CRH[3:0]，PC1在CRL[7:4]，PC13在CRH[23:20]。

#### 易错点与边界

端口决定使用GPIOA或GPIOC寄存器，不能仅按引脚编号选择端口；不套用其他系列的MODER布局。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第2题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第3题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第4题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第5题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第6题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第7题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第8题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-026 | MODE与CNF的组合规则

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

说明四位字段中MODE和CNF的位置，以及输入、输出模式下编码含义为什么不同。

### 参考答案

**口述核心：** MODE占低2位，CNF占高2位；先根据MODE区分输入输出，再解释CNF。

#### 回答要点

- MODE=00为输入；CNF=00模拟、01浮空、10上下拉。
- 输出MODE=01/10/11分别为10/2/50 MHz档；输出CNF=00/01/10/11分别为普通推挽、普通开漏、复用推挽、复用开漏。

#### 易错点与边界

保留编码不要使用；档位是输出能力配置，不是应用信号频率或输入采样频率。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第9题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第11题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第12题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第13题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第14题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-027 | 2MHz推挽与开漏字段

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

普通推挽输出2 MHz与普通开漏输出2 MHz的四位字段分别是什么？如何由MODE/CNF组合得到？

### 参考答案

**口述核心：** 推挽为0x2，开漏为0x6；两者MODE均为10，CNF分别为00和01。

#### 回答要点

- 字段由CNF左移2位再合入MODE；输出类型变化并不改变选择的2 MHz速度档。

#### 易错点与边界

这是该芯片CRL/CRH编码，不是通用GPIO或HAL参数值。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第15题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第16题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-029 | 上下拉输入字段

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

把一个引脚设为数字输入上拉或下拉，MODE、CNF及四位字段应如何设置？

### 参考答案

**口述核心：** MODE=00、CNF=10，四位字段为0x8。

#### 回答要点

- 该字段选择输入上下拉模式；上拉还是下拉由相应ODR位进一步决定。
- 仅写0x8不能完成方向选择。

#### 易错点与边界

ODR此时选择偏置，不把引脚变为输出；不要漏掉后续选择。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第17题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-030 | 输入上下拉与ODR的关系

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

CRL/CRH中的上下拉输入字段相同时，芯片怎样区分上拉和下拉？ODR置1是否意味着输出高电平？

### 参考答案

**口述核心：** 该输入模式下，ODR对应位置1选上拉、置0选下拉。

#### 回答要点

- 方向仍由CRL/CRH的MODE控制；同一个ODR位在不同模式下承担不同作用。

#### 易错点与边界

判断电平仍需看外部电路，不能只看ODR锁存位。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第18题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第42题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-031 | GPIO主要寄存器的职责

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

GPIO的CRL、CRH、IDR、ODR、BSRR、BRR分别负责什么？为什么不能把配置、数据和按位操作混为一类？

### 参考答案

**口述核心：** CRL/CRH配置模式，IDR采集输入，ODR保存输出数据，BSRR/BRR执行按位置位或复位。

#### 回答要点

- CRL管理0至7号引脚、CRH管理8至15；数据寄存器按引脚编号对应位。
- BSRR低半区写1置位、高半区写1复位，BRR写1复位。

#### 易错点与边界

这些是主要寄存器而非完整GPIO寄存器清单；还存在锁定等机制，具体访问语义以手册为准。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第1题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-035 | BSRR与BRR的写入语义

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

BSRR低16位、高16位与BRR分别如何控制输出位？写0会不会触发置位或复位？

### 参考答案

**口述核心：** BSRR低半区写1置位，高半区写1复位；BRR相应位写1复位。

#### 回答要点

- 未写1的位不因该次写入改变；一次写入可明确指定需要改变的输出位，而不先读取ODR。

#### 易错点与边界

不要把这些操作寄存器当普通可随意读改写的存储变量；避免同时对同一位下达相反意图。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第36题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第37题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第38题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-036 | 按位写入与读改写冲突

标签：GPIO, STM32F103RCT6, 情景分析, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

主循环和ISR修改同一GPIO端口的不同输出位，为什么完整ODR读改写可能丢更新？使用BSRR有什么帮助？

### 参考答案

**口述核心：** 旧ODR快照写回可能覆盖另一上下文的更新；BSRR按位写入可避免这种覆盖。

#### 回答要点

- 读、修改、写是多个步骤；若中间发生中断，最后写回会带入过期的其他位。
- BSRR把目标置位或复位交给硬件完成。

#### 易错点与边界

它不解决多个上下文争用同一输出的业务冲突，也不保证多条写操作组成一个不可分割事务。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第39题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-037 | 引脚位掩码计算

标签：GPIO, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

只选择编号5的引脚数据位，应使用什么位掩码？请给出表达式与十六进制值。

### 参考答案

**口述核心：** 单个位掩码为1U左移5，即0x00000020。

#### 回答要点

- 它用于数据位或引脚集合，不用于直接覆盖CRL中的完整四位配置字段。
- 无须记忆某个库宏名称。

#### 易错点与边界

移位要采用足够宽的无符号类型，不能混淆引脚编号与已经计算好的掩码。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第27题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-038 | 引脚掩码与配置字段掩码

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

选择PA5数据位的掩码和选择PA5模式字段的掩码为什么不同？

### 参考答案

**口述核心：** 前者选择一个引脚数据位，后者选择该引脚占用的四位配置字段。

#### 回答要点

- 数据位掩码为1U左移5；配置字段掩码为0xFU左移20。
- 使用前应明确目标寄存器布局。

#### 易错点与边界

同一引脚在不同寄存器里的位位置不必相同，不能机械复用掩码。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第29题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-040 | PA5配置字段掩码

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

PA5在CRL中占哪四位？用于清除其全部配置字段的32位掩码是多少？

### 参考答案

**口述核心：** PA5位于[23:20]，字段掩码为0xFU左移20，即0x00F00000。

#### 回答要点

- 每引脚四位，5×4=20；取反后与原寄存器按位与可清目标字段并保留其他位。

#### 易错点与边界

这与数据位掩码0x20不同；掩码类型应为无符号且具有足够位宽。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第28题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-043 | 先清后写与保留相邻字段

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

把PA5从任意旧模式改成2 MHz推挽输出，怎样只覆盖目标四位？为什么直接按位或0x2不可靠？

### 参考答案

**口述核心：** 先清除CRL[23:20]，再写入字段0x2，其他位保持原值。

#### 回答要点

- 可用“原值与字段掩码的反码，再或入新字段左移值”的方法；直接按位或无法清除旧字段中的1。
- 整个CRL清零会改变其他七个引脚。

#### 易错点与边界

软件读改写仍需考虑其他执行上下文同时修改同一配置寄存器；不能把两次操作视为天然原子。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第30题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第31题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第32题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第33题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第34题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-044 | 配置一脚却影响其他引脚

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

配置PA5后，其他PA引脚模式同时改变。优先检查哪些寄存器操作？

### 参考答案

**口述核心：** 优先检查是否整组覆盖CRL、字段位置错误或清除掩码范围过大。

#### 回答要点

- CRL共享八个引脚；对照修改前后值定位改变的位，确认新值仅落在[23:20]，再查并发或后续初始化覆盖。

#### 易错点与边界

不能只改目标引脚现象而忽视其他引脚配置已经被破坏。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第46题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-045 | 上拉输入不稳定的寄存器排查

标签：GPIO, STM32F103RCT6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103RCT6。

一个接地按键使用PC1内部上拉，却读数不稳定。应检查哪些字段与外部条件？

### 参考答案

**口述核心：** 核对PC1字段为输入上下拉且ODR1选择上拉，再检查接线、电源和机械抖动。

#### 回答要点

- GPIOC_CRL[7:4]应为0x8、ODR1为1；同时确认正确端口、有效输入路径、共地、外部负载与消抖策略。

#### 易错点与边界

内部上拉不能消除机械抖动，也不能克服任意强干扰或外部强驱动。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第47题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-046 | 输出字段的定位与计算

标签：GPIO, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

将PA0、PA3、PA5、PA8、PA9分别设置为：2 MHz推挽、10 MHz推挽、2 MHz推挽、2 MHz推挽、2 MHz开漏。分别给出寄存器、字段范围和值。

### 参考答案

**口述核心：** 先定位端口和四位字段，再按输出类型与速度组合编码。

#### 回答要点

- PA0：CRL[3:0]=0x2；PA3：CRL[15:12]=0x1；PA5：CRL[23:20]=0x2；PA8：CRH[3:0]=0x2；PA9：CRH[7:4]=0x6。

#### 易错点与边界

只改目标字段并保留相邻配置；这是同一计算方法的多组输入，不要求背库枚举。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第19题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第20题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第21题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第22题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第23题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-051 | 输入模式与偏置的组合计算

标签：GPIO, STM32F103RCT6, 计算题, 寄存器与机制
难度：进阶

### 题目

适用芯片：STM32F103RCT6。

给出PC1上拉输入、PC6浮空输入、PC13下拉输入的字段位置、编码及必要ODR条件。

### 参考答案

**口述核心：** 上下拉字段为0x8并配合ODR方向；浮空字段为0x4。

#### 回答要点

- PC1：GPIOC_CRL[7:4]=0x8，ODR1=1；PC6：CRL[27:24]=0x4；PC13：CRH[23:20]=0x8，ODR13=0。

#### 易错点与边界

特殊引脚需核对备份域和外部连接；输入模式下不要套用输出驱动的结论。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第24题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第25题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第26题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-057 | 按位置位与复位后的锁存值

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

PA8原锁存为0，向BSRR低半区bit8写1后怎样变化？若之后向BRR bit8写1，又怎样变化？

### 参考答案

**口述核心：** 先置为1，再复位为0。

#### 回答要点

- 这是对ODR相应锁存位的修改；其他输出位不受该写入影响。
- 判断LED亮灭还需知道模式、接线和有效电平。

#### 易错点与边界

不能从锁存值直接推断外部负载一定达到相同电压。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第40题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第41题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-058 | 用输入寄存器与掩码判断电平

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

PC1已配置有效数字输入。读取IDR后与1U左移1进行按位与，结果为0，说明什么？能否由此认定发生一次按下？

### 参考答案

**口述核心：** 结果为0表示本次采样PC1输入位为低，不直接说明一次新的按下事件。

#### 回答要点

- 掩码只提取bit1，需结合上拉、接线与有效电平解释。
- 一次按下还需要消抖、前后状态与重复触发规则。

#### 易错点与边界

假设读取时输入路径有效；低电平也可能由短路或外部驱动造成，不能仅据单次采样认定物理按键动作。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第35题；10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第27题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-079 | GPIO复位值与特殊引脚

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

CRL/CRH的0x44444444复位值代表什么？为什么仍不能把所有引脚上电行为都当作普通浮空GPIO？

### 参考答案

**口述核心：** 每个四位字段0x4代表输入浮空，但调试及备份域等特殊引脚还有专门规则。

#### 回答要点

- 先解码MODE=00、CNF=01，再核对调试端口默认复用、备份域和外部电路；寄存器默认值与实际板上电压不是同一事实。

#### 易错点与边界

必须结合复位类型和特殊功能说明，不能用通用复位值覆盖所有引脚例外。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第10题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-080 | GPIO输出不受控的排查顺序

标签：GPIO, STM32F103RCT6, 故障排查, 寄存器与机制
难度：综合

### 题目

适用芯片：STM32F103RCT6。

PA8输出与软件预期不一致，怎样沿时钟、配置、输出数据和外部电路逐层定位？

### 参考答案

**口述核心：** 从端口时钟、端口引脚、模式复用、输出数据和实际电路逐层核对。

#### 回答要点

- 读回RCC门控和CRH字段，确认引脚未被外设或其他代码重新配置，核对ODR与实际电压，再检查负载、电源、地和接线。

#### 易错点与边界

先保留故障现场；一次寄存器读回正确不能排除间歇覆盖或电气问题。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第45题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。

## gpio-081 | PC13的特殊电气限制

标签：GPIO, STM32F103RCT6, 概念题, 寄存器与机制
难度：基础

### 题目

适用芯片：STM32F103RCT6。

为什么PC13不能照搬普通GPIO的大电流输出方案？应查询哪些具体约束？

### 参考答案

**口述核心：** PC13经特殊电源开关供电，输出电流和速度等能力受额外限制。

#### 回答要点

- 查DS5792引脚表脚注及输出特性，核对PC13至PC15的电流、最大负载与速度限制，并确认备份域相关功能占用。

#### 易错点与边界

不把绝对最大值当推荐工作点；驱动负载必须结合该数据手册与真实电路，本题不代替测量验收。

#### 来源与适用条件

原始资料：10-GPIO/第二层-寄存器/GPIO 第二层 寄存器 自测题.md 第48题。

[ST RM0008：GPIO/AFIO、RCC、EXTI与低功耗相关章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)。
