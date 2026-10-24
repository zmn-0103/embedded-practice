#include <stdint.h>

/* AI 编译核对样例：仅假定指针有效、32 位对齐且指向普通可读写对象。
 * 不访问硬件，不属于学习工程，也不证明特殊外设寄存器适合读改写。 */
_Static_assert(sizeof(uint32_t) == 4, "probe requires a 32-bit object");

__attribute__((noinline)) void probe_write(volatile uint32_t *reg, uint32_t value)
{
    *reg = value;
}

__attribute__((noinline)) void probe_rmw(volatile uint32_t *reg, uint32_t mask)
{
    *reg |= mask;
}
