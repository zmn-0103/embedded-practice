import { MAX_IMPORT_BYTES } from '../../../shared/contracts/import-snapshot'
import { MAX_IMPORT_QUESTIONS } from '../../../shared/contracts/question-bank'
import { SourceFileError } from '../resources/read-file-snapshot'

export class ImportBudget {
  private bytes = 0
  private questions = 0

  get sourceBytes(): number {
    return this.bytes
  }

  get questionCount(): number {
    return this.questions
  }

  get remainingBytes(): number {
    return MAX_IMPORT_BYTES - this.bytes
  }

  addSource(byteLength: number): void {
    if (!Number.isSafeInteger(byteLength) || byteLength < 0 || byteLength > this.remainingBytes) {
      throw new SourceFileError(
        'LIMIT_EXCEEDED',
        '本批 Markdown 与图片源文件总大小不能超过 200MiB。',
      )
    }
    this.bytes += byteLength
  }

  addQuestions(count: number): void {
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count > MAX_IMPORT_QUESTIONS - this.questions
    ) {
      throw new SourceFileError('LIMIT_EXCEEDED', '本批题目总数不能超过 10,000 道。')
    }
    this.questions += count
  }
}
