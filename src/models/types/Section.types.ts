import { IQuestion } from '~/models/schemas/Question.schema'
import { IQuestionGroup } from '~/models/schemas/QuestionGroup.schema'

interface SectionIndividual {
  type: 'individual'
  group?: never
  questions?: never
  question: Omit<IQuestion, 'testId' | 'questionGroupId'>
}

interface SectionGroup {
  type: 'group'
  group: IQuestionGroup
  questions: Omit<IQuestion, 'testId' | 'questionGroupId'>[]
}

export type Section = SectionIndividual | SectionGroup
