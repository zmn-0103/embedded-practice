---
schema_version: 1
topic_id: general-uart
topic_title: UART 通用原理
---

## uart-general-001 | UART位时间与有效传输时间

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

二进制异步UART采用115200 baud、8N1；无流控暂停、重发或额外间隔。求位时间、有效字节率，以及连续100字节和1000字节的理论线上时间。

### 参考答案

**口述核心：** 位时间约8.681微秒，有效字节率11520 B/s；100字节约8.681 ms，1000字节约86.806 ms。

#### 回答要点

每字节含1起始位+8数据位+1停止位，共10 bit；时间=字节数×10/115200。

#### 常见误区与边界

波特率在每符号1 bit时才与线路bit率数值相等；软件显示时间还含调度与缓冲延迟。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-general-002 | LF文本接收与超长消息恢复

标签：UART, 通用原理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

消息仅含可打印ASCII，LF结束且不入正文，允许空消息。32字节数组交付C字符串。说明31字节边界、终止符和超长后的恢复策略。

### 参考答案

**口述核心：** 最多保存31字节正文，收到LF再补NUL；超长后丢弃整条直到下一个LF，再重启接收。

#### 回答要点

先识别LF，31个正文后接LF仍合法；第32个正文触发丢弃状态；空消息写入首个NUL。

#### 常见误区与边界

不能在超长消息中途立即重新计数，否则尾部会冒充新消息；二进制协议需另定规则。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-001 | UART三线连接

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

两个无隔离、逻辑电平兼容的UART设备做三线全双工通信，TX、RX、参考地如何相连？为什么TX对TX通常不能通信？

### 参考答案

**口述核心：** 一端TX接另一端RX，反向同理，并建立共同参考地。

#### 回答要点

TX是输出，RX是输入；先核对电压和共地，再检查是否交叉；输出对接还可能造成电气争用。

#### 常见误区与边界

共地条件针对题设非隔离单端链路；隔离收发器按隔离侧参考设计连接。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-002 | 8N1帧与配置一致性

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

普通异步UART中8N1表示什么？单字节在线路上占多少bit？两端数据位、校验或停止位不一致会怎样？

### 参考答案

**口述核心：** 8个有效数据位、无校验、1停止位，加1起始位共10 bit。

#### 回答要点

收发双方需约定相同波特率和帧格式；不匹配可导致乱码、校验或帧错误、接收失败。

#### 常见误区与边界

不存在所有平台通用的固定数据位和停止位组合；硬件支持范围需查手册。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-013 | 字符数值与CRLF

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

采用ASCII编码。字符“1”和数值1分别是什么字节？CRLF按什么顺序占多少字节？它与内存NUL终止符有什么区别？

### 参考答案

**口述核心：** 字符“1”为0x31，数值1为0x01；CRLF是0x0D、0x0A两个字节。

#### 回答要点

CR和LF是协议可约定的控制字符；NUL为0x00，C字符串用它标记内存结束。

#### 常见误区与边界

发送字符串不必自动把NUL发到线路；多字节字符编码下字符数不等于字节数。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-021 | LF协议只收到CR

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

应用仅把LF当消息结束，正文不允许CR。发送端只发CR，会不会自动结束消息？应怎样处理不匹配？

### 参考答案

**口述核心：** 不会自动结束；按协议拒绝非法CR或等待LF，并通过超时恢复不完整消息。

#### 回答要点

检查串口助手实际发送字节；统一发送协议和接收策略；给等待过程设期限或非阻塞状态。

#### 常见误区与边界

CR、LF不由UART硬件统一解释，不能假定所有终端都发送相同结束符。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-025 | 本地回显与重复字符辨别

标签：UART, 通用原理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

PC串口窗口显示AABBCC，发送内容原为ABC。如何区分本地回显、设备回传和设备重复发送？

### 参考答案

**口述核心：** 关闭本地回显，对照设备TX线上原始字节和软件发送次数。

#### 回答要点

只显示输入不证明设备回传；分别记录PC TX、设备TX；检查重复提交或收发短接。

#### 常见误区与边界

窗口呈现顺序与线程刷新有关，不能只凭字符排列确定故障原因。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-031 | 字节流为什么没有应用消息边界

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

不绑定具体芯片，说明UART硬件完成什么分帧，为什么仍不知道一条应用消息在哪里结束，并列出三种消息边界策略。

### 参考答案

**口述核心：** 硬件识别字符帧，应用消息需另用长度、分隔符、固定长度或协议超时等规则。

#### 回答要点

一条消息可能跨多次接收通知，一次通知也可能覆盖多条消息；接收缓冲与协议解析分工。

#### 常见误区与边界

空闲间隔只有在协议约定间隔上限时才可当消息边界；硬件错误后还需重新同步。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-033 | 阻塞接收与超时

标签：UART, 通用原理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

某系统既要收串口又要处理按键，串口可能长时间无数据。比较无限阻塞等待、有限超时和非阻塞接收。

### 参考答案

**口述核心：** 无限等待可能拖住其他任务；有限超时或事件驱动状态机让系统继续响应。

#### 回答要点

区分CPU忙等和任务阻塞；按实时需求安排中断、缓冲和消费；定义超时与部分消息恢复。

#### 常见误区与边界

阻塞本身不是错误，有专用任务且等待可控时可用；不能把非阻塞等同零延迟。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-036 | 只收到字符串前半段

标签：UART, 通用原理
难度：综合

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

发送端应发HELLO123，接收端只保存HELLO。至少从线路、硬件服务、缓冲和协议四层提出假设，并说明怎样验证。

### 参考答案

**口述核心：** 先抓原始发送/接收字节，再查硬件溢出、接收服务延迟、数组边界和提前结束条件。

#### 回答要点

比较线上字节与内存内容；记录错误和长度；检查接收空窗、过滤条件和显示NUL。

#### 常见误区与边界

现象不能唯一证明某一原因；一次只改变一个条件并保留证据。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart1-037 | LF消息遇到CRLF

标签：UART, 通用原理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

接收程序以LF结束消息；发送端改发CRLF。若程序把LF以前所有字节存为正文，会出现什么？怎样设计明确兼容策略？

### 参考答案

**口述核心：** 正文会多出末尾CR；可约定CRLF并剥离末尾CR，或禁止CR并明确报错。

#### 回答要点

先规定合法正文与结束序列；若兼容LF和CRLF，只移除紧邻LF的单个CR；保留越界与超长恢复。

#### 常见误区与边界

不能无条件删除二进制数据或合法正文中的所有CR；兼容策略属于应用协议。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-001 | UART的职责

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

UART的英文全称是什么？它在CPU数据与线路之间完成哪些主要工作？

### 参考答案

**口述核心：** Universal Asynchronous Receiver/Transmitter，即通用异步收发器，负责并串转换及字符帧收发。

#### 回答要点

发送端加起始/停止及可选校验，接收端采样并恢复数据，提供状态或事件供软件处理。

#### 常见误区与边界

UART不自动完成应用消息解析、重发、CRC或完整业务协议。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-002 | 异步收发怎样同步

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

异步UART没有共享时钟线，双方如何对齐采样？时钟误差为什么会影响接收？

### 参考答案

**口述核心：** 靠起始位定位一帧，再按约定波特率在预期位中心采样。

#### 回答要点

每帧重新同步；双方时钟偏差使采样位置逐位累积偏移；帧越长容差条件越需核对。

#### 常见误区与边界

容许误差受硬件采样实现和帧格式影响，不能给所有UART统一的百分比。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-003 | 单工半双工与全双工

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

从通信方向和同时性解释单工、半双工、全双工，并说明仅有两根信号线是否就能判定工作方式。

### 参考答案

**口述核心：** 单工固定单向，半双工可双向但分时，全双工允许同时双向。

#### 回答要点

方向能力、收发器连接和协议调度共同决定实际模式；常见TX/RX分线可支持全双工。

#### 常见误区与边界

不能把某种电气标准与一种协议工作方式完全等同。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-004 | 流控解决什么问题

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

接收端暂时跟不上发送端，RTS/CTS与XON/XOFF各怎样限制发送？启用流控需要哪些约定？

### 参考答案

**口述核心：** 硬件流控用控制线，软件流控用约定控制字符，目的都是避免接收积压。

#### 回答要点

双方支持并配置；核对接线和极性；二进制载荷需避免软件控制字符冲突。

#### 常见误区与边界

流控不是UART默认必有功能，不能恢复已丢数据，也不能取代足够的缓冲与及时服务。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-005 | 接收错误分类

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

不绑定寄存器名，区分帧错误、校验错误、采样噪声和接收溢出。清错误状态是否等于恢复正确数据？

### 参考答案

**口述核心：** 分别指停止位异常、奇偶不匹配、采样判定噪声和旧数据未取走时后续数据到达；清状态不恢复丢失数据。

#### 回答要点

结合原始数据、线路和处理时序定位；错误后的消息应丢弃、标记或请求重发。

#### 常见误区与边界

错误检测能力和具体标志清除规则由芯片规定；无错误标志也不证明整个消息正确。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-006 | 逻辑UART与RS232及RS485

标签：UART, 通用原理
难度：基础

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

逻辑电平UART引脚能直接接RS232或RS485总线吗？应分别核对哪些电气条件？

### 参考答案

**口述核心：** 不能直接互连，需匹配的电平转换器或差分收发器。

#### 回答要点

逻辑UART为单端逻辑接口；RS232的电平和逻辑极性不同；RS485为差分接口并涉及终端及方向控制。

#### 常见误区与边界

3.3V或5V不是所有引脚的固定耐受能力；按器件数据手册核对，不以串口外形判断电气标准。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。[TI MAX3232：逻辑UART与RS232转换](https://www.ti.com/lit/ds/symlink/max3232.pdf)；[TI SN65HVD308xE：逻辑接口与RS485差分总线](https://www.ti.com/lit/ds/symlink/sn65hvd3082e.pdf)。具体引脚容限按两端器件数据手册核对。

## uart-v3-general-007 | UART配置的验证证据

标签：UART, 通用原理
难度：进阶

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

不依赖具体库，给出至少两种验证UART配置、接线和实际波特率的方法，各能证明什么？

### 参考答案

**口述核心：** 可用已知字节回环、逻辑分析仪解码、示波器测位时间并与原始接收数据对照。

#### 回答要点

回环验证局部收发链，波形验证电平和位时间，端到端测试验证实际路径与协议。

#### 常见误区与边界

回环通过不证明外部收发器和远端正常；调试助手显示正确也不能代替电气测量。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-008 | 偶发乱码的分层排查

标签：UART, 通用原理
难度：综合

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

两端配置表上波特率、数据位、校验和停止位一致，仍偶发乱码，还应检查什么？

### 参考答案

**口述核心：** 检查实际时钟误差、电平和共地、干扰与线长、服务延迟、丢字节及显示编码。

#### 回答要点

发送固定已知字节；同时对照线路解码、硬件错误和内存数据；区分位时序错与应用解析错。

#### 常见误区与边界

“配置相同”不保证实际速率相同，不能只凭乱码断言软件或硬件坏。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。

## uart-v3-general-009 | 接收端跟不上时怎样恢复

标签：UART, 通用原理
难度：综合

### 题目

适用范围：不限定MCU或软件库；具体电气或协议条件以本题为准。

接收数据率长期或短时超过处理能力，如何缓解积压并恢复消息同步？扩大数组能解决所有丢数据吗？

### 参考答案

**口述核心：** 及时取硬件数据、分离接收与解析、用有界缓冲和流控；必要时降速或明确丢弃并重新同步。

#### 回答要点

测量输入率与消费率；短峰值靠缓冲，长期不足需改变处理或输入速率；记录丢失。

#### 常见误区与边界

更大数组不改善硬件寄存器服务延迟，DMA也不自动解决消费者长期过慢。

#### 依据

[Microchip USART字符帧](https://onlinedocs.microchip.com/oxy/GUID-7BB81102-57F6-474D-9BFE-B2AF8EA02A1E-en-US-5/GUID-F84E04E8-3235-4E21-89A9-D1911E9B91DD.html)；[ST RM0008：USART通信原理](https://www.st.com/resource/en/reference_manual/rm0008-stm32f101xx-stm32f102xx-stm32f103xx-stm32f105xx-and-stm32f107xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)。电气接口另按两端器件数据手册核对。
