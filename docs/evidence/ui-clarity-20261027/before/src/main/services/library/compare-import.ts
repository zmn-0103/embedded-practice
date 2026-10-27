import type { ImportSnapshot } from '../../../shared/contracts/import-snapshot'
import type { ImportCounts, ImportSummary } from '../../../shared/contracts/library-import'
import type { QuestionDifficulty } from '../../../shared/contracts/question-bank'

export interface BaselineQuestion {
  readonly questionId: string
  readonly title: string
  readonly tags: readonly string[]
  readonly difficulty: QuestionDifficulty
  readonly position: number
  readonly archived: boolean
  readonly contentHash: string
}
export interface BaselineTopic {
  readonly topicId: string
  readonly title: string
  readonly fileName: string
  readonly questions: readonly BaselineQuestion[]
}
export interface LibraryBaseline {
  readonly revision: number
  readonly topics: readonly BaselineTopic[]
}

function emptyCounts(): ImportCounts {
  return {
    added: 0,
    updated: 0,
    metadata: 0,
    unchanged: 0,
    archived: 0,
    restored: 0,
    newVersions: 0,
  }
}

export function compareImport(snapshot: ImportSnapshot, baseline: LibraryBaseline): ImportSummary {
  const previousTopics = new Map(baseline.topics.map((topic) => [topic.topicId, topic]))
  const total = emptyCounts()
  const topics = snapshot.topics.map((incoming): ImportSummary['topics'][number] => {
    const { topic } = incoming
    const previous = previousTopics.get(topic.topicId)
    const questions = new Map(
      previous?.questions.map((question) => [question.questionId, question]),
    )
    const hashes = new Map(incoming.contentHashes.map((item) => [item.questionId, item.hash]))
    const counts = emptyCounts()
    const changes = topic.questions.map(
      (question, position): ImportSummary['topics'][number]['questions'][number] => {
        const old = questions.get(question.questionId)
        const hash = hashes.get(question.questionId)
        if (hash === undefined) throw new Error('导入快照缺少题目内容指纹。')
        const contentChanged = old === undefined || old.contentHash !== hash
        const metadataChanged =
          old !== undefined &&
          (old.title !== question.title ||
            old.difficulty !== question.difficulty ||
            old.position !== position ||
            JSON.stringify(old.tags) !== JSON.stringify(question.tags))
        const kind =
          old === undefined
            ? 'added'
            : old.archived
              ? 'restored'
              : contentChanged
                ? 'updated'
                : metadataChanged
                  ? 'metadata'
                  : 'unchanged'
        counts[kind]++
        if (contentChanged) counts.newVersions++
        questions.delete(question.questionId)
        return { questionId: question.questionId, kind, contentChanged }
      },
    )
    for (const old of questions.values()) {
      if (!old.archived) {
        changes.push({ questionId: old.questionId, kind: 'archived', contentChanged: false })
        counts.archived++
      }
    }
    for (const key of Object.keys(total) as (keyof ImportCounts)[]) total[key] += counts[key]
    return {
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      metadataChanged:
        previous === undefined ||
        previous.title !== topic.topicTitle ||
        previous.fileName !== topic.fileName,
      counts,
      questions: changes,
    }
  })
  return { counts: total, topics }
}
