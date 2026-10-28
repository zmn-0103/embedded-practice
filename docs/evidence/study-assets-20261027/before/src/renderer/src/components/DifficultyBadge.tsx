import type { QuestionDifficulty } from '../../../shared/contracts/question-bank'

const levels = {
  基础: { label: '易（基础）', tone: 'easy' },
  进阶: { label: '中（进阶）', tone: 'medium' },
  综合: { label: '难（综合）', tone: 'hard' },
  未分级: { label: '未分级', tone: 'unrated' },
} as const

// 展示用语不改写题库、原方案或旧轮快照中的难度值。
export function difficultyLabel(difficulty: QuestionDifficulty) {
  return levels[difficulty].label
}

export function DifficultyBadge({ difficulty }: { difficulty: QuestionDifficulty }) {
  const level = levels[difficulty]
  return (
    <span
      className={`difficulty-badge difficulty-${level.tone}`}
      aria-label={`难度：${level.label}`}
    >
      {level.label}
    </span>
  )
}
