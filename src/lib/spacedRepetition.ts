import type { Flashcard, MasteryLevel, ReviewHistoryRecord } from "../components/Flashcard/Flashcard"
import type { Deck } from "../components/Deck/Deck"
import type { SettingsState } from "../pages/Settings"
import { fcmCloudService } from "./fcm"
import {
  scheduleExperimentalNotification,
  cancelExperimentalNotification,
  getNotificationPermission
} from "./browserNotification"

export interface LocalReminder {
  id: string
  taskId: string
  title: string
  body: string
  sendAt: number
  useLocalEmulator?: boolean
  type?: "fcm" | "experimental"
}

/**
 * Calculates the next review date, interval, repetition, ease factor, and mastery level
 * for a card based on the user's rating.
 */
export function calculateNextReview(
  card: Flashcard,
  rating: "again" | "hard" | "good" | "easy",
  reviewDurationSec?: number
): {
  interval: number
  repetition: number
  easeFactor: number
  nextReviewDate: string
  lastReviewed: string
  masteryLevel: MasteryLevel
  newHistoryEntry: ReviewHistoryRecord
  lastReviewDuration?: number
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

  let deviation = 0
  let timeMultiplier = 1.0
  let qualityAdjustment = 0

  if (reviewDurationSec !== undefined) {
    // Estimate baseline if no previous review duration exists (based on word counts)
    const baseDuration = card.lastReviewDuration || Math.max(
      8,
      Math.min(25, (card.question.split(/\s+/).length + card.answer.split(/\s+/).length) * 0.5 + 5)
    )
    deviation = (reviewDurationSec - baseDuration) / baseDuration

    if (deviation < 0) {
      // Faster response than baseline (improvement): boost interval up to 1.2x
      timeMultiplier = Math.min(1.2, 1.0 - deviation * 0.3)
    } else {
      // Slower response than baseline (regression): penalty interval down to 0.4x
      timeMultiplier = Math.max(0.4, 1.0 - deviation * 0.6)
      // Apply quality penalty to ease factor update (max penalty of 1.5)
      qualityAdjustment = -Math.min(1.5, deviation * 1.0)
    }
  }

  if (quality < 3) {
    // Failed card (Again)
    repetition = 0
    interval = 4 // 4 hours
    easeFactor = Math.max(1.3, easeFactor - 0.2)

    // Mastery level update
    if (card.masteryLevel === "proficient" || card.masteryLevel === "mastered") {
      masteryLevel = "slipUp"
    } else {
      masteryLevel = "weakness"
    }
  } else {
    // Successful card
    const adjustedQuality = Math.max(3.0, quality + qualityAdjustment)

    if (repetition === 0) {
      if (rating === "hard") interval = 8 // 8 hours
      else if (rating === "good") interval = 24 // 24 hours
      else interval = 48 // easy: 48 hours
    } else if (repetition === 1) {
      if (rating === "hard") interval = 24 // 24 hours
      else if (rating === "good") interval = 96 // 96 hours
      else interval = 168 // easy: 168 hours
    } else {
      let factor = easeFactor
      if (rating === "hard") factor *= 0.8
      if (rating === "easy") factor *= 1.3
      interval = Math.max(1, Math.round(interval * factor))
    }

    // Apply the response time multiplier to the successful card interval
    interval = Math.max(1, Math.round(interval * timeMultiplier))

    // Update easeFactor based on adjustedQuality
    easeFactor = easeFactor + (0.1 - (5 - adjustedQuality) * (0.08 + (5 - adjustedQuality) * 0.02))
    easeFactor = Math.max(1.3, easeFactor)

    repetition += 1

    // Mastery level update
    const heavyHesitation = reviewDurationSec !== undefined && deviation > 1.0

    if (rating === "hard" || heavyHesitation) {
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
  nextReview.setHours(nextReview.getHours() + interval)
  const nextReviewDate = nextReview.toISOString()

  // Construct history entry
  const historyEntry: ReviewHistoryRecord = {
    cardId: card.id,
    deckId: card.deckId,
    timestamp: lastReviewed,
    rating,
    easeFactor: prevEaseFactor,
    interval: prevInterval,
    masteryLevel,
    reviewDuration: reviewDurationSec
  }

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
    lastReviewed,
    masteryLevel,
    newHistoryEntry: historyEntry,
    lastReviewDuration: reviewDurationSec
  }
}

export function getNewCardsReviewedTodayCount(): number {
  if (typeof window === "undefined") return 0
  
  const now = new Date()
  const boundary = new Date(now)
  boundary.setHours(3, 0, 0, 0)
  if (now < boundary) {
    boundary.setDate(boundary.getDate() - 1)
  }
  const boundaryStr = boundary.toISOString()

  try {
    const saved = localStorage.getItem("new_cards_reviewed_today")
    if (saved) {
      const data = JSON.parse(saved)
      if (data && data.lastReset === boundaryStr) {
        return Array.isArray(data.cardIds) ? data.cardIds.length : 0
      }
    }
  } catch (e) {
    console.error("Failed to parse new_cards_reviewed_today", e)
  }
  return 0
}

export function recordNewCardReviewed(cardId: string) {
  if (typeof window === "undefined") return
  
  const now = new Date()
  const boundary = new Date(now)
  boundary.setHours(3, 0, 0, 0)
  if (now < boundary) {
    boundary.setDate(boundary.getDate() - 1)
  }
  const boundaryStr = boundary.toISOString()

  try {
    let cardIds: string[] = []
    const saved = localStorage.getItem("new_cards_reviewed_today")
    if (saved) {
      const data = JSON.parse(saved)
      if (data && data.lastReset === boundaryStr && Array.isArray(data.cardIds)) {
        cardIds = data.cardIds
      }
    }
    if (!cardIds.includes(cardId)) {
      cardIds.push(cardId)
      localStorage.setItem("new_cards_reviewed_today", JSON.stringify({
        lastReset: boundaryStr,
        cardIds
      }))
    }
  } catch (e) {
    console.error("Failed to save new_cards_reviewed_today", e)
  }
}

/**
 * Returns the configured daily new cards learning limit.
 */
export function getDailyLearningLimit(settings?: SettingsState): number {
  if (!settings) return 10
  return typeof settings.dailyLearningLimit === "number" ? settings.dailyLearningLimit : 10
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

  // Cap based on remaining global new cards allowance
  const reviewedToday = getNewCardsReviewedTodayCount()
  const dailyLimit = getDailyLearningLimit(settings)
  const allowedNewCards = Math.max(0, dailyLimit - reviewedToday)
  return scheduledDue + Math.min(newCards, allowedNewCards)
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

  // Limit new cards based on remaining global allowance
  const reviewedToday = getNewCardsReviewedTodayCount()
  const dailyLimit = getDailyLearningLimit(settings)
  const allowedNewCards = Math.max(0, dailyLimit - reviewedToday)
  const selectedNewCards = newCards.slice(0, allowedNewCards)

  const shuffledNewCards = settings.cardShuffle
    ? [...selectedNewCards].sort(() => Math.random() - 0.5)
    : selectedNewCards

  const shuffledScheduledDue = settings.cardShuffle
    ? [...scheduledDue].sort(() => Math.random() - 0.5)
    : scheduledDue

  return [...shuffledNewCards, ...shuffledScheduledDue]
}

/**
 * Synchronizes review reminders based on calculated review dates.
 * Uses FCM Cloud Messaging when configured, and seamlessly falls back to
 * the Experimental Browser Notification API (TimestampTrigger / client timer)
 * when FCM is not yet configured.
 */
export async function syncFcmReminders(
  decks: Deck[],
  settings: SettingsState,
  fcmToken: string | null,
  projectId: string | null,
  useLocalEmulator: boolean,
  setScheduledReminders: React.Dispatch<React.SetStateAction<LocalReminder[]>>
) {
  if (!settings.spacedRepetition) {
    // Clear all scheduled reminders if spaced repetition is disabled
    let savedReminders: LocalReminder[] = []
    try {
      const saved = localStorage.getItem("fcm_scheduled_reminders")
      if (saved) savedReminders = JSON.parse(saved) as LocalReminder[]
    } catch (e) {
      console.error("Failed to parse saved reminders", e)
    }
    for (const r of savedReminders) {
      if (r.type === "experimental") {
        cancelExperimentalNotification(r.id).catch(() => {})
      } else if (r.type === "fcm" && projectId) {
        fcmCloudService.cancelReminder(projectId, r.taskId, r.useLocalEmulator).catch(() => {})
      }
    }
    localStorage.removeItem("fcm_scheduled_reminders")
    setScheduledReminders([])
    return
  }

  const isFcmActive = Boolean(fcmToken && projectId)
  const notificationPermission = getNotificationPermission()
  const isBrowserFallbackActive = !isFcmActive && notificationPermission === "granted"

  if (!isFcmActive && !isBrowserFallbackActive) {
    return
  }

  const interval = settings.reminderInterval || 5
  const now = Date.now()

  // 1. Gather all active cards
  const enabledDecks = decks.filter((d) => d.enabled)
  const allCards = enabledDecks.flatMap((d) => d.cards)

  // 2. Separate currently due and future due cards
  const currentlyDue = allCards.filter(
    (c) => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= now
  )
  const futureDue = allCards
    .filter((c) => c.nextReviewDate && new Date(c.nextReviewDate).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.nextReviewDate!).getTime() -
        new Date(b.nextReviewDate!).getTime()
    )

  const M = currentlyDue.length

  // 3. Find the future timestamps where due count hits multiples of interval
  const calculatedTimestamps: number[] = []
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

  // Filter out reminders whose time has already passed
  savedReminders = savedReminders.filter((r) => r.sendAt > now)

  // 5. Clean up mode mismatches (e.g. upgraded from experimental to FCM or vice versa)
  const currentMode = isFcmActive ? "fcm" : "experimental"
  const mismatchedReminders = savedReminders.filter((r) => r.type && r.type !== currentMode)
  for (const mismatched of mismatchedReminders) {
    if (mismatched.type === "experimental") {
      await cancelExperimentalNotification(mismatched.id).catch(() => {})
    } else if (mismatched.type === "fcm" && projectId) {
      await fcmCloudService.cancelReminder(projectId, mismatched.taskId, mismatched.useLocalEmulator).catch(() => {})
    }
  }
  savedReminders = savedReminders.filter((r) => !r.type || r.type === currentMode)

  // 6. Reconcile
  const remindersToKeep: LocalReminder[] = []
  const remindersToCancel: LocalReminder[] = []
  const timestampsToSchedule: number[] = []

  for (const saved of savedReminders) {
    const matchedIndex = calculatedTimestamps.findIndex(
      (ts) => Math.abs(ts - saved.sendAt) < 2000
    )
    if (matchedIndex !== -1) {
      remindersToKeep.push(saved)
      calculatedTimestamps.splice(matchedIndex, 1)
    } else {
      remindersToCancel.push(saved)
    }
  }

  timestampsToSchedule.push(...calculatedTimestamps)

  // 7. Cancel no longer needed reminders
  for (const r of remindersToCancel) {
    try {
      if (r.type === "experimental") {
        await cancelExperimentalNotification(r.id)
      } else if (projectId) {
        await fcmCloudService.cancelReminder(projectId, r.taskId, r.useLocalEmulator)
      }
    } catch (err) {
      console.error(`Failed to cancel reminder task ${r.taskId || r.id}:`, err)
    }
  }

  // 8. Schedule new reminders
  const newScheduledReminders: LocalReminder[] = [...remindersToKeep]

  for (const ts of timestampsToSchedule) {
    try {
      const countAtTimestamp =
        M + futureDue.filter((c) => new Date(c.nextReviewDate!).getTime() <= ts).length
      const title = "Study Flashcards! 📚"
      const body = `You have ${countAtTimestamp} cards due for review. Keep up your learning streak!`

      if (isFcmActive && fcmToken && projectId) {
        // Schedule via FCM Cloud Messaging
        const response = await fcmCloudService.scheduleReminder(
          projectId,
          {
            fcmToken,
            sendAtTimestamp: new Date(ts).toISOString(),
            title,
            body,
          },
          useLocalEmulator
        )

        if (response && response.success && response.taskId) {
          newScheduledReminders.push({
            id: Math.random().toString(36).substring(2, 9),
            taskId: response.taskId,
            title,
            body,
            sendAt: ts,
            useLocalEmulator,
            type: "fcm",
          })
        }
      } else if (isBrowserFallbackActive) {
        // Schedule via Experimental Browser Notification API (TimestampTrigger / Timer)
        const id = Math.random().toString(36).substring(2, 9)
        await scheduleExperimentalNotification({
          id,
          title,
          body,
          sendAt: ts,
        })

        newScheduledReminders.push({
          id,
          taskId: `local-${id}`,
          title,
          body,
          sendAt: ts,
          useLocalEmulator: false,
          type: "experimental",
        })
      }
    } catch (err) {
      console.error(`Failed to schedule reminder at timestamp ${ts}:`, err)
    }
  }

  // 9. Update localStorage and state
  localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(newScheduledReminders))
  setScheduledReminders(newScheduledReminders)
}

export const syncStudyReminders = syncFcmReminders


