import { useNavigate } from "react-router-dom"
import { FlashcardReview } from "../components/Flashcard/Flashcards"
import type { Deck } from "../components/Deck/Deck"
import type { SettingsState } from "../components/Settings"
import { calculateNextReview, recordNewCardReviewed } from "../lib/spacedRepetition"
import { saveReviewHistoryRecord } from "../lib/historyStorage"

interface ReviewPageProps {
  reviewQueue: any[]
  decks: Deck[]
  settings: SettingsState
  handleUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  decryptedKeys: Record<string, string>
  setDecryptedKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>
}

export function Review({
  reviewQueue,
  decks,
  settings,
  handleUpdateSetting,
  decryptedKeys,
  setDecryptedKeys,
  setDecks,
}: ReviewPageProps) {
  const navigate = useNavigate()

  return (
    <div className="max-w-[900px] mx-auto w-full">
      <FlashcardReview
        cards={reviewQueue}
        decks={decks}
        settings={settings}
        onUpdateSetting={handleUpdateSetting}
        decryptedKeys={decryptedKeys}
        setDecryptedKeys={setDecryptedKeys}
        onClose={() => navigate("/dashboard")}
        onReviewCard={(cardId, rating, reviewDuration, aiEvaluation, userAnswer) => {
          let cardToReview = null
          for (const deck of decks) {
            const card = deck.cards.find(c => c.id === cardId)
            if (card) {
              cardToReview = card
              break
            }
          }

          if (!cardToReview) return

          if (!cardToReview.nextReviewDate) {
            recordNewCardReviewed(cardId)
          }

          const { newHistoryEntry, ...schedulingFields } = calculateNextReview(cardToReview, rating)
          newHistoryEntry.reviewDuration = reviewDuration
          if (aiEvaluation) newHistoryEntry.aiEvaluation = aiEvaluation
          if (userAnswer) newHistoryEntry.userAnswer = userAnswer

          saveReviewHistoryRecord(newHistoryEntry).catch(err => {
            console.error("Failed to save review history to IndexedDB", err)
          })

          setDecks((prevDecks) => {
            return prevDecks.map(deck => {
              const cardIndex = deck.cards.findIndex(c => c.id === cardId)
              if (cardIndex === -1) return deck

              const updatedCards = [...deck.cards]
              updatedCards[cardIndex] = {
                ...updatedCards[cardIndex],
                ...schedulingFields
              }

              return {
                ...deck,
                cards: updatedCards
              }
            })
          })
        }}
      />
    </div>
  )
}
