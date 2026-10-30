---
schema_version: 1
topic_id: stm32f103-adc
topic_title: STM32F103RCT6 ADC寄存器与机制
---

## adc1-004 | 引脚与ADC通道映射

标签：ADC, STM32F103RCT6, 寄存器, 通道映射
难度：基础

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1/ADC2的外部通道0～15与PA0～PA7、PB0～PB1、PC0～PC5如何对应？PC0是哪一通道？能否把同一表直接套到ADC3及所有封装？

### 参考答案

**核心回答：** ADC1/2通道0～7对应PA0～7，8～9对应PB0～1，10～15对应PC0～5；PC0为通道10。

**回答要点：** 通道号是模拟复用器输入编号，不能由端口位号直接推断；ADC3和封装可用引脚须查对应映射表。

**边界与易错点：** 这里限F103RCT6及ADC1/2映射；芯片存在某通道不代表所有封装都引出该引脚。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-005 | 模拟引脚与通道选择

标签：ADC, STM32F103RCT6, 寄存器, 初始化
难度：基础

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1准备采样PA0。为什么要把PA0设为模拟输入，同时还要配置ADC规则通道？这两项配置分别解决什么问题？

### 参考答案

**核心回答：** 模拟输入配置引脚电路，规则通道配置ADC内部模拟复用器和转换序列，两者不能互相替代。

**回答要点：** 还需使能端口/ADC时钟并核对引脚接线和输入范围。

**边界与易错点：** 不使用任何库模式枚举作答案；配置引脚不会自动把ADC序列选到该输入。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-007 | ADC时钟分频与上限

标签：ADC, STM32F103RCT6, 寄存器, 时钟, 参数计算
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

PCLK2=72 MHz。ADC预分频可选2、4、6、8，分别得到多少ADC时钟？按该型号14 MHz最大ADC时钟限制，哪些分频可用？

### 参考答案

**核心回答：** 分别36、18、12、9 MHz；6和8分频满足14 MHz上限。

**回答要点：** ADC时钟来自PCLK2经ADCPRE分频，不应直接拿SYSCLK代入；还需满足数据手册供电和时序条件。

**边界与易错点：** 满足频率上限只是必要条件，不等于采样电路和所有转换参数已经正确。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-027 | 独立、扫描与连续模式

标签：ADC, STM32F103RCT6, 寄存器, 转换模式
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC独立模式、扫描模式和连续转换分别控制什么？单通道/多通道与单次/连续四种组合如何理解？

### 参考答案

**核心回答：** 独立模式控制ADC间协作；扫描决定是否按多个rank依次转换；连续决定完成后是否自动重复。

**回答要点：** 不扫描且不连续通常触发一次单通道；不扫描且连续重复该通道；扫描且不连续执行一次序列；扫描且连续重复序列。

**边界与易错点：** 独立不等于单次，扫描也不等于连续；实际行为还受间断/触发配置影响，本题不启用间断模式。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-009 | 规则序列与采样通道

标签：ADC, STM32F103RCT6, 寄存器, 规则序列
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

规则序列要求Rank1=通道0、Rank2=通道1、Rank3=通道10。SCAN、SQR1.L和SQR3的三个槽应如何配置？若未启用扫描，后续rank能否按该序列正常执行？

### 参考答案

**核心回答：** 启用SCAN，SQR1.L填3-1=2；SQR3.SQ1=0、SQ2=1、SQ3=10。

**回答要点：** Rank是转换顺序槽，Channel是物理模拟输入编号；还应分别设置这些通道采样时间。

**边界与易错点：** 未启用扫描时不能指望后续rank按多通道序列执行，不能只填写SQR就认定扫描生效。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-010 | 规则组完成标志与结果读取

标签：ADC, STM32F103RCT6, 寄存器, 状态标志
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1规则组分别采用单通道和普通多通道扫描，未启用间断模式。应怎样理解F1的EOC？读取DR有什么副作用？仅在序列结束后读取一次DR，能否得到所有通道结果？

### 参考答案

**核心回答：** 单通道完成可用EOC；普通扫描应按规则序列完成理解F1的EOC，不能照搬其他系列的逐rank完成选择。读取DR会清EOC，一次DR读取不能恢复整组历史。

**回答要点：** DR保存转换结果，不是每通道缓存数组；扫描各结果需及时搬运，常用DMA按rank保存。

**边界与易错点：** F1没有其他系列的EOCSelection或独立EOS配置，规则间断模式和双ADC模式另按相应章节分析。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-011 | 12位结果的数据对齐

标签：ADC, STM32F103RCT6, 寄存器, 数据对齐
难度：基础

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

规则组结果的ALIGN=0或1分别对应什么位置？若左对齐的16位读数要恢复为0～4095的原始12位编码，应如何处理？

### 参考答案

**核心回答：** ALIGN=0右对齐在位11:0；ALIGN=1左对齐在位15:4，左对齐结果右移4位得到12位编码。

**回答要点：** 先按实际对齐方式还原编码，再做电压换算；注入组带偏移的符号处理不在本题范围。

**边界与易错点：** 左对齐不会提高分辨率；不能把左移后的16位数直接套入12位电压公式。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-021 | 复位校准与自校准

标签：ADC, STM32F103RCT6, 寄存器, 校准
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

按RM0008 Rev21，ADC1从上电到校准完成的关键前提与RSTCAL、CAL顺序是什么？为何两个等待都应有超时？

### 参考答案

**核心回答：** 使能ADC并满足稳定要求，校准前保持上电至少两个ADC周期；先置RSTCAL并等硬件清零，再置CAL并等硬件清零。

**回答要点：** 校准可降低内部电容阵列误差；时钟或硬件异常会使等待不能按期结束，应报告错误并停止依赖有效转换结果。

**边界与易错点：** 不可把旧文档中的power-off描述机械沿用；校准不能消除外部参考、接线和所有系统误差。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-032 | 采样与转换总耗时

标签：ADC, STM32F103RCT6, 寄存器, 采样时间, 参数计算
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC时钟12 MHz，规则组一次转换包含采样阶段与12.5周期转换阶段。采样时间为13.5或239.5周期时，总周期和理想转换时间各是多少？

### 参考答案

**核心回答：** 分别26周期、约2.1667 μs；252周期、21 μs。

**回答要点：** 总时间=(采样周期+12.5)/fADC；改变采样窗口不改变该12位转换阶段的12.5周期。

**边界与易错点：** 这是单次理想硬件时间，不含触发同步、软件处理和传输等待；不能直接当整个应用周期。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-034 | 首个有效结果的配置链

标签：ADC, STM32F103RCT6, 寄存器, 初始化
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

不要求写代码：从ADC1未配置开始，到获得一个有效PA0采样结果，说明时钟、模拟路径、模式、采样、校准、启动和读取的主要依赖顺序。

### 参考答案

**核心回答：** 先核对供电/输入与时钟，设置引脚模拟输入；配置模式、规则通道和采样时间；使能并稳定、完成校准；启动转换，等完成再读结果。

**回答要点：** 需要确认ADCPRE、通道/rank、对齐、触发条件；每个硬件等待都应有有界失败处理。

**边界与易错点：** 具体寄存器可配置的使能状态应按手册；不能用“已经调用初始化”替代逐项检查硬件前提。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-036 | 多通道转换的结果覆盖

标签：ADC, STM32F103RCT6, 寄存器, 数据完整性
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

连续扫描产生数据比CPU读取更快，而软件只反复读ADC_DR。为什么会丢失中间结果？F103的ADC_SR是否有其他系列那样的OVR位供可靠检测每次覆盖？

### 参考答案

**核心回答：** DR不是队列，新转换可能覆盖旧结果；F103 ADC_SR没有专门OVR位保证报告每一次数据覆盖。

**回答要点：** 应按速率设计及时读取或DMA缓冲，核对rank顺序、缓冲容量和消费速度。

**边界与易错点：** 不能把保留位当OVR，也不能因没有错误标志就断言未丢样。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-037 | 始终为零的排查

标签：ADC, STM32F103RCT6, 寄存器, 故障分析
难度：综合

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1采样一个应处于量程内的直流输入，结果长期为0。给出按外部信号、模拟路径、配置和启动状态逐步排查的方法。

### 参考答案

**核心回答：** 先实测引脚对模拟地电压，再查供电/参考、接线、模拟模式、通道与rank，最后核对时钟、校准、触发与结果读取。

**回答要点：** 用已知电压源和单通道单次模式缩小变量；确认读到的是本次有效结果而非初值。

**边界与易错点：** 长期为0可能有多种原因，不能仅凭结果断定ADC损坏或只需加延时。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-038 | 长期满量程的排查

标签：ADC, STM32F103RCT6, 寄存器, 故障分析
难度：综合

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

输入电压按设计应低于参考电压，但ADC1结果长期接近4095。应从哪些证据区分真实超量程、错误参考和数据处理问题？

### 参考答案

**核心回答：** 实测输入与实际参考，确认共地和通道；再查引脚外部负载、对齐、掩码和电压换算。

**回答要点：** 检查前端饱和、短接、开路漂移和错误数据解释；在安全范围内更换已知输入观察响应。

**边界与易错点：** 满量程编码不能唯一证明实际输入恰好等于标称VREF，也不能忽略模拟输入电气限制。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-040 | 扫描结果与缓冲顺序

标签：ADC, STM32F103RCT6, 寄存器, DMA, 数据完整性
难度：综合

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1扫描3通道，DMA保存10轮完整序列。DMA1通道、传输项数和缓冲解释应如何设置？循环模式出现通道错位时首先核对什么？

### 参考答案

**核心回答：** ADC1请求对应DMA1通道1；每轮3项，10轮30项，按rank顺序解释连续缓冲区。

**回答要点：** 核对序列长度、DMA半字宽度/内存递增、计数与3的倍数关系、启动时机和读写边界；循环缓冲需明确生产/消费位置。

**边界与易错点：** 普通模式完成后不自动保存后续扫描；循环模式会覆盖旧数据，不能把30项误当30轮。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc1-041 | 等待EOC不结束的定位

标签：ADC, STM32F103RCT6, 寄存器, 故障分析
难度：综合

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1规则单通道一次转换时，等待EOC超过合理截止时间。应检查哪些启动条件？为何不应简单去掉等待或无限延时？

### 参考答案

**核心回答：** 核对ADC时钟、ADON与稳定、校准结束、规则通道、触发源选择和使能，以及是否已被其他读取清除EOC。

**回答要点：** 用可观测的配置和完成状态判断；超时应保留错误信息并退出无效结果路径。

**边界与易错点：** 中断、DMA或调试器也可能读取有副作用的寄存器，需核对实际访问者。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-reg-001 | 按寄存器表计算访问地址

标签：ADC, STM32F103RCT6, 寄存器, 地址计算
难度：基础

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

已知ADC1基址0x40012400、ADC2基址0x40012800、ADC3基址0x40013C00；SR/CR2/DR偏移分别0x00/0x08/0x4C。求ADC1_DR与ADC3_CR2地址，并解释为什么偏移不能直接当绝对地址。

### 参考答案

**核心回答：** 分别0x4001244C和0x40013C08；实际地址为外设实例基址加寄存器偏移。

**回答要点：** 相同外设类型的相同寄存器偏移可相同，但实例基址不同。

**边界与易错点：** 表格限定F103RCT6；不要据此把其他系列ADC寄存器布局或外设存在性视为相同。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-reg-002 | ADC状态与控制位的职责

标签：ADC, STM32F103RCT6, 寄存器, 状态标志, 控制寄存器
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

概括SR的AWD/EOC/JEOC/STRT/JSTRT，CR1的SCAN/EOCIE/DUALMOD/DISCEN，CR2的ADON/CONT/ALIGN/DMA/TSVREFE分别属于哪类职责。为什么不能统一用读改写“清零”所有状态？

### 参考答案

**核心回答：** SR记录看门狗、转换完成和启动等状态；CR1控制序列/中断/多ADC/间断，CR2控制使能、连续、对齐、DMA及内部通道。

**回答要点：** SR位0～4依次AWD、EOC、JEOC、JSTRT、STRT；位5保留。清除规则有读DR或规定写操作等差别，应按位确认。

**边界与易错点：** 控制位不能当完成标志；修改共享寄存器还需考虑副作用和并发，volatile本身不使读改写原子化。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-reg-003 | 软件触发的使能条件

标签：ADC, STM32F103RCT6, 寄存器, 触发
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

ADC1已上电并完成校准。使用CR2.SWSTART启动规则组时，EXTSEL与EXTTRIG还需怎样配合？只将ADON从0置1为何不足以保证这次软件触发？

### 参考答案

**核心回答：** EXTSEL选择SWSTART事件，并使能EXTTRIG，再请求SWSTART；ADON首先负责上电使能。

**回答要点：** SWSTART在启动后由硬件清除；EXTTRIG未开或事件选择不符时，写启动位不能按预期触发。注入组使用独立的JEXTSEL/JEXTTRIG。

**边界与易错点：** ADON在特定重复写条件下另有启动语义，本题使用SWSTART路径；外部触发是否重复还取决于后续事件与CONT。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-reg-004 | 采样时间寄存器的组织

标签：ADC, STM32F103RCT6, 寄存器, 采样时间
难度：基础

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

SMPR1与SMPR2分别管理哪些通道的采样时间？每通道字段宽度是多少？字段010、101、111对应多少ADC周期？

### 参考答案

**核心回答：** SMPR2管理通道0～9，SMPR1管理10～17，每通道3位；010=13.5、101=55.5、111=239.5周期。

**回答要点：** 采样时间按物理通道配置，规则序列槽只决定顺序；应结合源阻抗与采样率选值。

**边界与易错点：** 数值编码只适用于该F1 ADC实现，不能直接套到其他系列。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-reg-005 | 内部通道与外部通道的前提

标签：ADC, STM32F103RCT6, 寄存器, 内部通道
难度：进阶

### 题目

适用芯片：STM32F103RCT6；ADC规则组，除题目另述外采用独立模式，不依赖外设库。

读取芯片内部温度传感器和VREFINT时，应选择哪些通道、使能什么路径？为什么不能直接复制某个外部GPIO通道的全部步骤，或把内部参考当成固定精密标定值？

### 参考答案

**核心回答：** 本型号用ADC1访问内部温度通道16和VREFINT通道17，并启用ADC1的TSVREFE；还需满足内部路径启动和最小采样时间。

**回答要点：** 按该器件通道可达ADC实例、数据手册参数和容差选择配置；内部路径无需配置成外部模拟引脚。

**边界与易错点：** 内部传感器/参考的精度和可达实例以该型号资料为准；不能凭通道编号推断ADC3也具有相同内部连接。

#### 依据

[ST RM0008 Rev21：ADC章节](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)；[ST STM32F103RC 数据手册入口](https://www.st.com/en/microcontrollers-microprocessors/stm32f103rc.html)。

## adc-data-ways | 轮询、中断与DMA取舍

标签：ADC, STM32F103RCT6, 数据获取
难度：进阶

### 题目

适用芯片：STM32F103RCT6，ADC1规则组。轮询、中断和DMA三种结果获取方式分别把哪些工作交给CPU或硬件？连续多通道采样时应怎样考虑数据完整性？

### 参考答案

**核心回答：** 轮询由CPU等待并读取，中断在完成事件后进入处理，DMA按硬件请求搬运结果；三者在CPU占用、响应与配置复杂度上不同。

**回答要点：** 低速单通道可用轮询；中断减少忙等但有响应开销；高吞吐扫描常用DMA按rank连续保存，仍需规划缓冲容量、生命周期和消费速度。

**边界与易错点：** F1扫描的EOC不能当作可随意逐rank读取的事件；DMA只负责搬运，不保证无限缓冲或应用总能及时消费。

#### 依据

[ST RM0008：ADC扫描及DMA](https://www.st.com/resource/en/reference_manual/cd00171190.pdf)。
