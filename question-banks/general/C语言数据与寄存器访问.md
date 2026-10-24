---
schema_version: 1
topic_id: c-data-and-registers
topic_title: C语言数据与寄存器访问
---

## uart1-011 | 字符串对象所需空间

标签：C语言, 字符串, 单选题
难度：基础

### 题目

C 语言中，字符串 "Hello" 通常占用多少字节？

A. 4 字节

B. 5 字节

C. 6 字节

D. 10 字节

### 参考答案

**核心结论：** 选C，普通窄字符串字面量Hello有5个字符和末尾空字符，共6字节。

**必要解释：** 这里讨论字符串对象所需空间，不是指针变量本身的大小；ASCII字符每个占1字节。

**适用条件与依据：** 字符编码按题设ASCII；硬件寄存器的副作用须另查芯片手册，volatile不提供互斥或复合操作原子性。

[GCC：volatile边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C：为字符串与终止符保留空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## uart1-012 | C字符串终止符

标签：C语言, 字符串, 单选题
难度：基础

### 题目

以下哪个字符通常用于表示 C 字符串的结束？

A. '\r'

B. '\n'

C. '\0'

D. ' '

### 参考答案

**核心结论：** 选C，空字符反斜杠0是C字符串终止符。

**必要解释：** CR和LF是可能使用的应用协议分隔符，不会自动代替内存中的空字符终止。

**适用条件与依据：** 字符编码按题设ASCII；硬件寄存器的副作用须另查芯片手册，volatile不提供互斥或复合操作原子性。

[GCC：volatile边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C：为字符串与终止符保留空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## uart1-019 | ASCII字符与数值

标签：C语言, 字符编码, 判断题
难度：基础

### 题目

字符 '1' 的 ASCII 值是 0x01。

### 参考答案

**核心结论：** 错误。ASCII字符1的编码是0x31，不是数值1的0x01。

**必要解释：** 文本和二进制数值有不同表示；发送前应明确接收端期待哪种编码。

**适用条件与依据：** 字符编码按题设ASCII；硬件寄存器的副作用须另查芯片手册，volatile不提供互斥或复合操作原子性。

[GCC：volatile边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C：为字符串与终止符保留空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。

## uart1-030 | 字符数值与字符串

标签：C语言, 字符编码, 字符串
难度：基础

### 题目

字符与字符串

请解释以下三个概念的区别：

- 字符 '1'
- 数值 1
- 字符串 "1"

分别说明它们在 C 语言中的含义，以及字符 '1' 对应的 ASCII 值。

### 参考答案

**核心结论：** ASCII字符1的值是0x31，整数1是数值1，字符串1由0x31和空字符组成。

**必要解释：** 普通字符常量在C中类型为int，字符串字面量是数组；不要把字符编码、数值或数组指针混为一谈。

**适用条件与依据：** 字符编码按题设ASCII；硬件寄存器的副作用须另查芯片手册，volatile不提供互斥或复合操作原子性。

[GCC：volatile边界](https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html)；[SEI CERT C：为字符串与终止符保留空间](https://wiki.sei.cmu.edu/confluence/display/c/STR31-C.+Guarantee+that+storage+for+strings+has+sufficient+space+for+character+data+and+the+null+terminator)。
