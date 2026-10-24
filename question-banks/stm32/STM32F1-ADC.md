---
schema_version: 1
topic_id: stm32f103-adc
topic_title: STM32F1 ADC
---

## adc1-004 | PC0的ADC通道

标签：ADC, 通道映射, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 通道映射

在 STM32F103 的 ADC1/ADC2 外部通道映射中，PC0 对应哪个通道？

A. Channel 0。

B. Channel 1。

C. Channel 10。

D. Channel 15。

### 参考答案

**核心结论：** 选C，ADC1/ADC2外部输入PC0对应Channel10。

**必要解释：** 通道号与GPIO位号不总相等；封装是否引出仍需查数据手册。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-005 | PA0模拟输入配置

标签：ADC, GPIO, SPL, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

GPIO 配置

使用 ADC1 读取 PA0 的模拟电压时，PA0 应配置为什么模式？

A. GPIO_Mode_Out_PP。

B. GPIO_Mode_IPU。

C. GPIO_Mode_AF_PP。

D. GPIO_Mode_AIN。

### 参考答案

**核心结论：** 选D，PA0配置为GPIO_Mode_AIN。

**必要解释：** 同时需选择ADC1的Channel0；GPIO模式不自动设置转换序列。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-007 | ADC六分频计算

标签：ADC, 时钟, 计算题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 时钟

假设 PCLK2 为 72 MHz，选择 ADC 6 分频后，ADC 时钟为多少？

A. 6 MHz。

B. 9 MHz。

C. 12 MHz。

D. 18 MHz。

### 参考答案

**核心结论：** 选C，72MHz除以6得到12MHz。

**必要解释：** 还需满足芯片ADC时钟范围与采样要求，GPIO速度档位不决定ADC时钟。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-008 | 连续转换的含义

标签：ADC, 转换模式, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

连续转换模式

ADC 开启连续转换模式后，典型行为是什么？

A. ADC 只能转换一次，之后永久停止。

B. ADC 自动重复执行规则转换任务，直到停止或受到其他配置限制。

C. ADC 自动关闭 GPIO 模拟输入。

D. ADC 同时转换所有通道。

### 参考答案

**核心结论：** 选B，按配置自动重复规则转换任务，直到停止或受其他条件限制。

**必要解释：** 连续模式不代表所有通道同时转换；多通道次序由序列/扫描配置决定。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-009 | 扫描模式的作用

标签：ADC, 转换模式, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

扫描模式

ADC 扫描模式主要控制什么？

A. ADC 时钟的分频系数。

B. ADC 数据的左右对齐。

C. 按照规则序列依次转换多个通道。

D. ADC 是否执行校准。

### 参考答案

**核心结论：** 选C，按规则序列转换配置的多个通道。

**必要解释：** 扫描决定序列，连续决定是否重复，二者是不同维度。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-010 | EOC状态含义

标签：ADC, EOC, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

EOC 标志

STM32F103 的 ADC 中，EOC 主要表示什么？

A. GPIO 初始化完成。

B. ADC 时钟配置完成。

C. ADC 校准完成。

D. 规则通道的一次转换已经完成。

### 参考答案

**核心结论：** 选D，规则通道的一次转换完成。

**必要解释：** 在多通道场景不要把每次EOC当作整套序列缓存已自动保存。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-011 | 右对齐数据位置

标签：ADC, 数据对齐, 单选题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

数据对齐

ADC 使用右对齐模式时，12 位转换结果位于数据寄存器的哪些位？

A. bit 15～bit 4。

B. bit 11～bit 0。

C. bit 15～bit 12。

D. bit 7～bit 0。

### 参考答案

**核心结论：** 选B，12位结果位于bit11:0。

**必要解释：** 左对齐时需按位置提取；对齐错误会使数值换算出现倍数错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-014 | ADC实例与通道编号

标签：ADC, 通道映射, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC1 和 ADC 通道 1 表示同一个概念。

### 参考答案

**核心结论：** 错误。ADC1是外设实例，Channel1是该转换器可选择的一路输入。

**必要解释：** 同一个ADC可选择多个通道，不能根据外设编号推导输入引脚。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-015 | GPIO与通道选择独立

标签：ADC, GPIO, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

将 PA0 配置为模拟输入后，ADC1 就会自动选择 Channel 0。

### 参考答案

**核心结论：** 错误。配置PA0模拟输入不会自动选择ADC1 Channel0。

**必要解释：** 还需配置规则序列、Rank、采样时间、使能及触发。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-017 | F103 ADC时钟上限

标签：ADC, 时钟, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

STM32F103 的 ADC 时钟最高允许频率为 14 MHz。

### 参考答案

**核心结论：** 正确。DS5792规定ADC时钟最高14MHz，实际运行还受其他条件约束。

**必要解释：** 不是所有STM32系列的通用上限；更低频率也要满足该芯片工作范围及吞吐量要求。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-018 | 扫描与连续可组合

标签：ADC, 转换模式, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

扫描模式控制通道序列，连续模式控制是否自动重复转换，两者可以组合使用。

### 参考答案

**核心结论：** 正确。扫描组织通道序列，连续模式控制是否自动重复，两者可按配置组合。

**必要解释：** 连续扫描仍需及时保存每通道结果，并核对触发和DMA等配置。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-019 | ADC_DR与历史缓存

标签：ADC, 数据寄存器, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC_DR 是一个能够自动保存所有通道历史转换结果的数组。

### 参考答案

**核心结论：** 错误。ADC_DR不是保存全部通道历史的数组。

**必要解释：** 新结果可能覆盖旧结果；需要按转换顺序及时读取或用DMA等保存到内存。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-020 | 启动后立即读取

标签：ADC, EOC, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 转换启动后，程序可以立即读取 ADC_DR，并且能够保证读到本次转换的新结果。

### 参考答案

**核心结论：** 错误。刚启动就读DR不能保证是本次新结果。

**必要解释：** 应按采集方案确认完成事件/数据就绪，再读取对应结果。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-021 | F1校准阶段

标签：ADC, 校准, 判断题
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

STM32F1 ADC 的典型校准流程包含复位校准和启动校准两个阶段。

### 参考答案

**核心结论：** 正确。典型流程包括复位校准并等完成，再启动校准并等完成。

**必要解释：** 需满足ADC上电稳定和手册要求，等待应有超时；不是每次采样前都机械重复校准。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-025 | GPIO通道与外设职责

标签：ADC, 通道映射, 概念辨析
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 通道与 GPIO

假设使用 ADC1 读取 PA0 上的模拟电压。

请分别说明：

1. GPIO 引脚是什么？
2. ADC 通道是什么？
3. ADC 外设是什么？
4. 为什么 GPIO 配置和 ADC 通道选择必须分别完成？

### 参考答案

**核心结论：** PA0是引脚，Channel0是模拟输入通道，ADC1是转换器实例；分别配置引脚电气模式与转换选择。

**必要解释：** 端口配置不能替代规则序列，选对通道也不能补救引脚模式或接线错误。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-026 | 采样与转换阶段

标签：ADC, 转换时间, 时序分析
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

采样时间与转换时间

解释采样时间和转换时间的区别。

STM32F103 的 12 位 ADC 转换阶段需要多少个 ADC 时钟周期？

一次转换的总时间由哪些部分组成？

### 参考答案

**核心结论：** 采样时间用于输入建立，12位逐次逼近转换阶段需12.5个ADC时钟；总时间为采样周期加12.5周期再除ADC频率。

**必要解释：** 这是一次转换本体的典型计时，外部触发延迟、软件等待和数据搬运另计。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-027 | 三种转换模式辨析

标签：ADC, 转换模式
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

转换模式

解释以下三个模式的区别：

1. 单次转换模式。
2. 连续转换模式。
3. 扫描转换模式。

为什么扫描模式与连续转换模式不是同一个概念？

### 参考答案

**核心结论：** 单次完成一次规则转换任务，连续自动重复，扫描按规则序列访问多个通道。

**必要解释：** 扫描不等于连续，也不意味着通道同时采样；需结合序列长度和触发配置解释。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-028 | EOC与数据寄存器

标签：ADC, EOC, 寄存器
难度：基础

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

EOC 与 ADC_DR

分别说明 EOC 和 ADC_DR 的作用。

为什么启动转换后，程序通常需要先检查 EOC，再读取转换结果？

### 参考答案

**核心结论：** EOC报告转换完成，ADC_DR提供转换结果；先确认就绪可避免读到旧值。

**必要解释：** 连续/扫描下还需在结果被覆盖前及时取走并正确关联通道。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-031 | ADC时钟两种分频

标签：ADC, 时钟, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 时钟

已知 PCLK2 = 72 MHz。

1. 使用 6 分频时，ADC 时钟是多少？
2. 使用 8 分频时，ADC 时钟是多少？
3. 两种配置是否满足 ADC 时钟不超过 14 MHz 的要求？

### 参考答案

**核心结论：** 六分频为12MHz，八分频为9MHz，两者均不超过14MHz。

**必要解释：** 它们满足所问时钟上限，但不能据此保证采样建立、参考电压或全部数据手册条件已满足。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-032 | 一次转换总耗时

标签：ADC, 转换时间, 计算题
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

单次转换时间

假设：

- ADC 时钟为 12 MHz。
- 采样时间为 13.5 个时钟周期。
- 12 位转换阶段需要 12.5 个时钟周期。

计算：

1. 一次转换总共需要多少个 ADC 时钟周期？
2. 一次转换总时间是多少微秒？

### 参考答案

**核心结论：** 总周期13.5+12.5=26，时间26/12MHz约2.1667微秒。

**必要解释：** 只计采样加转换，不计触发延迟、软件开销和数据处理。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-034 | ADC1初始化到首个结果

标签：ADC, 初始化, 流程分析
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

初始化顺序

以 ADC1 读取 PA0 为例，请按照合理顺序写出从初始化到获取一次转换结果的主要步骤。

至少包括：

- RCC 时钟。
- GPIO 配置。
- ADC 整体配置。
- 规则通道配置。
- ADC 使能。
- 校准。
- 启动转换。
- 等待 EOC。
- 读取结果。

### 参考答案

**核心结论：** 使能GPIOA/ADC1时钟并设置ADC预分频，PA0模拟输入，配置ADC模式/序列/采样时间，ADC使能并稳定，复位校准和校准完成后触发，等EOC再读DR。

**必要解释：** 校准和完成等待均需超时；转换电压需使用实际参考值，顺序须满足上电稳定要求。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-035 | ADC标准库函数职责

标签：ADC, SPL, 函数辨析
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

SPL 函数辨析

请说明以下函数的主要作用：

1. `RCC_ADCCLKConfig()`
2. `GPIO_Init()`
3. `ADC_Init()`
4. `ADC_RegularChannelConfig()`
5. `ADC_Cmd()`
6. `ADC_StartCalibration()`
7. `ADC_GetFlagStatus()`
8. `ADC_GetConversionValue()`

### 参考答案

**核心结论：** ADCCLKConfig管分频，GPIO_Init管引脚，ADC_Init管整体模式，RegularChannelConfig管通道/Rank/采样时间，Cmd管使能，StartCalibration启动校准，GetFlagStatus读状态，GetConversionValue读结果。

**必要解释：** 启动校准不等于校准已完成，读结果不等于已等待EOC；时钟和校准复位等依赖由调用者负责。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-036 | 连续结果为何丢失

标签：ADC, 数据寄存器, DMA
难度：进阶

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

连续转换的数据覆盖

ADC 开启连续转换后，假设连续产生三个结果：

1200、1210、1225。

程序没有及时读取数据寄存器。

请解释：

1. 为什么可能只读到最新结果？
2. 为什么 ADC_DR 不能代替数组保存历史数据？
3. 如果需要连续保存大量采样结果，可以考虑使用什么机制？

### 参考答案

**核心结论：** DR不保存历史，新结果可覆盖旧结果，因此迟读可能仅得到最新的1225。

**必要解释：** 需要可靠保存每次转换可用匹配速率的DMA缓冲或受控中断取数；还要处理覆盖、缓冲宽度与通道顺序。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-037 | ADC始终为零排查

标签：ADC, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 始终读到 0

程序能够正常编译运行，但 ADC 读取结果始终为 0。

请列出至少四项需要检查的内容，并说明为什么。

### 参考答案

**核心结论：** 测输入与参考/接地，再查引脚模拟模式、通道/实例、RCC/ADC分频、使能校准、触发与EOC以及数据提取。

**必要解释：** 把真实输入0V和软件读旧值区分开；用已知安全电压和状态变化逐项验证。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-038 | ADC长期接近满量程

标签：ADC, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 始终接近 4095

输入信号并未明确接近量程上限，但 ADC 长期读到接近 4095 的数值。

请列出至少三种可能原因。

### 参考答案

**核心结论：** 检查输入是否确实高、接线/通道错误、参考电压、引脚被拉高及对齐/换算逻辑。

**必要解释：** 测量实际引脚和参考并用已知输入对照，不能仅凭4095认定ADC损坏或输入一定超过量程。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-039 | ADC读数持续跳动

标签：ADC, 故障定位, 平均滤波
难度：综合

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

ADC 读数持续跳动

输入电压基本稳定，但 ADC 读数持续在较小范围内变化。

请列出至少四项可能原因，并说明平均滤波能解决什么问题、不能解决什么问题。

### 参考答案

**核心结论：** 检查输入波动、模拟电源参考、接地布线、干扰、源阻抗与采样建立；再决定滤波。

**必要解释：** 平均可降低部分随机波动，不能修复固定偏移、参考误差或不足采样建立；更长平均窗口也增加延迟。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-040 | 多通道数据顺序不符

标签：ADC, 扫描序列, DMA, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

多通道数据顺序错误

规则序列配置为：

- Rank 1：Channel 0。
- Rank 2：Channel 1。
- Rank 3：Channel 10。

但程序输出的数据与预期通道不对应。

请说明至少三项需要检查的内容。

### 参考答案

**核心结论：** 核对Rank1/2/3对应Channel0/1/10、引脚映射、序列长度、读取顺序及结果是否覆盖。

**必要解释：** 使用DMA时还查传输宽度、长度、循环和缓冲索引；必要时给各通道不同安全已知电压验证对应关系。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。

## adc1-041 | 等待EOC卡住

标签：ADC, EOC, 故障定位
难度：综合

### 题目

平台为STM32F103RCT6，ADC为12位SAR，SPL V3.5.0；频率及参考电压按题设。

程序卡在等待 EOC

程序启动 ADC 后，永久停留在等待转换完成的循环中。

请列出至少四项可能原因，并说明为什么不能只依赖无限等待循环。

### 参考答案

**核心结论：** 检查RCC与分频、ADC使能/稳定/校准、触发选择与启动、实例/标志以及是否有别的消费者读取DR。

**必要解释：** 采用有界等待并返回具体阶段错误，避免用无限循环掩盖未启动或状态被提前消费的问题。

**适用条件与依据：** 限定STM32F103RCT6（F1高密度系列）；库函数限定STM32F10x SPL V3.5.0，不套用HAL或其他系列。实际工程时钟、芯片修订和接线须另外核对。 ADC输入与参考电压均须在数据手册允许范围内。

[ST RM0008：GPIO、RCC、ADC、I2C、SPI、USART寄存器章节](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[ST DS5792：STM32F103xC/D/E引脚与电气条件](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ST标准外设库发行入口；函数实现限定本机V3.5.0](https://www.st.com/en/embedded-software/stsw-stm32054.html)。
