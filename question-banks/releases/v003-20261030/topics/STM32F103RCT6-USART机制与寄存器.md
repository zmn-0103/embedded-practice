---
schema_version: 1
topic_id: m5-trial-uart-level-2
topic_title: STM32F103RCT6 USART机制与寄存器
---

## uart2-019 | TXE与TC的完成边界

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

比较TXE与TC；连续发送多字节时每个字节前看哪个状态，最后关闭发送器前又看哪个？

### 参考答案

**口述核心：** TXE表示发送数据寄存器空，可写下一字节；TC表示最后一帧已发送完成且TXE为1。

#### 回答要点

连续供数看TXE；最后关闭发送器或切RS485方向要确认本批发送后的TC；TXE可早于TC。

#### 常见误区与边界

复位或历史TC=1不证明本次数据已发出；软件必须把状态与本次发送关联。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-021 | RXNE与DR状态

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

RXNE反映RX引脚的瞬时电平吗？通常为何先确认RXNE再读DR，读取后状态怎样变化？

### 参考答案

**口述核心：** RXNE表示接收数据寄存器内有未读取数据，不表示引脚高低；读DR通常清RXNE。

#### 回答要点

先判状态，再取数据；未就绪时直接读取不能保证新数据；调试器读DR也可能改变状态。

#### 常见误区与边界

并发接收者或DMA可能先取走数据，状态快照不提供互斥；数据位数按帧配置处理。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-024 | ORE的硬件条件与清除

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

什么条件产生ORE？应如何读取状态、清除并恢复接收消息？

### 参考答案

**口述核心：** 旧接收数据未及时读走而下一字符到达可产生ORE；按先读SR、再读DR清除。

#### 回答要点

先保存所需错误快照并处理仍可取数据；已丢新字符无法靠清标志恢复；按协议丢弃或重同步当前消息。

#### 常见误区与边界

F103发生溢出时不能笼统宣称“旧DR一定被新数据覆盖”；清状态不等于数据完整。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-026 | 接收中断的完整链路

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

已经使能USART的RXNE中断源，为什么仍不一定进入中断？说明硬件到CPU的主要条件和服务职责。

### 参考答案

**口述核心：** 需要产生接收事件、USART源使能、NVIC允许且CPU未屏蔽，向量表和处理入口也要正确。

#### 回答要点

确认UE/RE和RXNE，再查RXNEIE、NVIC和CPU屏蔽；服务程序及时读数据、记错误、入有界缓冲。

#### 常见误区与边界

事件标志与中断使能不同；长阻塞、打印或复杂解析可增加服务延迟。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-027 | USART请求与DMA通道

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

CR3.DMAR已置1，是否就完成DMA接收配置？还需要核对什么？

### 参考答案

**口述核心：** DMAR只允许USART提出接收DMA请求，DMA时钟、通道和搬运参数仍需单独配置。

#### 回答要点

核对USART1_RX映射、DR地址、SRAM地址、方向、宽度、计数和通道使能；外设端和DMA端都要就绪。

#### 常见误区与边界

请求使能不等于开始接收或完成一次传输；不能照搬其他系列的请求路由。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-028 | USART1寄存器地址

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

已知USART1基址0x40013800，写出SR、DR、BRR、CR1、CR2、CR3、GTPR偏移及绝对地址。

### 参考答案

**口述核心：** 偏移依次为0x00、04、08、0C、10、14、18，绝对地址为基址加偏移。

#### 回答要点

地址依次为0x40013800、0x40013804、0x40013808、0x4001380C、0x40013810、0x40013814、0x40013818。

#### 常见误区与边界

偏移不是绝对地址；外设总线有效访问宽度和保留位仍按手册，不能把地址背诵代替机制理解。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-029 | 115200波特率分频推导

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1输入PCLK2=72 MHz，16倍过采样，目标115200 baud。求USARTDIV及BRR，并说明整数/小数字段。

### 参考答案

**口述核心：** USARTDIV=72000000/(16×115200)=39.0625；整数39、小数码1，BRR=0x0271。

#### 回答要点

BRR[15:4]为整数、[3:0]为十六分之一小数；一般量化需正确四舍五入并处理进位，再反算实际误差。

#### 常见误区与边界

分频输入取实际PCLK2，不能假定始终72 MHz；本题量化结果恰好精确。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-030 | CR1控制与8N1目标值

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

普通异步收发、不用中断，CR1=0x200C。分析UE、TE、RE、M、PCE、PS和RXNEIE，并解释还缺少哪些外部配置。

### 参考答案

**口述核心：** UE、TE、RE为1，M/PCE/PS和RXNEIE为0，满足8数据位无校验收发的CR1条件。

#### 回答要点

UE在bit13、TE在3、RE在2；字长M在12，校验PCE/PS在10/9，RXNEIE在5。

#### 常见误区与边界

CR1不能证明STOP、BRR、时钟、引脚或接线正确；不能用整体覆盖方式破坏要保留的控制位。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-031 | STOP编码与字段更新

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

CR2.STOP在bit13:12，四种编码分别是什么？只修改STOP时怎样保护其他有效配置？

### 参考答案

**口述核心：** 00为1停止位，01为0.5，10为2，11为1.5；只清目标两位再写新编码。

#### 回答要点

目标字段掩码0x3000；先屏蔽旧STOP再合入新值；根据工作模式确认允许的停止位。

#### 常见误区与边界

部分USART/UART实例或特殊模式对停止位有限制；读改写还需考虑并发与寄存器副作用。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-032 | SR十六进制状态解释

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

某次读取SR得到0x00A0，TXE、TC、RXNE分别如何？这能证明对方已收到消息吗？

### 参考答案

**口述核心：** TXE=1、RXNE=1、TC=0；本端可写发送数据并有接收数据待取。

#### 回答要点

分别与0x80、0x40、0x20做掩码；SR是状态快照，收发可同时进行。

#### 常见误区与边界

不包含远端确认信息，也不证明整条消息正确；之后读DR可能改变RXNE。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-034 | 不同标志的清除规则

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

说明TXE、TC、RXNE、IDLE、ORE、FE、NE、PE、CTS、LBD的含义与清除规则，为什么不能统一向SR写零？

### 参考答案

**口述核心：** TXE写DR清；TC可先读SR再写DR，也支持按手册向TC写0；RXNE通常读DR清；IDLE及接收错误按先SR后DR。

#### 回答要点

CTS表示流控输入变化、LBD为LIN break检测，支持写0清；RXNE也有写0清的规定用途；读取顺序可能消耗待收数据。

#### 常见误区与边界

TC并非只能用唯一序列清除；状态位访问属性不同，禁止盲目统一写零或套用别系列ICR。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-035 | USART初始化的硬件依赖

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

默认PA9/PA10映射，PCLK2=72 MHz，115200、8N1、全双工，不用DMA/流控/中断。按硬件依赖说明初始化目标。

### 参考答案

**口述核心：** 使能GPIOA和USART1时钟，配置TX复用推挽和RX输入，设BRR=0x0271、普通帧格式，最后使能收发与USART。

#### 回答要点

CR1目标0x200C、CR2普通配置STOP=00、CR3不启用特殊功能；时钟、引脚和USART各有独立职责。

#### 常见误区与边界

配置顺序需避免半配置运行；只给寄存器目标值不能替代RCC、GPIO或实际波形确认。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-036 | 字节发送的硬件过程

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

从TXE=1写入一个数据字开始，说明DR、移位寄存器、TXE和TC如何配合。

### 参考答案

**口述核心：** 写DR后TXE清零；数据进入移位寄存器后TXE再置位；最后一帧发完且DR空时TC置位。

#### 回答要点

允许DR准备下一字符与当前字符移位发送重叠；软件不必每个字符都等TC。

#### 常见误区与边界

TC是本地硬件完成，既不是DMA完成，也不是远端业务确认。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-037 | 字节接收的硬件过程

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

普通8N1接收从起始位到软件取DR经过哪些步骤？解释RXNE及ORE产生的位置。

### 参考答案

**口述核心：** 检测起始位、按位采样组帧，再把接收数据交给DR并置RXNE，软件或DMA及时读取。

#### 回答要点

检查帧/校验/噪声状态；DR未取走时再来数据可发生ORE；服务延迟决定丢失风险。

#### 常见误区与边界

F103使用本型号的采样与状态规则，不推广为所有UART的FIFO结构。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-041 | 9600波特率分频推导

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1输入PCLK2=72 MHz，16倍过采样，目标9600 baud。计算USARTDIV、整数字段、小数字段和BRR。

### 参考答案

**口述核心：** USARTDIV=468.75，整数468=0x1D4，小数码12=0xC，BRR=0x1D4C。

#### 回答要点

公式为fCK/(16×baud)；小数乘16得到12，再与整数左移4位组合。

#### 常见误区与边界

换波特率或PCLK2后都必须重算，不能复用115200的BRR。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-043 | USART发送无输出排查

标签：UART, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1已写过DR，PC仍完全收不到字符。按时钟、GPIO/AFIO、控制位、波特率和线路给出排查路径。

### 参考答案

**口述核心：** 确认时钟和UE/TE，再核对引脚复用/重映射、BRR帧格式以及TX到对端RX的电气连接。

#### 回答要点

读RCC与控制寄存器、看TXE/TC，测实际TX波形；区分本地无输出与远端接收配置问题。

#### 常见误区与边界

“程序执行到写DR”不证明物理引脚发送；接收端软件数组容量通常不是本端TX无波形的首要原因。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-044 | TXE置位却观察不到预期TC

标签：UART, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

对一次有界USART1发送，看到TXE=1但持续观察不到预期TC，应检查哪些条件？

### 参考答案

**口述核心：** TXE只证明DR空；检查本批是否持续供数、UE/TE和时钟、流控暂停、TC被其他代码清除。

#### 回答要点

限定一次已提交的有限发送，记录SR/CR快照和TX波形；必要时考虑特殊帧模式和调试副作用。

#### 常见误区与边界

不能仅凭TXE推定停止位结束；远端软件未收数据不会直接决定本端TC。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-045 | ORE与数据流恢复

标签：UART, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1连续接收出现ORE，扩大软件数组为何不一定奏效？怎样处理硬件状态和应用消息？

### 参考答案

**口述核心：** 扩大数组不缩短DR服务延迟；应及时取数、按先SR后DR清错误，并使已缺字节消息失效或重同步。

#### 回答要点

查中断屏蔽、长阻塞、DMA重配空窗和消费速率；记录丢失与必要重发。

#### 常见误区与边界

清状态无法追回已经丢失的字符；不把硬件溢出和软件数组满混为一谈。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-046 | RXNE中断未进入

标签：UART, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1的RXNEIE已置1，但收到字符时未进入处理程序。列出至少五项检查。

### 参考答案

**口述核心：** 查RX信号和映射、UE/RE、RXNE是否出现、NVIC、CPU屏蔽、向量表和处理入口。

#### 回答要点

先确定事件是否产生，再追中断链路；确认外设实例和IRQ一致；避免调试读DR先清状态。

#### 常见误区与边界

使能源不会自动配置NVIC；等待期间也要看错误标志，不能只重复写RXNEIE。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-047 | USART乱码的分层排查

标签：UART, STM32F103RCT6, 寄存器
难度：综合

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1收到字节不符合发送端已知数据，从时钟、BRR、帧格式、引脚、电气和接收逻辑分别检查什么？

### 参考答案

**口述核心：** 核对实际PCLK2/BRR与双方格式，再对照映射、电平共地、原始接收值、错误与缓冲。

#### 回答要点

用固定字节和波形解码区分采样错误、丢失及显示编码；改变配置前保存当前证据。

#### 常见误区与边界

寄存器配置表一致不等于实际时钟一致，不能单凭乱码认定某一根因。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart1-003 | USART1默认与重映射引脚

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

在STM32F103RCT6的LQFP64封装上，USART1默认TX/RX与重映射TX/RX分别在哪？改变映射还需做什么？

### 参考答案

**口述核心：** 默认为PA9/PA10，重映射为PB6/PB7；需使能AFIO时钟并选择USART1重映射。

#### 回答要点

同时配置GPIOB时钟和新引脚模式；核对板卡是否占用PB6/PB7，默认引脚不再代替新映射。

#### 常见误区与边界

引脚能力查DS5792，板卡实际连接另看原理图；不能推断所有F103封装都引出同样资源。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart1-005 | USART1与GPIO时钟来源

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

GPIOA和USART1挂在哪条总线？USART1波特率为何用PCLK2，USART2/3又用什么？

### 参考答案

**口述核心：** GPIOA和USART1都在APB2，USART1用PCLK2；USART2/3用APB1的PCLK1。

#### 回答要点

从RCC总线时钟与使能表确认实际输入；USART不套用定时器APB分频后的倍频规则。

#### 常见误区与边界

系统运行72 MHz不保证PCLK2一定72 MHz；GPIO速度配置也不直接决定波特率。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart2-007 | 8有效位加偶校验

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1要实现8个有效数据位、偶校验、1停止位，CR1.M/PCE/PS应如何设？UE/TE/RE也开时CR1目标是多少？

### 参考答案

**口述核心：** M=1、PCE=1、PS=0；加UE/TE/RE后为0x340C。

#### 回答要点

F103校验位占配置字长中的最高位；M=1提供9位字长，其中8位是有效数据，STOP另在CR2设1位。

#### 常见误区与边界

不能照搬其他系列“字长”API含义；单独M=0加校验不能得到8有效数据位。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-001 | USART引脚模式与收发使能

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1默认映射。PA9/PA10分别承担什么电气与复用职责？CR1.TE/RE能否替代引脚配置？

### 参考答案

**口述核心：** PA9输出USART复用推挽信号，PA10设合适输入；TE/RE控制USART内部发送/接收，不能替代GPIO。

#### 回答要点

按电路选择RX浮空或上拉等输入；确认GPIO时钟和映射；GPIO输出速度是电气边沿能力配置。

#### 常见误区与边界

不要求记HAL/SPL枚举；能表达硬件目标即可，RX电平仍需满足数据手册。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-002 | USART1的DMA映射

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1发送与接收分别映射到哪个DMA通道？怎样确认不会和其他外设冲突？

### 参考答案

**口述核心：** USART1_TX映射DMA1_CH4，USART1_RX映射DMA1_CH5。

#### 回答要点

查RM0008请求映射；核对控制器时钟和当前通道所有者；同一通道不能同时保留两套搬运配置。

#### 常见误区与边界

只适用于本题STM32F103RCT6的固定请求映射，不推广到有DMAMUX的芯片。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-003 | DMA发送完成与线路发送完成

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1用DMA1_CH4发送有限数据。DMA的TCIF4=1是否就能关闭USART或撤销RS485发送方向？

### 参考答案

**口述核心：** 不能；DMA完成只说明最后数据已搬到USART端，最后一帧可能仍在移位，需确认USART的TC。

#### 回答要点

区分DMA搬运完成与发送器物理完成；先停止继续供数，再关联本批TC并处理方向切换时序。

#### 常见误区与边界

DMA中断与USART中断是不同来源；没有TC也不能仅凭固定延时推定发送结束。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-004 | CR3中的DMA与半双工位

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1的CR3.DMAT、DMAR、HDSEL分别控制什么？置HDSEL是否就完成外部RS485接口？

### 参考答案

**口述核心：** DMAT/DMAR分别允许发送/接收DMA请求，HDSEL选择单线半双工模式。

#### 回答要点

单线半双工的引脚用法与普通双线模式不同；DMA通道和外部收发器仍独立配置。

#### 常见误区与边界

HDSEL不是RS485收发器方向控制位；电气接口及外部DE控制另行设计。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-005 | IDLE的含义与清除

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

USART1接收时IDLE表示什么，按什么顺序清除？它能天然定义任意应用消息结束吗？

### 参考答案

**口述核心：** IDLE表示硬件检测到规定空闲帧，按先读SR再读DR清；是否等于消息结束由协议决定。

#### 回答要点

记录DMA进度和接收数据时处理并发；SR/DR清除读取可能消耗DR数据，需统一数据所有者。

#### 常见误区与边界

消息内允许长间隔时IDLE会把一条消息分段；不把一次IDLE直接当完整可靠消息。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-006 | 时钟假设错误与波特率

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

BRR按72 MHz和115200算为0x0271，但USART1实际PCLK2仅36 MHz。实际速率如何，为什么可能乱码？

### 参考答案

**口述核心：** 实际约57600 baud，正好减半；分频值不变时输出速率随输入时钟同比变化。

#### 回答要点

先确认RCC实际时钟源和APB分频，再重算BRR并测位时间。

#### 常见误区与边界

不能把SYSCLK或编译期常量直接当已测PCLK2，误差表现还取决于远端实际配置。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart1-041 | 单字节回显的数据流程

标签：UART, STM32F103RCT6, 寄存器
难度：进阶

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式；涉及其他实例或模式时按题内条件。与HAL、SPL等软件库无关。

普通USART1轮询回显收到的一个字节。描述接收就绪、取数、发送就绪和末尾完成的流程，说明无输入时怎样避免无限卡住其他任务。

### 参考答案

**口述核心：** 确认RXNE再读DR，确认TXE后写发送DR；若需结束或切方向再等TC，并设置超时或非阻塞状态。

#### 回答要点

同时检查接收错误；按有效位宽处理数据；接收和发送可分为有界状态。

#### 常见误区与边界

不是要求编写或背诵库函数；一次回显成功不证明连续高速无丢失。

#### 依据

[ST RM0008：USART、DMA、RCC和AFIO章节](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)；[DS5792：高密度器件资源与引脚](https://www.st.com/resource/en/datasheet/stm32f103rc.pdf)；[ES0340：按芯片修订核对USART勘误](https://www.st.com/resource/en/errata_sheet/es0340-stm32f101xcde-stm32f103xcde-device-errata-stmicroelectronics.pdf)。

## uart-v3-reg-007 | DR访问方向与有效数据位

标签：UART, STM32F103RCT6, 寄存器
难度：基础

### 题目

芯片：STM32F103RCT6；外设：USART1，普通异步模式。DR同一地址的读与写各连接什么数据路径？DR[8:0]是否意味着每种帧格式都能交付9个有效数据位？

### 参考答案

**口述核心：** 写DR提交发送数据，读DR取得接收数据；数据字段最多9位，实际有效位数受M及校验配置限制。

#### 回答要点

发送TDR和接收RDR在软件地址上复用；8N1交付8有效位，9位无校验可用9位；启用校验后最高位用于校验。按本次帧格式取数据，不盲目总用8位或9位。

#### 常见误区与边界

读DR不是读回刚写的发送缓冲；读取可能清RXNE或参与错误清除序列。与其他代码或DMA争用DR会改变接收状态。

#### 依据

[ST RM0008：USART_DR、字长与校验](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。
