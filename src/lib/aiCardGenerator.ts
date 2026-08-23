import { z } from "zod"
import { generateObject } from "ai"
import { generateHints } from "./aiHints"

export function formatCardPrompt(
  deckTitle: string,
  deckDescription: string,
  existingCards: { question: string }[],
  customInstructions?: string,
  preferredDifficulty?: string,
  preferredLabel?: string
): string {
  const existingCardsList = existingCards.length > 0
    ? existingCards.map((c, i) => `${i + 1}. ${c.question}`).join("\n")
    : "None"

  let prompt = `Generate exactly 10 high-quality flashcards for a study deck.

Deck Title: ${deckTitle}
Deck Description: ${deckDescription || "No description"}`

  if (existingCards.length > 0) {
    prompt += `\n\nExisting questions in the deck (do not duplicate or copy these closely):\n${existingCardsList}`
  }

  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\nCustom Instructions/Guidelines from user (strictly follow these!):\n${customInstructions.trim()}`
  }

  if (preferredDifficulty) {
    prompt += `\n\nDesired difficulty level for all cards: ${preferredDifficulty}`
  }

  if (preferredLabel) {
    prompt += `\n\nDesired label for all cards: "${preferredLabel}"`
  }

  prompt += `\n\nFormat each card with:
- question: A clear, plain-text question or prompt (do NOT include any HTML tags or markdown formatting)
- answer: A detailed and accurate answer, using basic HTML tags (like <strong>, <em>, <code> etc. if needed) for formatting`

  if (!preferredDifficulty) {
    prompt += `\n- difficulty: Choose a suitable difficulty level ("easy", "medium", "hard") for each card based on its content`
  }

  return prompt
}

/**
 * Generates exactly 10 flashcards using Vercel AI SDK and optionally generates hints.
 */
export async function generateCards(
  deckTitle: string,
  deckDescription: string,
  existingCards: { question: string }[],
  shouldGenerateHints: boolean,
  model: any,
  customInstructions?: string,
  hintPromptTemplate?: string,
  preferredDifficulty?: string,
  preferredLabel?: string
): Promise<any[]> {
  const prompt = formatCardPrompt(
    deckTitle,
    deckDescription,
    existingCards,
    customInstructions,
    preferredDifficulty,
    preferredLabel
  )

  // Dynamically build schema to only ask LLM to decide fields that are NOT predetermined
  const cardSchemaProps: Record<string, z.ZodTypeAny> = {
    question: z.string(),
    answer: z.string(),
  }

  if (!preferredDifficulty) {
    cardSchemaProps.difficulty = z.enum(["easy", "medium", "hard"])
  }

  const dynamicGeneratorSchema = z.object({
    cards: z.array(z.object(cardSchemaProps)),
  })

  const response = await generateObject({
    model,
    schema: dynamicGeneratorSchema,
    prompt,
    system: "You are an expert educational content generator. You create comprehensive, highly helpful study flashcards based on the provided deck context and user guidelines.",
  })

  let generated = response.object.cards

  if (generated.length > 10) {
    generated = generated.slice(0, 10)
  }

  // Inject predetermined labels and difficulties in post-processing
  let processed = generated.map((card: any) => ({
    question: card.question,
    answer: card.answer,
    difficulty: preferredDifficulty || card.difficulty || "medium",
    label: preferredLabel || "",
  }))

  if (shouldGenerateHints) {
    // Generate hints for each card in parallel using the hint generator functions
    const cardsWithHints = await Promise.all(
      processed.map(async (card) => {
        try {
          const hints = await generateHints(card.question, card.answer, 3, model, hintPromptTemplate)
          return {
            ...card,
            hints,
          }
        } catch (err) {
          console.error(`Failed to generate hints for card "${card.question}":`, err)
          return card
        }
      })
    )
    return cardsWithHints
  }

  return processed
}
