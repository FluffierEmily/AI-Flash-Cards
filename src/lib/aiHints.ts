import { z } from "zod"
import { generateObject } from "ai"

export const HINTS_SCHEMA = z.object({
  hints: z.array(z.string()).max(3),
})

export const DEFAULT_HINT_PROMPT = `Generate progressive study hints to help a student recall the answer to this question.

Strict rules:
1. Each hint must be relatively short, clear, and helpful. It should guide the user towards the answer without revealing the answer itself.
2. Format each hint using simple HTML tags (like <strong>, <em>, etc.) wrapped in '<p>...</p>' (e.g. '<p>It is based on the <strong>forgetting curve</strong>.</p>').
3. Do not include numbering or prefixes like "Hint 1:" or "1." in the hint text.
4. Each hint should be progressive (the first hint is high-level, subsequent ones give more details).`

export function formatHintPrompt(template: string, question: string, answer: string, count: number): string {
  let prompt = template || DEFAULT_HINT_PROMPT

  const hasPlaceholders = prompt.includes("{question}") || prompt.includes("{answer}") || prompt.includes("{count}")

  if (hasPlaceholders) {
    prompt = prompt
      .replace(/{question}/g, question)
      .replace(/{answer}/g, answer)
      .replace(/{count}/g, String(count))
  } else {
    prompt = `${prompt}

Question: ${question}
Official Answer: ${answer}
Number of Hints to Generate: ${count}`
  }

  return prompt
}

/**
 * Generates progressive study hints using Vercel AI SDK and the resolved LLM model.
 */
export async function generateHints(
  question: string,
  answer: string,
  count: number,
  model: any,
  promptTemplate?: string
): Promise<string[]> {
  const prompt = formatHintPrompt(promptTemplate || DEFAULT_HINT_PROMPT, question, answer, count)

  const response = await generateObject({
    model,
    schema: HINTS_SCHEMA,
    prompt,
    system: "You generate helpful progressive hints for flashcards using clean HTML inside a JSON array.",
  })

  return response.object.hints
}
