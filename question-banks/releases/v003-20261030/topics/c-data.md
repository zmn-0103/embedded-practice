---
schema_version: 1
topic_id: c-data-and-registers
topic_title: C 语言数据与表示
---

## uart1-030 | 字符、数值与字符串对象

标签：C语言, 字符编码
难度：基础

### 题目

按 ASCII 编码讨论 C 语言中的字符常量 '1'、整数 1 和字符串字面量 "1"：它们表示什么？"Hello" 的字符数组对象需要多少字节，是否等于指针变量大小？

### 参考答案

**核心回答：** 字符 '1' 的编码为 0x31，整数 1 表示数值一；"1" 是含字符和末尾空字符的数组。"Hello" 对象含 5 个字母和终止空字符，共 6 字节。

#### 回答要点

普通字符常量在 C 中类型为 int；字符串对象与指向它的指针是不同对象，指针大小取决于平台。

#### 易混点与适用边界

不讨论其他字符编码或宽字符串；字节数组只有具备正确终止条件才可按 C 字符串处理。

#### 来源

[SEI CERT C STR31-C：字符串及终止空字符所需空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## uart1-012 | 字符串的结束条件

标签：C语言, 字符串
难度：基础

### 题目

在 C 中，内存里的字符串用什么标记结束？串口协议中的回车和换行是否自动承担相同作用？

### 参考答案

**核心回答：** C 字符串以空字符 '\0' 结束；回车和换行只是字符或协议分隔符，不自动代替内存终止标记。

#### 回答要点

接收缓冲区可能保存二进制数据，应区分长度控制和终止字符串，并为终止空字符预留空间。

#### 易混点与适用边界

不能仅因收到 CR/LF 就认为数组已安全终止。

#### 来源

[SEI CERT C STR31-C：字符串及终止空字符所需空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## uart1-019 | 文本编码与二进制数值

标签：C语言, 字符编码
难度：基础

### 题目

在 ASCII 条件下，对端要求文本字符 1 和要求一个值为 1 的二进制字节，发送内容有什么不同？

### 参考答案

**核心回答：** 文本字符 1 编码为 0x31；数值为 1 的二进制字节是 0x01。

#### 回答要点

传输协议应约定文本/二进制、长度和分隔方式；显示出来的数字不等于线路上的原始字节。

#### 易混点与适用边界

同一数值可以有不同表示，解释应以双方约定为准。

#### 来源

[SEI CERT C STR31-C：字符串及终止空字符所需空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## c-volatile-boundary | 访问可见性与并发保证

标签：C语言, volatile, 并发
难度：进阶

### 题目

在实现使用 volatile 访问内存映射外设或中断共享对象的环境下，volatile 主要约束什么？它能保证复合操作不可中断、多个执行者互斥或跨核同步吗？

### 参考答案

**核心回答：** volatile 用于按实现约定保留对对象的访问，不能单独保证复合操作原子性、互斥或跨核同步。

#### 回答要点

例如对普通共享变量执行读—修改—写，仍可能被另一执行者插入。应根据平台采用临界区、原子操作或适当同步；硬件寄存器还需核对访问宽度和副作用。

#### 易混点与适用边界

本题讨论 C 与编译器/平台边界，不断言所有 volatile 对象的单次访问都同样原子。

#### 来源

[GCC：volatile 访问的保证与边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C CON02-C：不能以 volatile 代替同步](https://wiki.sei.cmu.edu/confluence/display/c/CON02-C.+Do+not+use+volatile+as+a+synchronization+primitive)。

## c-field-update | 字段替换与寄存器副作用

标签：C语言, 位运算, 寄存器
难度：进阶

### 题目

给定一个普通 32 位可读写值，需要把[5:4]字段替换成二进制 10，其他位不变，且本题不存在并发修改。应怎样用掩码描述操作？同样的读改写能否直接套到所有硬件状态寄存器？

### 参考答案

**核心回答：** 先清目标字段，再写新值：value=(value & ~(3u<<4)) | (2u<<4)。不能直接推广到所有硬件寄存器。

#### 回答要点

按位或只能置位，不能清除旧字段中的 1；对写一清零、读清零、只写等寄存器，先按芯片手册选择访问方式。

#### 易混点与适用边界

本题是普通可读写值且无并发前提；如果存在共享修改，需要另外处理原子性。

#### 来源

[GCC：volatile 访问的保证与边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C CON02-C：不能以 volatile 代替同步](https://wiki.sei.cmu.edu/confluence/display/c/CON02-C.+Do+not+use+volatile+as+a+synchronization+primitive)。
