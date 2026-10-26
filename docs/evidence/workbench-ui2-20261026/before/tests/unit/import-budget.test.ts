import { describe, expect, it } from 'vitest'
import { MAX_IMPORT_BYTES } from '../../src/shared/contracts/import-snapshot'
import { MAX_IMPORT_QUESTIONS } from '../../src/shared/contracts/question-bank'
import { ImportBudget } from '../../src/main/services/library/import-budget'

describe('整批大小与题量预算', () => {
  it('多个来源可以精确累加到 200MiB，下一字节拒绝且计数不变', () => {
    const budget = new ImportBudget()
    budget.addSource(1024)
    budget.addSource(MAX_IMPORT_BYTES - 1024)
    expect(budget.sourceBytes).toBe(200 * 1024 * 1024)
    expect(budget.remainingBytes).toBe(0)
    expect(() => budget.addSource(1)).toThrow('200MiB')
    expect(budget.sourceBytes).toBe(MAX_IMPORT_BYTES)
  })

  it('跨专题题量合计限 10,000，拒绝后保留原合计', () => {
    const budget = new ImportBudget()
    budget.addQuestions(6000)
    budget.addQuestions(4000)
    expect(budget.questionCount).toBe(MAX_IMPORT_QUESTIONS)
    expect(() => budget.addQuestions(1)).toThrow('10,000')
    expect(budget.questionCount).toBe(10_000)
  })

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '拒绝非法计数 %s，不污染后续预算',
    (invalid) => {
      const budget = new ImportBudget()
      expect(() => budget.addSource(invalid)).toThrow()
      expect(() => budget.addQuestions(invalid)).toThrow()
      expect(budget.sourceBytes).toBe(0)
      expect(budget.questionCount).toBe(0)
      budget.addSource(1)
      budget.addQuestions(1)
      expect(budget.sourceBytes).toBe(1)
      expect(budget.questionCount).toBe(1)
    },
  )
})
