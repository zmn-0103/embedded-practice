---
schema_version: 1
topic_id: stm32f103-dma
topic_title: STM32F103RCT6 DMA机制与寄存器
---

## dma-reg-001 | DMA资源与时钟

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

本型号的DMA1和DMA2各有几个通道、时钟来自哪条总线？为什么写兼容不同F103的资料时不能默认DMA2、ADC3、SPI3都存在？

### 参考答案

**口述核心：** DMA1有7通道、DMA2有5通道，DMA控制器在AHB；其他F103资源等级可能没有DMA2或相关外设。

#### 回答要点

先按完整型号查数据手册资源，再查RM0008请求表和板卡引脚；使能对应AHB控制器时钟。

#### 常见误区与边界

不能把高密度RCT6资源套给C8T6；本题不要求库函数和宏名。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-002 | 常见固定DMA请求映射

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

给出USART1_TX/RX、SPI1_RX/TX、ADC1、TIM2_UP的DMA通道，并说明核对顺序。

### 参考答案

**口述核心：** 依次为DMA1_CH4、CH5、CH2、CH3、CH1、CH2。

#### 回答要点

确认外设存在和使用功能，查请求映射表，再查重映射及工程通道占用。

#### 常见误区与边界

功能共享通道不等于可同时使用；映射限定STM32F103RCT6，不推广到DMAMUX。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-003 | 同一通道的外设冲突

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

USART1_TX与SPI2_RX、USART1_RX与SPI2_TX、ADC1与TIM2_CH3分别冲突吗？把其中一路DMA优先级设最高能否解决？

### 参考答案

**口述核心：** 三对分别共享DMA1_CH4、CH5、CH1，不能同时各用一套独立DMA配置；提高优先级不能拆分通道。

#### 回答要点

可换外设实例、改中断/轮询或严格分时且控制请求；按实际映射和所有者确认。

#### 常见误区与边界

优先级只仲裁不同通道；不能让两个同时有效的请求自动选对各自地址和计数。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-004 | DMA仲裁与NVIC优先级

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

同一DMA控制器两通道同时请求，PL相同如何裁决？PL与NVIC优先级是否联动？

### 参考答案

**口述核心：** 软件优先级相同时通道编号较小者优先；PL决定搬运仲裁，NVIC决定CPU响应中断顺序。

#### 回答要点

PL有低、中、高、很高四级；两套优先级需分别设计并考虑总线争用。

#### 常见误区与边界

提高NVIC优先级不直接提升DMA硬件搬运服务顺序，也不保证无外设溢出。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-005 | 控制器与通道寄存器地址

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

DMA1基址0x40020000，DMA2基址0x40020400。给出ISR/IFCR和通道寄存器偏移通式，计算DMA1_CH4.CCR、CH5.CMAR、CH7.CNDTR。

### 参考答案

**口述核心：** ISR偏移0、IFCR为4；通道x的CCR/CNDTR/CPAR/CMAR偏移为0x08/0C/10/14加0x14×(x-1)。

#### 回答要点

结果分别为0x40020044、0x40020064、0x40020084。

#### 常见误区与边界

DMA2仅有通道1至5；地址公式不授权访问不存在的通道或保留区域。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-006 | DMA事件位组与GIF

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

通道x的GIF/TCIF/HTIF/TEIF位号怎样计算？TCIF4、GIF6、TEIF7分别在何位？GIF有独立中断使能吗？

### 参考答案

**口述核心：** 位组从4×(x-1)开始，依次为GIF、TCIF、HTIF、TEIF；题中为bit13、20、27，没有独立GIE。

#### 回答要点

GIF汇总该通道具体事件；中断分别受TCIE/HTIE/TEIE控制。

#### 常见误区与边界

DMA2的通道6/7位组不使用；汇总标志不能取代具体事件判断。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-007 | IFCR写一清与全局清除勘误

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

为什么不能写ISR=0清DMA事件？活动通道清GIF有什么ES0340风险，应该怎样清？

### 参考答案

**口述核心：** 状态在ISR读取，清除由IFCR对应位写1完成；活动通道按需清具体HT/TC/TE标志，不清全局GIF。

#### 回答要点

ES0340说明全局清与传输错误同周期可能漏置TEIF且未自动禁用通道；写0不清IFCR目标。

#### 常见误区与边界

按本型号与芯片修订核对勘误；清某类事件不代表已经处理对应数据，不能盲清全部。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-008 | CCR字段分工

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

写出EN、TCIE、HTIE、TEIE、DIR、CIRC、PINC、MINC、PSIZE、MSIZE、PL、MEM2MEM的位置与主要职责。

### 参考答案

**口述核心：** 位依次为0、1、2、3、4、5、6、7、[9:8]、[11:10]、[13:12]、14。

#### 回答要点

使能和事件控制传输生命周期；DIR/CIRC控制流向模式；递增/宽度控制访问；PL仲裁，MEM2MEM切换请求方式。

#### 常见误区与边界

参数变更前按手册禁用通道；不要求记软件结构体成员。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-009 | 两端宽度和PL编码

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

CCR.PSIZE/MSIZE的00、01、10、11各表示什么？宽度不同能否假定自动打包？PL四级怎样编码？

### 参考答案

**口述核心：** 宽度为8、16、32位、保留；PL从00到11依次为低、中、高、很高。

#### 回答要点

两端宽度不一致按RM0008规定扩展/截断并核算内存布局；不能假定自动把多个窄项拼成宽项。

#### 常见误区与边界

DMA错误标志不检查C数组类型，数组元素和访问宽度不匹配可能静默破坏数据。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-010 | CNDTR计数与改写前提

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

CNDTR有效位宽与最大项数多少？通道EN=1时能否重装？剩余计数能否累计循环轮数？

### 参考答案

**口述核心：** 有效16位，最大65535项，改写需EN=0；它只是当前轮剩余计数，不能独立累计循环轮数。

#### 回答要点

本轮已完成=初始项数-当前CNDTR；读取是快照，循环重装需同时记录进度和所有者。

#### 常见误区与边界

计数0不服务新传输；不能在通道仍使能时直接重装并假定成功。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-011 | CPAR和CMAR与真实方向

标签：DMA, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

CPAR/CMAR会随内部地址递增变化吗？DIR=0/1时谁是源、谁是目标？USART1接收取什么方向？

### 参考答案

**口述核心：** 它们保存配置基址，内部指针不可据此读取；DIR=0为CPAR到CMAR，DIR=1反向；USART接收取0。

#### 回答要点

MEM2MEM也用DIR确定流向；按端口分别设递增和宽度；读取CPAR不是当前搬运位置。

#### 常见误区与边界

名称叫外设地址的一端也可在MEM2MEM中指向内存，不能从名称断定实际数据源。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-012 | 数据对齐与寄存器访问宽度

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

DMA数据16位/32位访问分别怎样对齐？ES0340对CPU访问DMA控制寄存器的宽度有什么更正？

### 参考答案

**口述核心：** 数据地址分别按2/4字节对齐；DMA控制寄存器必须用对齐32位访问。

#### 回答要点

区分PSIZE/MSIZE的数据搬运宽度与CPU配置寄存器访问宽度；后者不是“计数仅16位就能半字写”。

#### 常见误区与边界

不对齐或宽度错未必总置TEIF；软件必须主动保证合法访问而不依赖错误检测。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-013 | Normal和Circular结束状态

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

Normal搬完、TCIF置1后EN是否必然清零？怎样再次启动？Circular的计数和内部地址如何循环？

### 参考答案

**口述核心：** F103普通完成不会自动清EN，但计数0不再服务；先禁用、处理数据/标志、重装计数后再使能。

#### 回答要点

Circular末尾自动重装计数和内部基址，继续响应请求；EN自动清除要与传输错误等路径区分。

#### 常见误区与边界

不能在Normal完成后只见EN=1就以为仍可继续搬运；更改计数/参数前先明确禁用。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-014 | 内存复制的寄存器配置

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

DMA1_CH1将uint32_t源数组100项复制到独立且不重叠的目标数组100项。源/目标均在可访问内存且4字节对齐。给出两端地址、方向、宽度、递增、计数和模式。

### 参考答案

**口述核心：** CPAR指源，CMAR指目标，DIR=0，两端递增，32位/32位，CNDTR=100，MEM2MEM=1且CIRC=0。

#### 回答要点

单轮完成搬400字节；MEM2MEM在通道使能后自行发起，不依赖外设请求；源和目标在完成前保持有效。

#### 常见误区与边界

本控制器不支持MEM2MEM配Circular；周期复制需软件受控重启Normal，不要同时开放共享外设请求。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-017 | ADC扫描的DMA布局

标签：DMA, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

ADC1规则序列依次三通道，每通道100轮，DMA两端16位、内存递增。计数、数组空间、排列怎样？PCLK2=72 MHz时最高合法ADC分频是多少？

### 参考答案

**口述核心：** 计数300项，uint16_t数组300项共600字节，按三个Rank逐轮交织；选6分频得12 MHz。

#### 回答要点

可用2/4/6/8分频，ADC时钟须不超14 MHz；8分频9 MHz也合法但不是最高采样时钟。

#### 常见误区与边界

序列和DMA宽度决定布局；不能误设300字节或把数据当按通道分块排列，采样时间另核对。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## dma-reg-018 | TEIF不能发现的错误

标签：DMA, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6（高密度）；DMA控制器、通道及外设按题设。与HAL/SPL等软件库无关。

uint16_t数组100项却把DMA计数设150，为什么可能无TEIF？DMA中断真正到CPU需要哪些环节？

### 参考答案

**口述核心：** 额外写入仍落合法SRAM时总线不报错，TEIF不懂数组边界；中断需事件、CCR对应使能、NVIC/CPU允许及正确入口。

#### 回答要点

用计数/长度和内存所有权约束防越界；另查外设ORE、消费者覆盖；ISR与使能状态分别查看。

#### 常见误区与边界

volatile或关CPU中断不能阻止DMA覆盖；有TEIF时按手册恢复并核对ES0340的GIF竞态。

#### 依据

[ST RM0008：DMA、请求映射及相关外设章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340 §2.4：GIF清除竞态与寄存器32位访问](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。
