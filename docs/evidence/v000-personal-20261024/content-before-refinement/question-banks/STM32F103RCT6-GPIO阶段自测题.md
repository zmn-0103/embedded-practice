---
schema_version: 1
topic_id: stm32f103-gpio
topic_title: STM32F103RCT6 GPIO 阶段自测题
---

## gpio-001 | GPIO名称与输入输出

标签：GPIO, 概念辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

GPIO 的英文全称是什么？GPIO 输入与输出的区别是什么？

### 参考答案

**核心结论：** GPIO是General-Purpose Input/Output，输入读取外部电平，输出驱动外部电路。

**必要解释：** 在F1上分别涉及输入采样路径和输出锁存/驱动路径；读取电平与决定输出不是同一个动作。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-002 | GPIO时钟依赖

标签：GPIO, RCC, 初始化
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么配置 GPIO 之前通常需要使能对应端口的外设时钟？

### 参考答案

**核心结论：** 配置前先使能对应GPIO端口时钟。

**必要解释：** 寄存器访问和外设工作依赖时钟门控；软件结构体赋值本身不会开启RCC时钟。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-003 | GPIO端口总线

标签：GPIO, 时钟树
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

STM32F103 的 GPIOA、GPIOC 使用哪条总线的外设时钟？

### 参考答案

**核心结论：** GPIOA和GPIOC的外设时钟由APB2控制。

**必要解释：** 应使能实际用到的端口位，不把GPIO时钟与CPU主频混为一谈。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-004 | SystemCoreClockUpdate职责

标签：RCC, 时钟树, 函数辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`SystemCoreClockUpdate()` 的作用是什么？它能否替代 GPIO 外设时钟使能？

### 参考答案

**核心结论：** 它根据时钟寄存器更新SystemCoreClock软件变量，不能替代GPIO时钟使能。

**必要解释：** 它既不直接切换系统时钟，也不替调用者设置GPIOxEN。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-005 | 通用与复用输出

标签：GPIO, 复用功能
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

GPIO 的通用输出和复用输出有什么区别？

### 参考答案

**核心结论：** 通用输出由ODR路径控制，复用输出由所选外设驱动信号。

**必要解释：** 复用模式仍需配置外设本身、映射和相应时钟。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-006 | 推挽与开漏

标签：GPIO, 电气特性
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

推挽输出与开漏输出的主要区别是什么？

### 参考答案

**核心结论：** 推挽主动驱动高低电平；开漏主动拉低或释放，释放后的高电平通常依赖上拉。

**必要解释：** 上拉电压、电流、RC上升沿和器件耐压均需满足要求，释放不能等同于主动输出高。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-007 | GPIO输出速度配置

标签：GPIO, 驱动速度
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Speed_2MHz` 表示什么？它是否表示 MCU 主频为 2 MHz？

### 参考答案

**核心结论：** GPIO_Speed_2MHz是F1输出驱动速度档位，不是CPU主频。

**必要解释：** 它约束驱动能力与边沿表现，不自动产生2MHz波形；实际翻转还受负载和软件/外设时序影响。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-008 | 输入默认电平

标签：GPIO, 上下拉
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么输入引脚可能需要上拉或下拉？

### 参考答案

**核心结论：** 上拉/下拉为无人驱动的输入提供默认电平，降低悬空带来的不确定读数。

**必要解释：** 内部弱拉不能替代所有外部电路设计，应考虑漏电、干扰与外部驱动能力。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-009 | 按键有效电平

标签：GPIO, 按键, 电平分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

输入上拉模式下，按键按下不一定是高电平，为什么？

### 参考答案

**核心结论：** 按下的逻辑电平由按键接线决定，输入上拉不意味着按下为高。

**必要解释：** 若按键将输入接地，松开由上拉得到高，按下得到低；反向接线应重新分析。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-010 | 复用引脚与外设初始化

标签：GPIO, 复用功能, 初始化
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么配置为复用输出后，还需要配置对应的片上外设？

### 参考答案

**核心结论：** 仅配置复用输出不足以产生目标外设信号。

**必要解释：** 还需配置对应外设、时钟、映射和使能状态；引脚模式只确定输出路径。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-011 | GPIO初始化结构体

标签：GPIO, SPL, 函数辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_InitTypeDef` 结构体中最重要的三个成员是什么？分别有什么作用？

### 参考答案

**核心结论：** 主要成员为GPIO_Pin、GPIO_Mode、GPIO_Speed，分别选择引脚掩码、工作模式和输出速度档位。

**必要解释：** 可合并配置同端口同模式的多个引脚；输入模式下Speed不决定采样速率。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-012 | GPIO_Init参数

标签：GPIO, SPL, 函数辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Init(GPIOA, &GPIO_InitStructure)` 中两个参数分别表示什么？

### 参考答案

**核心结论：** GPIOA指定端口，&GPIO_InitStructure提供初始化结构体地址。

**必要解释：** 第二个参数是有效配置对象指针，不能把结构体内容或另一个端口误传为地址。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-013 | GPIOA时钟使能调用

标签：GPIO, RCC, SPL
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE)` 的作用是什么？

### 参考答案

**核心结论：** 该调用使能APB2上的GPIOA时钟。

**必要解释：** 它不配置PA引脚模式，不替代GPIO_Init，也不使能任意其他端口。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-014 | GPIO置位和复位接口

标签：GPIO, SPL, 位操作
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_SetBits()` 与 `GPIO_ResetBits()` 有什么区别？

### 参考答案

**核心结论：** SetBits把指定ODR位置1，ResetBits把指定ODR位清0。

**必要解释：** 对外部LED意味着亮还是灭取决于电路有效电平，不能仅按函数名字推断。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-015 | 读取单个输入位

标签：GPIO, SPL, 返回值
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_ReadInputDataBit()` 返回什么类型的结果？`Bit_SET` 和 `Bit_RESET` 分别代表什么？

### 参考答案

**核心结论：** GPIO_ReadInputDataBit返回uint8_t，Bit_SET表示采样高，Bit_RESET表示采样低。

**必要解释：** 返回的是归一化逻辑状态而不是完整端口掩码；按键事件还需结合有效电平和消抖。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-016 | IDR与ODR读取

标签：GPIO, 寄存器, 函数辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_ReadInputDataBit()` 与 `GPIO_ReadOutputDataBit()` 有什么区别？

### 参考答案

**核心结论：** ReadInputDataBit读IDR的采样输入，ReadOutputDataBit读ODR输出锁存值。

**必要解释：** 开漏释放或外部负载等情况下，锁存值不保证等于实际引脚电平。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-017 | 输入模式中的Speed成员

标签：GPIO, 驱动速度
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

输入模式下设置 `GPIO_Speed` 是否决定输入信号的采样速度？为什么？

### 参考答案

**核心结论：** 输入模式下GPIO_Speed不决定输入采样速度。

**必要解释：** 该成员服务于输出模式配置；输入能力应查输入电气与时序要求。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-018 | 旧C模式的局部声明

标签：C语言, 编译模式
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么建议在函数或代码块开头声明局部变量，以兼容较老的 C 编译模式？

### 参考答案

**核心结论：** 将声明放在代码块开头可兼容C90等不支持混合声明的编译模式。

**必要解释：** C99及后续允许声明与语句混合；这属于工具链/语言约束，不是STM32硬件要求。为保护既有身份，本题保留在原专题。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-019 | F1 GPIO输入模式

标签：GPIO, 输入模式
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

STM32F103 的 GPIO 有哪些常见输入模式？

### 参考答案

**核心结论：** 常见模式为模拟输入、浮空输入和上拉/下拉输入。

**必要解释：** 模拟输入关闭数字输入缓冲相关路径；上下拉选择还涉及ODR位。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-020 | F1 GPIO输出模式

标签：GPIO, 输出模式
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

STM32F103 的 GPIO 有哪些常见输出模式？

### 参考答案

**核心结论：** 包括通用推挽、通用开漏、复用推挽、复用开漏。

**必要解释：** 模式决定信号来源和驱动结构，速度档位另由MODE字段控制。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-021 | Out_PP含义

标签：GPIO, SPL, 模式辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Mode_Out_PP` 表示什么？

### 参考答案

**核心结论：** GPIO_Mode_Out_PP表示通用推挽输出。

**必要解释：** 信号来自通用输出锁存路径，不会因为推挽配置自动变成外设复用输出。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-022 | Out_OD含义

标签：GPIO, SPL, 模式辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Mode_Out_OD` 表示什么？

### 参考答案

**核心结论：** GPIO_Mode_Out_OD表示通用开漏输出。

**必要解释：** 写0拉低，写1释放；得到有效高电平还需合适上拉及电气条件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-023 | AF_PP含义

标签：GPIO, SPL, 模式辨析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Mode_AF_PP` 表示什么？

### 参考答案

**核心结论：** GPIO_Mode_AF_PP表示复用推挽输出。

**必要解释：** 输出由对应外设控制，仍需核对AFIO映射及外设配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-024 | 单引脚配置宽度

标签：GPIO, CRL, CRH
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

STM32F103 每个 GPIO 引脚占用多少位配置字段？

### 参考答案

**核心结论：** F1每个GPIO引脚占4位配置字段。

**必要解释：** 其中MODE占2位、CNF占2位；引脚选择掩码则通常每脚占1位。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-025 | CRL与CRH范围

标签：GPIO, CRL, CRH
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIOx_CRL` 和 `GPIOx_CRH` 分别配置哪些引脚？

### 参考答案

**核心结论：** CRL配置0至7号脚，CRH配置8至15号脚。

**必要解释：** CRH中字段位移使用引脚号减8，不能直接用4乘原引脚号。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-026 | MODE与CNF分工

标签：GPIO, 寄存器
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

GPIO 配置字段中的 MODE 与 CNF 分别负责什么？

### 参考答案

**核心结论：** MODE选择输入或输出速度档位，CNF解释具体输入/输出类型。

**必要解释：** 同一CNF编码在输入和输出模式下含义不同，必须结合MODE解释。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-027 | 2MHz推挽字段

标签：GPIO, 位字段
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

通用推挽输出、2 MHz 的 MODE 和 CNF 分别是什么？

### 参考答案

**核心结论：** MODE=10，CNF=00，四位字段为0010即0x2。

**必要解释：** 完整字段排列为CNF[1:0]在高两位、MODE[1:0]在低两位。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-028 | 2MHz开漏字段

标签：GPIO, 位字段
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

通用开漏输出、2 MHz 的 MODE 和 CNF 分别是什么？

### 参考答案

**核心结论：** MODE=10，CNF=01，四位字段为0110即0x6。

**必要解释：** 应先清旧字段再写新字段，不保留原配置中的1。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-029 | 上下拉输入字段

标签：GPIO, 位字段
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

输入上拉/下拉模式的 MODE 和 CNF 分别是什么？

### 参考答案

**核心结论：** MODE=00，CNF=10，四位字段为1000即0x8。

**必要解释：** ODR对应位另外选择上拉1或下拉0。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-030 | 上下拉方向选择

标签：GPIO, ODR, 上下拉
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

输入上拉与输入下拉在 CRL/CRH 中的配置字段有什么区别？

### 参考答案

**核心结论：** CRL/CRH字段相同，均为0x8；ODR位为1选上拉，为0选下拉。

**必要解释：** 仅改CRL/CRH不能区分上拉与下拉。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-031 | GPIO四类寄存器

标签：GPIO, 寄存器
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`IDR`、`ODR`、`BSRR`、`BRR` 分别有什么作用？

### 参考答案

**核心结论：** IDR读取输入，ODR保存输出锁存状态，BSRR按位置位/复位，BRR按位复位。

**必要解释：** BSRR/BRR用于命令式写入，不能当作引脚输入状态寄存器读取。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-032 | 输入状态与输出锁存

标签：GPIO, IDR, ODR
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么 `IDR` 和 `ODR` 不能当成同一个寄存器理解？

### 参考答案

**核心结论：** IDR反映输入采样，ODR反映输出锁存，二者不是同一物理含义。

**必要解释：** 引脚模式、外部负载和上拉会影响实际电平；读回ODR不能证明外电路已被正确驱动。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-033 | SetBits底层寄存器

标签：GPIO, SPL, BSRR
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_SetBits()` 底层主要操作哪个寄存器？

### 参考答案

**核心结论：** SPL V3.5.0的GPIO_SetBits向BSRR写入引脚掩码。

**必要解释：** 低16位中写1的位将对应ODR位置1，其他位不变。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-034 | ResetBits底层寄存器

标签：GPIO, SPL, BRR
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_ResetBits()` 底层主要操作哪个寄存器？

### 参考答案

**核心结论：** SPL V3.5.0的GPIO_ResetBits向BRR写入引脚掩码。

**必要解释：** F1也可用BSRR高16位复位，但本题问的是该版库函数实现。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-035 | BSRR上下半字

标签：GPIO, BSRR, 位操作
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

STM32F103 的 BSRR 低 16 位和高 16 位分别有什么作用？

### 参考答案

**核心结论：** BSRR低16位用于置位，高16位用于复位对应输出位。

**必要解释：** 每个写1位触发对应操作；通常用直接赋值写命令，避免无意义读改写。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-036 | 按位写入与并发

标签：GPIO, BSRR, 并发分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么使用 BSRR/BRR 控制单个输出位，可以避免某些读改写冲突？

### 参考答案

**核心结论：** BSRR/BRR直接作用于选定位，无需先读整个ODR再写回，可避免某些不同位的读改写丢失更新。

**必要解释：** 这不保证多个步骤的原子性，也不协调两个执行者对同一引脚的相反控制。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-037 | 引脚掩码计算

标签：GPIO, 位掩码, 计算题
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`GPIO_Pin_5` 的位掩码值是多少？

### 参考答案

**核心结论：** GPIO_Pin_5为1左移5位，即0x0020。

**必要解释：** 它是单引脚位掩码，不是PA5四位配置字段掩码。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-038 | 两类掩码辨析

标签：GPIO, 位掩码, 概念辨析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

引脚选择掩码和配置字段掩码有什么区别？

### 参考答案

**核心结论：** 引脚掩码用一位选一个脚；配置掩码用四位覆盖该脚的MODE/CNF。

**必要解释：** 例如PA5选择掩码为1左移5，CRL配置掩码为0xF左移20。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-039 | PA5配置位置

标签：GPIO, CRL, 计算题
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA5 对应 GPIOA_CRL 的哪 4 位？

### 参考答案

**核心结论：** PA5对应CRL的bit23:20。

**必要解释：** 每脚4位，起始偏移4乘5等于20。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-040 | PA5字段掩码

标签：GPIO, 位掩码, 计算题
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么 `0x0F << 20` 可以覆盖 PA5 的配置字段？

### 参考答案

**核心结论：** 0xF左移20使四个1落在bit23:20。

**必要解释：** 用该掩码清除旧PA5字段，其余引脚字段应保留。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-041 | 清字段运算

标签：C语言, 位操作
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`tmpreg &= ~pinmask` 的作用是什么？

### 参考答案

**核心结论：** tmpreg按位与取反的pinmask，会把掩码内位清0，保留其他位。

**必要解释：** 要求pinmask精确覆盖目标字段，且整数宽度与移位合法。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-042 | 写入新字段

标签：C语言, 位操作
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

`tmpreg |= (currentmode << pos)` 的作用是什么？

### 参考答案

**核心结论：** 将currentmode移到pos后按位或，能把新字段写入已清零位置。

**必要解释：** 前提是模式值不超字段宽度，目标旧字段已清除且寄存器适用普通读改写。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-043 | 为什么先清后写

标签：C语言, 位字段, 边界分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么不能仅使用按位或来覆盖一个已经存在的配置字段？

### 参考答案

**核心结论：** 按位或只能把0变1，不能把旧字段中的1变0。

**必要解释：** 更新任意字段应先清掩码，再插入受限宽度的新值，并考虑并发与寄存器副作用。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-044 | 保留相邻引脚配置

标签：GPIO, CRL, 边界分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么修改 PA5 的配置时，不应该把整个 GPIOA_CRL 清零？

### 参考答案

**核心结论：** 清整个CRL会同时改变PA0至PA7的配置。

**必要解释：** 只清PA5对应四位，避免破坏其他模块正在使用的引脚。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-045 | 输入上拉的两处配置

标签：GPIO, 上下拉, ODR
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PC1 输入上拉时，为什么除了设置 CRL，还需要设置对应的输出数据位？

### 参考答案

**核心结论：** PC1的CRL字段设为0x8后，还要使ODR1=1选择上拉。

**必要解释：** 字段只选择上下拉输入类型，ODR位决定方向。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-046 | PA0推挽配置计算

标签：GPIO, CRL, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA0 配置为推挽输出、2 MHz。应使用哪个寄存器？配置字段在哪 4 位？字段值是多少？

### 参考答案

**核心结论：** 使用GPIOA_CRL的bit3:0，字段为0x2。

**必要解释：** MODE=10、CNF=00；读改写时其他28位保留。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-047 | PA3的10MHz推挽字段

标签：GPIO, CRL, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA3 配置为推挽输出、10 MHz。应使用哪个寄存器？配置字段在哪 4 位？MODE、CNF 和最终字段值分别是什么？

### 参考答案

**核心结论：** 使用GPIOA_CRL bit15:12，MODE=01、CNF=00，字段为0x1。

**必要解释：** 完整配置值应移位12；10MHz是输出档位而非自动输出频率。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-048 | PA5推挽配置计算

标签：GPIO, CRL, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA5 配置为推挽输出、2 MHz。应使用哪个寄存器？位范围是什么？字段值是多少？

### 参考答案

**核心结论：** 使用GPIOA_CRL bit23:20，字段为0x2。

**必要解释：** 目标掩码为0xF左移20，新值为0x2左移20。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-049 | PA8推挽配置计算

标签：GPIO, CRH, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA8 配置为推挽输出、2 MHz。应使用哪个寄存器？位范围是什么？字段值是多少？

### 参考答案

**核心结论：** 使用GPIOA_CRH bit3:0，字段为0x2。

**必要解释：** PA8是CRH管理的第一个引脚，位移为0。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-050 | PA9开漏配置计算

标签：GPIO, CRH, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA9 配置为通用开漏输出、2 MHz。应使用哪个寄存器？位范围是什么？字段值是多少？

### 参考答案

**核心结论：** 使用GPIOA_CRH bit7:4，字段为0x6。

**必要解释：** CNF=01、MODE=10；高电平依赖外部电路而非推挽上管。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-051 | PC1上拉配置计算

标签：GPIO, CRL, 上下拉
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PC1 配置为输入上拉。应使用哪个寄存器？位范围是什么？MODE、CNF 和字段值分别是什么？

### 参考答案

**核心结论：** 使用GPIOC_CRL bit7:4，MODE=00、CNF=10、字段0x8，并使ODR1=1。

**必要解释：** 只写四位配置而不选择ODR方向，可能得到下拉而非上拉。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-052 | PC6浮空配置计算

标签：GPIO, CRL, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PC6 配置为输入浮空。应使用哪个寄存器？位范围是什么？MODE、CNF 和字段值分别是什么？

### 参考答案

**核心结论：** 使用GPIOC_CRL bit27:24，MODE=00、CNF=01，字段0x4。

**必要解释：** 浮空输入的实际电平由外部驱动决定，未连接时不能假定稳定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-053 | PC13下拉配置计算

标签：GPIO, CRH, 上下拉
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PC13 配置为输入下拉。应使用哪个寄存器？位范围是什么？MODE、CNF 和字段值分别是什么？

### 参考答案

**核心结论：** 使用GPIOC_CRH bit23:20，MODE=00、CNF=10、字段0x8，ODR13=0。

**必要解释：** 位移4乘(13减8)=20；该输入配置不要求把PC13当输出驱动负载。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-054 | PA3配置掩码

标签：GPIO, 位掩码, 计算题
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA3 对应的配置字段掩码表达式是什么？

### 参考答案

**核心结论：** 掩码为0xFUL左移12，即0x0000F000。

**必要解释：** 它覆盖CRL bit15:12，区别于选择PA3的0x0008。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-055 | PA8配置掩码

标签：GPIO, 位掩码, 计算题
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

PA8 对应的配置字段掩码表达式是什么？

### 参考答案

**核心结论：** 掩码为0xFUL左移0，即0x0000000F。

**必要解释：** 该掩码用于CRH，不是CRL，也不是引脚选择掩码0x0100。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-056 | 1111改为0010

标签：GPIO, 位字段, 计算题
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 PA5 原来的配置是 1111，现在要改成 0010，为什么必须先清除旧字段？

### 参考答案

**核心结论：** 先清PA5四位再写0010；直接或0010仍得到1111。

**必要解释：** 保留其他引脚配置，再检查写入值没有超出目标字段。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-057 | BSRR写入后的ODR

标签：GPIO, BSRR, 状态推导
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 PA8 对应的输出数据位为 0，执行 `GPIOA->BSRR = GPIO_Pin_8` 后，该位如何变化？

### 参考答案

**核心结论：** ODR8由0变1，其他未选择的输出位不受影响。

**必要解释：** 该结论针对锁存位；实际PA8电平还取决于模式与外部电路。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-058 | 低电平输入与掩码

标签：GPIO, IDR, 位操作
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 PC1 当前为低电平，`GPIOC->IDR & GPIO_Pin_1` 的结果是什么？为什么？

### 参考答案

**核心结论：** 结果为0，因为IDR1为0，与GPIO_Pin_1按位与后无置位位。

**必要解释：** 若为高电平，未归一化的按位与结果为0x0002而非必然为1。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-059 | 训练板LED接线条件

标签：GPIO, LED, 电路分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

给定本题训练板接线：LED0阳极通过限流电阻接3.3V，阴极接PA8。在STM32F103 GPIO输出控制下，LED0连接哪个引脚，低电平还是高电平点亮？

### 参考答案

**核心结论：** 按明确题设，LED0接PA8，PA8拉低时点亮。

**必要解释：** 电流从3.3V经限流电阻和LED流向PA8；这是题设电路，不是对所有开发板的实物认定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-060 | 训练板按键接线条件

标签：GPIO, 按键, 电路分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

给定本题训练板接线：KEY0连接PC1与地，松开时断路，PC1配置输入上拉。KEY0连接哪个引脚，按下时读到什么电平？

### 参考答案

**核心结论：** 按明确题设，KEY0接PC1，按下接地读低。

**必要解释：** 松开由上拉提供高电平；实物接线与键名仍需核对原理图。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-061 | 上拉按键的读数

标签：GPIO, 按键, 上下拉
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么 KEY0 配置为输入上拉后，松开通常读取 `Bit_SET`，按下读取 `Bit_RESET`？

### 参考答案

**核心结论：** 在PC1上拉、KEY0按下接地的题设下，松开为Bit_SET，按下为Bit_RESET。

**必要解释：** 内部上拉提供弱默认高，闭合触点把输入拉低；抖动期间会短时反复变化。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-062 | 复位输出与LED

标签：GPIO, LED, 状态推导
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 PA8 已配置为推挽输出，执行 `GPIO_ResetBits(GPIOA, GPIO_Pin_8)` 后，LED0 会发生什么？

### 参考答案

**核心结论：** 按LED0低有效且PA8推挽的题设，ResetBits拉低PA8，LED点亮。

**必要解释：** 先满足时钟、模式、限流和供电条件，才能由锁存值推断正常电路表现。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-063 | 置位输出与LED

标签：GPIO, LED, 状态推导
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果执行 `GPIO_SetBits(GPIOA, GPIO_Pin_8)`，LED0 会发生什么？

### 参考答案

**核心结论：** 按LED0低有效且PA8推挽的题设，SetBits使PA8输出高，LED熄灭。

**必要解释：** 高电平与LED阳极供电接近时无正常正向导通电压；不同接线需另分析。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-064 | 低电平能否认定按下

标签：GPIO, 按键, 边界分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 `GPIO_ReadInputDataBit(GPIOC, GPIO_Pin_1)` 返回 `Bit_RESET`，能否直接判断 KEY0 已按下？需要哪些前提？

### 参考答案

**核心结论：** 需确认PC1模式、低有效接线、供电和线路正常，并通过消抖后才生成可靠按键事件。

**必要解释：** 接地短路、引脚配置错误或噪声也可能造成低电平，单次Bit_RESET不足以独立证明一次有效按下。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-065 | 遗漏时钟的初始化故障

标签：GPIO, RCC, 初始化
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果 GPIOA 时钟未使能，后续 GPIO 初始化可能出现什么问题？

### 参考答案

**核心结论：** GPIO寄存器配置可能不能按预期生效，导致引脚行为异常。

**必要解释：** 先核对端口对应的APB2时钟门控及复位状态，不把结构体赋值当作成功初始化。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-066 | 按键脚误设输出

标签：GPIO, 按键, 故障分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果把 PC1 错误配置为输出，读取 KEY0 的程序会有什么风险？

### 参考答案

**核心结论：** 可能读不到真实按键输入，输出高时按键接地还可能造成电气争用。

**必要解释：** 应恢复正确输入模式并检查电流限制；不能仅用修改判断条件掩盖硬件模式错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-067 | 上电LED短时点亮

标签：GPIO, LED, 初始化时序
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果程序在初始化后立即调用 `GPIO_ResetBits()`，而 LED0 是低电平点亮，可能观察到什么现象？

### 参考答案

**核心结论：** 低有效LED在初始化后立即ResetBits时会点亮，后续逻辑若再置高则可能表现为闪一下。

**必要解释：** 实际是否看见闪烁还受持续时间、初始模式及电路影响，不能保证所有板上都可见。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-068 | 输出预置减少毛刺

标签：GPIO, ODR, 初始化时序
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么在初始化 GPIO 输出之前预先设置期望的输出数据状态，有时可以减少启动时的 LED 闪烁？

### 参考答案

**核心结论：** 先预置期望ODR值再切输出，可避免输出使能瞬间使用不期望的旧锁存值。

**必要解释：** 需按电路安全电平安排初始化并核对复位状态；不保证消除供电等其他来源的毛刺。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

**待核实：** 训练板LED0=PA8低有效、KEY0=PC1低有效只作为题设；实物原理图与接线未核验。

## gpio-069 | 机械触点抖动

标签：GPIO, 按键, 消抖
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

什么是机械按键抖动？

### 参考答案

**核心结论：** 机械触点接通和断开时会短时反复导通/断开，使输入多次变化。

**必要解释：** 抖动持续时间因器件、磨损和动作而异，不宜把单一固定延时视为普遍保证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-070 | 一次按键被重复识别

标签：GPIO, 按键, 事件分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么一次真实按键动作可能被程序识别为多次动作？

### 参考答案

**核心结论：** 若把每次电平跳变都当作事件，触点抖动会把一次动作变成多次触发。

**必要解释：** 应先稳定判定，再按边沿和状态生成按下/松开事件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-071 | 延时确认消抖流程

标签：GPIO, 消抖, 流程分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

简单延时确认法的基本步骤是什么？

### 参考答案

**核心结论：** 首次采样、等待、再次采样，一致时按有效电平处理，不一致时保持原状态。

**必要解释：** 这是简单两点确认，不能证明等待期间持续稳定，也应避免长按反复产生事件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-072 | 消抖采样间隔

标签：GPIO, 消抖
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

两次采样之间为什么需要延时？

### 参考答案

**核心结论：** 间隔为触点稳定留出时间，避免两次采样落在同一个瞬时抖动上。

**必要解释：** 间隔应基于按键特性与响应要求选择，过长会降低响应。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-073 | 两次采样不一致

标签：GPIO, 消抖, 状态推导
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

如果两次采样结果不同，本次实验应该如何处理 LED 状态？

### 参考答案

**核心结论：** 按本实验策略保持LED原状态，等待下一次稳定确认。

**必要解释：** 不一致代表本次确认失败，不能凭第二次瞬时值断言一次可靠按键。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-074 | 一致采样与有效电平

标签：GPIO, 消抖, 电平分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

两次采样结果相同，是否代表按键一定松开？为什么？

### 参考答案

**核心结论：** 不能；在低有效按键题设中，一致高表示松开，一致低表示按下。

**必要解释：** 一致只说明这两个采样点相同，仍不等于证明整个区间没有抖动。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-075 | 两点消抖的局限

标签：GPIO, 消抖, 边界分析
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么简单延时确认法不保证过滤所有抖动？

### 参考答案

**核心结论：** 两点相同可能碰巧采到相同相位，抖动时间也可能超过等待时间。

**必要解释：** 更严格策略可要求连续稳定一段时间；仍需按实际采样周期、延迟与硬件验证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-076 | 阻塞延时的代价

标签：GPIO, 消抖, 时序分析
难度：基础

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

延时消抖的缺点是什么？

### 参考答案

**核心结论：** 忙等式延时消耗CPU并延迟其他工作，可能错过实时事件。

**必要解释：** 若使用调度睡眠则未必持续占CPU，但当前任务仍被阻塞；应区分两种实现。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-077 | 消抖与事件状态机

标签：GPIO, 消抖, 状态机
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

为什么消抖与完整的按键事件管理不是同一件事？

### 参考答案

**核心结论：** 消抖判断电平稳定，事件管理还需识别按下、保持、松开、长按及重复规则。

**必要解释：** 稳定低不能在每次循环都记作新的按下；应使用已确认状态与前一状态生成事件。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## gpio-078 | 非阻塞消抖取舍

标签：GPIO, 消抖, 状态机
难度：进阶

### 题目

以STM32F103RCT6为平台；提到标准外设库时使用SPL V3.5.0。涉及LED0/KEY0时给定训练电路：LED0阳极经限流电阻接3.3V、阴极接PA8；KEY0按下将PC1接地，PC1上拉。实物接线未核验。

后续使用定时器或状态机实现非阻塞消抖，有什么潜在优势？

### 参考答案

**核心结论：** 定时采样和状态机可在等待稳定期间处理其他任务，并明确事件与响应时间。

**必要解释：** 优势依赖正确采样调度和状态转换；没有实现与测量时不能声称已经降低延迟或通过硬件验收。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。
