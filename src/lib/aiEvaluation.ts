import { z } from "zod"
import { generateObject } from "ai"

export interface EvalResult {
  score: number
  rating: "again" | "hard" | "good" | "easy"
  feedback: string
  correctParts: string[]
  missingParts: string[]
  wrongParts: string[]
  provider?: string
  modelName?: string
}

export const EVAL_SCHEMA = z.object({
  score: z.number().min(0).max(100),
  rating: z.enum(["again", "hard", "good", "easy"]),
  feedback: z.string(),
  correctParts: z.array(z.string()),
  missingParts: z.array(z.string()),
  wrongParts: z.array(z.string()),
})

export const DEFAULT_EVAL_PROMPT = `You are an expert AI tutor helping a student study using flashcards.
Analyze the student's answer compared to the reference answer for the given question.
Provide structured feedback on accuracy, correctness, and completeness.

Guidelines for rating:
- "again": The student's answer is completely wrong, irrelevant, or empty.
- "hard": The student got the core concept but missed key details, or made significant errors.
- "good": The student's answer is mostly correct and complete, with minor details missing.
- "easy": The student's answer is exceptionally correct, covers all details, and shows deep understanding.`

export function formatPrompt(template: string, question: string, referenceAnswer: string, userAnswer: string): string {
  let prompt = template || DEFAULT_EVAL_PROMPT
  
  const hasPlaceholders = prompt.includes("{question}") || prompt.includes("{referenceAnswer}") || prompt.includes("{userAnswer}")
  
  if (hasPlaceholders) {
    prompt = prompt
      .replace(/{question}/g, question)
      .replace(/{referenceAnswer}/g, referenceAnswer)
      .replace(/{userAnswer}/g, userAnswer)
  } else {
    // Append standard context
    prompt = `${prompt}
 
Question: ${question}
Reference Answer: ${referenceAnswer}
Student's Answer: ${userAnswer}`
  }
  
  return prompt
}

export async function evaluateAnswer(
  question: string,
  referenceAnswer: string,
  userAnswer: string,
  promptTemplate: string,
  model: any,
  provider?: string,
  modelName?: string
): Promise<EvalResult> {
  const prompt = formatPrompt(promptTemplate, question, referenceAnswer, userAnswer)
  
  const response = await generateObject({
    model,
    schema: EVAL_SCHEMA,
    prompt,
    system: "You evaluate student answers for flashcards and output structured JSON feedback.",
  })
  
  return {
    ...response.object,
    provider,
    modelName
  }
}
