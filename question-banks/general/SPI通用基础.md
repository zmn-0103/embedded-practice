---
schema_version: 1
topic_id: general-spi
topic_title: SPI 通用基础
---

## spi-general-001 | 根据时钟极性与相位判断采样边沿

标签：SPI, 时序分析, 概念题
难度：基础

### 题目

某四线 SPI 链路使用常见的 CPOL/CPHA 定义：CPOL 决定 SCK 空闲电平，CPHA=0 在离开空闲电平的第一个边沿采样，CPHA=1 在第二个边沿采样。双方工作模式一致，并满足器件规定的建立、保持与片选时序。

当 CPOL=0、CPHA=0 时，SCK 空闲电平和采样边沿分别是什么？仅把双方 CPOL 改为 1、CPHA 仍为 0 时，采样边沿如何变化？为什么不能把“CPHA=0”直接等同于“上升沿采样”？

### 参考答案

**核心结论：** CPOL=0、CPHA=0 时空闲为低，第一边沿为上升沿，因此在上升沿采样。CPOL=1、CPHA=0 时空闲为高，第一边沿变成下降沿，因此在下降沿采样。

**必要解释：** 相位描述的是相对空闲电平的第一或第二边沿；上升、下降由极性共同决定。CPHA=0 时，首个被采样的数据位必须在第一个采样边沿前准备好。

**成立条件：** 模式编号和配置名称需与实际器件时序图核对。模式一致只是必要条件，还要满足频率、数据建立/保持时间和片选要求，不能只看配置常量名称。

#### 技术依据

[Analog Devices：SPI 模式表与时序](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)、[AN-1248：由器件时序判断接口兼容性](https://www.analog.com/en/resources/app-notes/an-1248.html)。

## spi-general-002 | 控制器读取数据时为什么仍需提供时钟

标签：SPI, 全双工, 时序分析, 情景分析
难度：进阶

### 题目

某四线全双工 SPI 器件规定：片选低有效，一次读取事务保持片选为低；先发送 1 字节命令，随后紧接 2 字节返回数据。每帧 8 bit，没有地址阶段、额外等待时钟或间隔要求；命令阶段的返回字节无意义。数据阶段器件允许控制器发送任意占位字节，模式与电气条件均已匹配。

控制器发送命令后，能否停止产生 SCK、只等待 2 字节自动到来？请描述收发顺序，计算完整事务需要多少个 SCK 周期，并说明何时才能释放片选。无需写寄存器或驱动代码。

### 参考答案

**核心结论：** 不能停止时钟后等待数据自行到来。控制器发送命令并处理、丢弃命令阶段的接收字节，再发送两个占位字节，为器件提供时钟，同时取得两个有效返回字节。

**必要解释：** 每帧 8 个 SCK 周期，本题共 3 帧，因此需要 `3 × 8 = 24` 个周期。控制器提供时钟，MOSI 与 MISO 在传输时并行工作；发送占位数据并不表示把这些值写入器件业务寄存器。

**成立条件：** 最后一帧实际完成且满足片选保持时间后才能释放片选。发送缓冲可写不必然表示线路已结束。实际事务的命令、占位值、额外时钟和片选边界都由目标器件协议决定；等待仍须处理错误与超时。

#### 技术依据

[Analog Devices：SPI 时钟、独立收发线与全双工传输](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。24 周期及三帧事务由本题完整给定的协议推导，不代表某款 Flash 的命令。

## spi1-001 | SPI时钟信号

标签：SPI, 信号线, 单选题
难度：基础

### 题目

SPI 通信中，SCK 的主要作用是什么？

A. 选择目标 Flash  
B. 提供同步串行时钟  
C. 只传输 Flash 返回的数据  
D. 清除 Flash 的 BUSY 标志

### 参考答案

**核心结论：** 选B，SCK提供同步串行时钟。

**必要解释：** 常见控制器/目标设备模式中由控制器产生时钟，目标设备按约定边沿采样和更新数据。

**适用条件与依据：** 只采用题设的协议、电气或量化模型；不假定特定MCU寄存器、引脚、厂商库或器件自动递增行为。

[Analog Devices：SPI接口与模式](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。

## spi1-002 | MOSI的传输方向

标签：SPI, 信号线, 单选题
难度：基础

### 题目

在常见 SPI 主机与 Flash 的连接中，MOSI 的作用是什么？

A. 主机向 Flash 发送命令、地址或数据  
B. Flash 向主机返回数据  
C. 只负责选择 Flash  
D. 只负责指示 Flash 是否忙

### 参考答案

**核心结论：** 选A，MOSI沿控制器到目标设备方向传输命令、地址或数据。

**必要解释：** MISO为反方向；这些线名按控制器视角命名，不能像UART那样机械交叉同名含义。

**适用条件与依据：** 只采用题设的协议、电气或量化模型；不假定特定MCU寄存器、引脚、厂商库或器件自动递增行为。

[Analog Devices：SPI接口与模式](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。

## spi1-003 | SPI模式编号

标签：SPI, CPOL, CPHA, 单选题
难度：基础

### 题目

SPI Mode 0 的配置是？

A. CPOL=0，CPHA=0  
B. CPOL=0，CPHA=1  
C. CPOL=1，CPHA=0  
D. CPOL=1，CPHA=1

### 参考答案

**核心结论：** 选A，Mode0为CPOL=0、CPHA=0。

**必要解释：** 空闲时钟低，首个有效边沿采样；仍须核对双方建立/保持时间与片选要求。

**适用条件与依据：** 只采用题设的协议、电气或量化模型；不假定特定MCU寄存器、引脚、厂商库或器件自动递增行为。

[Analog Devices：SPI接口与模式](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。

## spi1-004 | 全双工的接收处理

标签：SPI, 全双工, 单选题
难度：基础

### 题目

SPI 全双工模式下，主机发送一个字节时为什么还要处理接收数据？

A. SPI 会自动发送两遍  
B. 每次发送都必须重新初始化 GPIO  
C. 发送和接收会同时进行  
D. 只有 Flash 忙时才会接收数据

### 参考答案

**核心结论：** 选C，同一组时钟下发送和接收同时移位。

**必要解释：** 即使本阶段收到的值无业务意义，MCU侧仍需按手册处理接收状态以防溢出。

**适用条件与依据：** 只采用题设的协议、电气或量化模型；不假定特定MCU寄存器、引脚、厂商库或器件自动递增行为。

[Analog Devices：SPI接口与模式](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。

## spi1-019 | SPI四种信号职责

标签：SPI, 信号线
难度：基础

### 题目

请写出 SPI 四个常见信号 SCK、MOSI、MISO、CS 的作用。

### 参考答案

**核心结论：** SCK提供时钟，MOSI为控制器发送，MISO为目标返回，CS选择目标并界定事务。

**必要解释：** CS极性和时序由器件协议约定；多目标共享总线还需确保未选设备释放输出。

**适用条件与依据：** 只采用题设的协议、电气或量化模型；不假定特定MCU寄存器、引脚、厂商库或器件自动递增行为。

[Analog Devices：SPI接口与模式](https://www.analog.com/en/resources/analog-dialogue/articles/2018/08/13/15/31/introduction-to-spi-interface.html)。
