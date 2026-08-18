import type { Flashcard, MasteryLevel, ReviewHistoryEntry } from "../components/Flashcard/Flashcard"
import type { Deck } from "../components/Deck/Deck"
import type { SettingsState } from "../components/Settings"
import { fcmCloudService } from "./fcm"
export interface LocalReminder {
  id: string
  taskId: string
  title: string
  body: string
  sendAt: number
  useLocalEmulator: boolean
}

/**
 * Calculates the next review date, interval, repetition, ease factor, and mastery level
 * for a card based on the user's rating.
 */
export function calculateNextReview(
  card: Flashcard,
  rating: "again" | "hard" | "good" | "easy"
): {
  interval: number
  repetition: number
  easeFactor: number
  nextReviewDate: string
  lastReviewed: string
  masteryLevel: MasteryLevel
  history: ReviewHistoryEntry[]
} {
  let interval = card.interval || 0
  let repetition = card.repetition || 0
  let easeFactor = card.easeFactor || 2.5
  let masteryLevel = card.masteryLevel || "learning"

  const prevEaseFactor = easeFactor
  const prevInterval = interval

  // Map ratings to numeric qualities
  // again = 1, hard = 3, good = 4, easy = 5
  let quality = 4
  if (rating === "again") quality = 1
  else if (rating === "hard") quality = 3
  else if (rating === "good") quality = 4
  else if (rating === "easy") quality = 5

  if (quality < 3) {
    // Failed card (Again)
    repetition = 0
    interval = 1 // 1 day
    easeFactor = Math.max(1.3, easeFactor - 0.2)

    // Mastery level update
    if (card.masteryLevel === "proficient" || card.masteryLevel === "mastered") {
      masteryLevel = "slipUp"
    } else {
      masteryLevel = "weakness"
    }
  } else {
    // Successful card
    if (repetition === 0) {
      interval = 1 // 1 day
    } else if (repetition === 1) {
      interval = rating === "easy" ? 3 : 6 // Easy starts with 3 days, Hard/Good with 6 days
    } else {
      let factor = easeFactor
      if (rating === "hard") factor *= 0.8 // Hard
      if (rating === "easy") factor *= 1.3 // Easy
      interval = Math.max(1, Math.round(interval * factor))
    }

    // Update easeFactor based on quality
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    easeFactor = Math.max(1.3, easeFactor)

    repetition += 1

    // Mastery level update
    if (rating === "hard") {
      masteryLevel = "learning"
    } else if (rating === "good") {
      if (repetition >= 3) {
        masteryLevel = "mastered"
      } else {
        masteryLevel = "proficient"
      }
    } else if (rating === "easy") {
      if (repetition >= 2) {
        masteryLevel = "mastered"
      } else {
        masteryLevel = "proficient"
      }
    }
  }

  const now = new Date()
  const lastReviewed = now.toISOString()

  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + interval)
  const nextReviewDate = nextReview.toISOString()

  // Construct history entry
  const historyEntry: ReviewHistoryEntry = {
    timestamp: lastReviewed,
    rating,
    easeFactor: prevEaseFactor,
    interval: prevInterval
  }

  const history = [...(card.history || []), historyEntry]

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
    lastReviewed,
    masteryLevel,
    history
  }
}

/**
 * Returns the count of due cards for a deck.
 */
export function getDeckDueCount(deck: Deck, settings: SettingsState): number {
  if (!settings.spacedRepetition) {
    return 0
  }
  const now = new Date()
  
  // Scheduled due: nextReviewDate exists and is in the past (or present)
  const scheduledDue = deck.cards.filter(
    (c) => c.nextReviewDate && new Date(c.nextReviewDate) <= now
  ).length

  // New cards: no nextReviewDate (never reviewed)
  const newCards = deck.cards.filter((c) => !c.nextReviewDate).length

  // Capped up to 10 new cards at a time
  return scheduledDue + Math.min(newCards, 10)
}

/**
 * Compiles a list of cards that are due for review, either from a specific deck or all enabled decks.
 */
export function getReviewQueue(
  decks: Deck[],
  settings: SettingsState,
  filterDeckId: string | null
): Flashcard[] {
  const activeDecks = filterDeckId
    ? decks.filter((d) => d.id === filterDeckId)
    : decks.filter((d) => d.enabled)

  const allCards = activeDecks.flatMap((d) => d.cards)
  const now = new Date()

  // 1. Scheduled due cards
  const scheduledDue = allCards.filter(
    (c) => c.nextReviewDate && new Date(c.nextReviewDate) <= now
  )

  // 2. New cards (never reviewed)
  const newCards = allCards.filter((c) => !c.nextReviewDate)

  // Limit new cards to 10 at a time
  const selectedNewCards = newCards.slice(0, 10)

  let queue = [...scheduledDue, ...selectedNewCards]

  // Shuffle if cardShuffle is enabled
  if (settings.cardShuffle) {
    queue = queue.sort(() => Math.random() - 0.5)
  }

  return queue
}

/**
 * Synchronizes FCM reminders based on calculated review dates.
 */
export async function syncFcmReminders(
  decks: Deck[],
  settings: SettingsState,
  fcmToken: string | null,
  projectId: string | null,
  useLocalEmulator: boolean,
  setScheduledReminders: React.Dispatch<React.SetStateAction<LocalReminder[]>>
) {
  if (!fcmToken || !projectId || !settings.spacedRepetition) {
    return
  }

  const interval = settings.reminderInterval || 5
  const now = Date.now()

  // 1. Gather all active cards
  const enabledDecks = decks.filter(d => d.enabled)
  const allCards = enabledDecks.flatMap(d => d.cards)

  // 2. Separate currently due and future due cards
  const currentlyDue = allCards.filter(c => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= now)
  const futureDue = allCards
    .filter(c => c.nextReviewDate && new Date(c.nextReviewDate).getTime() > now)
    .sort((a, b) => new Date(a.nextReviewDate!).getTime() - new Date(b.nextReviewDate!).getTime())

  const M = currentlyDue.length

  // 3. Find the future timestamps where due count hits multiples of interval
  const calculatedTimestamps: number[] = []
  
  // Cap at a maximum of 5 future reminders to avoid overwhelming the FCM scheduler
  const maxReminders = 5
  let k = Math.floor(M / interval) + 1
  
  while (calculatedTimestamps.length < maxReminders) {
    const targetDueCount = k * interval
    const neededFutureCards = targetDueCount - M
    const targetIndex = neededFutureCards - 1
    
    if (targetIndex < futureDue.length) {
      const dueDateStr = futureDue[targetIndex].nextReviewDate!
      const timestamp = new Date(dueDateStr).getTime()
      if (timestamp > now) {
        calculatedTimestamps.push(timestamp)
      }
    } else {
      break
    }
    k++
  }

  // 4. Fetch currently scheduled reminders from localStorage
  let savedReminders: LocalReminder[] = []
  try {
    const saved = localStorage.getItem("fcm_scheduled_reminders")
    if (saved) {
      savedReminders = JSON.parse(saved) as LocalReminder[]
    }
  } catch (e) {
    console.error("Failed to parse saved reminders", e)
  }

  // Filter out saved reminders that have already passed
  savedReminders = savedReminders.filter(r => r.sendAt > now)

  // 5. Reconcile
  const remindersToKeep: LocalReminder[] = []
  const remindersToCancel: LocalReminder[] = []
  const timestampsToSchedule: number[] = []

  for (const saved of savedReminders) {
    const matchedIndex = calculatedTimestamps.findIndex(ts => Math.abs(ts - saved.sendAt) < 2000)
    if (matchedIndex !== -1) {
      remindersToKeep.push(saved)
      calculatedTimestamps.splice(matchedIndex, 1)
    } else {
      remindersToCancel.push(saved)
    }
  }

  timestampsToSchedule.push(...calculatedTimestamps)

  // 6. Cancel no longer needed reminders
  for (const r of remindersToCancel) {
    try {
      await fcmCloudService.cancelReminder(projectId, r.taskId, r.useLocalEmulator)
    } catch (err) {
      console.error(`Failed to cancel FCM reminder task ${r.taskId}:`, err)
    }
  }

  // 7. Schedule new reminders
  const newScheduledReminders: LocalReminder[] = [...remindersToKeep]
  for (const ts of timestampsToSchedule) {
    try {
      const countAtTimestamp = M + futureDue.filter(c => new Date(c.nextReviewDate!).getTime() <= ts).length
      const response = await fcmCloudService.scheduleReminder(projectId, {
        fcmToken,
        sendAtTimestamp: ts,
        title: "Study Flashcards! 📚",
        body: `You have ${countAtTimestamp} cards due for review. Keep up your learning streak!`
      }, useLocalEmulator)

      if (response && response.success && response.taskId) {
        newScheduledReminders.push({
          id: Math.random().toString(36).substring(2, 9),
          taskId: response.taskId,
          title: "Study Flashcards! 📚",
          body: `You have ${countAtTimestamp} cards due for review. Keep up your learning streak!`,
          sendAt: ts,
          useLocalEmulator
        })
      }
    } catch (err) {
      console.error(`Failed to schedule FCM reminder at timestamp ${ts}:`, err)
    }
  }

  // 8. Update localStorage and state
  localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(newScheduledReminders))
  setScheduledReminders(newScheduledReminders)
}

