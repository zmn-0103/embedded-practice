import type { StudyError } from '../../../shared/contracts/study'

export class StudyFault extends Error {
  constructor(
    readonly code: StudyError['code'],
    message: string,
  ) {
    super(message)
  }
}
