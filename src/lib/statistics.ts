import type { ReviewHistoryRecord, MasteryLevel, Flashcard } from "../components/Flashcard/Flashcard"
import type { Deck } from "../components/Deck/Deck"

export interface GraphDataPoint {
  label: string
  count: number
}

export interface MasteryDataPoint {
  label: string
  weakness: number
  slipUp: number
  learning: number
  proficient: number
  mastered: number
}

export interface SpeedGrowthDataPoint {
  label: string
  growth: number // Growth in % relative to previous review speed (e.g. +15.5%)
  avgDuration: number // Average duration in seconds
  avgSpeed: number // Average speed in cards/minute
  count: number // Number of reviews
}

export interface DashboardStats {
  streak: number
  maxStreak: number
  reviewsDoneTotal: number
  reviewsDoneLast7Days: number
  masteryRateMastered: number
  masteryRateTotal: number
  timeStudiedMins: number
  timeStudiedAvgMins: number
  avgSpeedGrowth: number
  avgReviewDuration: number
  graphs: {
    reviews: {
      days: GraphDataPoint[]
      weeks: GraphDataPoint[]
      months: GraphDataPoint[]
    }
    mastery: {
      days: MasteryDataPoint[]
      weeks: MasteryDataPoint[]
      months: MasteryDataPoint[]
    }
    speedGrowth: {
      days: SpeedGrowthDataPoint[]
      weeks: SpeedGrowthDataPoint[]
      months: SpeedGrowthDataPoint[]
    }
  }
}

let cachedResult: DashboardStats | null = null
let cachedRecordsHash = ""
let cachedDecksHash = ""

const getLocalDateString = (d: Date) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const getEpochDay = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24))
}

export function getDashboardStats(
  records: ReviewHistoryRecord[],
  decks: Deck[]
): DashboardStats {
  const recordsHash = `${records.length}_${records.length > 0 ? records[records.length - 1].timestamp : ""}`
  const decksHash = JSON.stringify(decks.map(d => ({ id: d.id, cardsCount: d.cards.length })))

  if (cachedResult && cachedRecordsHash === recordsHash && cachedDecksHash === decksHash) {
    return cachedResult
  }

  // 1. Gather all unique cards in the system
  const allCards: Flashcard[] = []
  for (const deck of decks) {
    allCards.push(...deck.cards)
  }

  // 2. Parse timestamps and compute durations once for optimization (sorted chronologically)
  const recordsWithDates = records.map(r => ({
    ...r,
    date: new Date(r.timestamp),
    duration: r.reviewDuration && r.reviewDuration > 0 ? Math.max(0.5, r.reviewDuration) : 5
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate speed growth relative to the previous review for each card
  const cardLastReviewDuration: Record<string, number> = {}

  interface EnrichedReview {
    date: Date
    duration: number
    growth: number
    hasPrevious: boolean
  }

  const enrichedReviews: EnrichedReview[] = []
  let totalGrowthSum = 0
  let totalGrowthCount = 0

  for (const r of recordsWithDates) {
    const prevDuration = cardLastReviewDuration[r.cardId]
    let growth = 0
    let hasPrevious = false

    if (prevDuration !== undefined && prevDuration > 0) {
      hasPrevious = true
      // Speed growth = ((Speed_k - Speed_{k-1}) / Speed_{k-1}) * 100
      // Since Speed = 1 / duration, this equals ((prevDuration - currDuration) / currDuration) * 100
      const rawGrowth = ((prevDuration - r.duration) / r.duration) * 100
      growth = Math.max(-95, Math.min(500, rawGrowth))
      totalGrowthSum += growth
      totalGrowthCount++
    }

    cardLastReviewDuration[r.cardId] = r.duration

    enrichedReviews.push({
      date: r.date,
      duration: r.duration,
      growth,
      hasPrevious
    })
  }

  // Group reviews by cardId for fast historical status lookup
  const reviewsByCard: Record<string, typeof recordsWithDates> = {}
  for (const r of recordsWithDates) {
    if (!reviewsByCard[r.cardId]) {
      reviewsByCard[r.cardId] = []
    }
    reviewsByCard[r.cardId].push(r)
  }

  const getMasteryStateAt = (targetDate: Date) => {
    const counts = { weakness: 0, slipUp: 0, learning: 0, proficient: 0, mastered: 0 }
    const targetTime = targetDate.getTime()
    for (const card of allCards) {
      const cardReviews = reviewsByCard[card.id]
      let latestLevel: MasteryLevel = "learning"
      if (cardReviews) {
        let latestTime = -1
        for (const r of cardReviews) {
          const time = r.date.getTime()
          if (time <= targetTime && time > latestTime) {
            latestTime = time
            latestLevel = r.masteryLevel
          }
        }
      }
      counts[latestLevel]++
    }
    return counts
  }

  const calculateSpeedGrowthForBucket = (start: Date, end: Date, label: string): SpeedGrowthDataPoint => {
    const bucketReviews = enrichedReviews.filter(r => r.date >= start && r.date <= end)
    if (bucketReviews.length === 0) {
      return {
        label,
        growth: 0,
        avgDuration: 0,
        avgSpeed: 0,
        count: 0
      }
    }

    const reviewsWithGrowth = bucketReviews.filter(r => r.hasPrevious)
    const avgGrowth = reviewsWithGrowth.length > 0
      ? reviewsWithGrowth.reduce((acc, r) => acc + r.growth, 0) / reviewsWithGrowth.length
      : 0

    const totalDur = bucketReviews.reduce((acc, r) => acc + r.duration, 0)
    const avgDuration = totalDur / bucketReviews.length
    const avgSpeed = avgDuration > 0 ? (60 / avgDuration) : 0

    return {
      label,
      growth: Math.round(avgGrowth * 10) / 10,
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      count: bucketReviews.length
    }
  }

  // 3. Generate Day Ranges (Last 30 Days)
  const daysList: { label: string; start: Date; end: Date }[] = []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    // Label format: "Mon 28" or "8/28"
    const label = i < 7 ? dayNames[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`
    daysList.push({
      label,
      start,
      end
    })
  }

  // 4. Generate Week Ranges (Last 16 Weeks)
  const weeksList: { label: string; start: Date; end: Date }[] = []
  for (let i = 15; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - (i * 7 + 6))
    start.setHours(0, 0, 0, 0)

    const end = new Date()
    end.setDate(end.getDate() - (i * 7))
    end.setHours(23, 59, 59, 999)

    const label = i === 0 ? "Current" : i < 4 ? `Wk ${4 - i}` : `${start.getMonth() + 1}/${start.getDate()}`
    weeksList.push({
      label,
      start,
      end
    })
  }

  // 5. Generate Month Ranges (Last 18 Months)
  const monthsList: { label: string; start: Date; end: Date }[] = []
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentYear = new Date().getFullYear()
  for (let i = 17; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)

    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const yearSuffix = start.getFullYear() !== currentYear ? ` '${String(start.getFullYear()).slice(2)}` : ""
    monthsList.push({
      label: `${monthNames[start.getMonth()]}${yearSuffix}`,
      start,
      end
    })
  }

  // Calculate Reviews Done, Mastery Progression, and Speed Growth for Days
  const reviewsDays: GraphDataPoint[] = []
  const masteryDays: MasteryDataPoint[] = []
  const speedGrowthDays: SpeedGrowthDataPoint[] = []
  for (const day of daysList) {
    const count = recordsWithDates.filter(r => r.date >= day.start && r.date <= day.end).length
    reviewsDays.push({ label: day.label, count })

    const masteryCounts = getMasteryStateAt(day.end)
    masteryDays.push({ label: day.label, ...masteryCounts })

    speedGrowthDays.push(calculateSpeedGrowthForBucket(day.start, day.end, day.label))
  }

  // Calculate Reviews Done, Mastery Progression, and Speed Growth for Weeks
  const reviewsWeeks: GraphDataPoint[] = []
  const masteryWeeks: MasteryDataPoint[] = []
  const speedGrowthWeeks: SpeedGrowthDataPoint[] = []
  for (const wk of weeksList) {
    const count = recordsWithDates.filter(r => r.date >= wk.start && r.date <= wk.end).length
    reviewsWeeks.push({ label: wk.label, count })

    const masteryCounts = getMasteryStateAt(wk.end)
    masteryWeeks.push({ label: wk.label, ...masteryCounts })

    speedGrowthWeeks.push(calculateSpeedGrowthForBucket(wk.start, wk.end, wk.label))
  }

  // Calculate Reviews Done, Mastery Progression, and Speed Growth for Months
  const reviewsMonths: GraphDataPoint[] = []
  const masteryMonths: MasteryDataPoint[] = []
  const speedGrowthMonths: SpeedGrowthDataPoint[] = []
  for (const mo of monthsList) {
    const count = recordsWithDates.filter(r => r.date >= mo.start && r.date <= mo.end).length
    reviewsMonths.push({ label: mo.label, count })

    const masteryCounts = getMasteryStateAt(mo.end)
    masteryMonths.push({ label: mo.label, ...masteryCounts })

    speedGrowthMonths.push(calculateSpeedGrowthForBucket(mo.start, mo.end, mo.label))
  }

  // 6. Calculate Summary Stats
  // Streak
  const reviewDays = new Set<string>()
  for (const r of recordsWithDates) {
    reviewDays.add(getLocalDateString(r.date))
  }

  let streak = 0
  let currentCheck = new Date()
  const todayStr = getLocalDateString(currentCheck)
  if (reviewDays.has(todayStr)) {
    streak = 1
  } else {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)
    if (reviewDays.has(yesterdayStr)) {
      streak = 1
      currentCheck = yesterday
    }
  }

  if (streak > 0) {
    while (true) {
      currentCheck.setDate(currentCheck.getDate() - 1)
      const checkStr = getLocalDateString(currentCheck)
      if (reviewDays.has(checkStr)) {
        streak++
      } else {
        break
      }
    }
  }

  // Max Streak
  let maxStreak = 0
  if (reviewDays.size > 0) {
    const sortedDays = Array.from(reviewDays).sort()
    let currentRun = 1
    maxStreak = 1
    let prevEpoch = getEpochDay(sortedDays[0])
    for (let i = 1; i < sortedDays.length; i++) {
      const currEpoch = getEpochDay(sortedDays[i])
      if (currEpoch === prevEpoch + 1) {
        currentRun++
        if (currentRun > maxStreak) {
          maxStreak = currentRun
        }
      } else if (currEpoch > prevEpoch + 1) {
        currentRun = 1
      }
      prevEpoch = currEpoch
    }
  }

  // Reviews Done Total
  const reviewsDoneTotal = records.length

  // Reviews Done Last 7 Days
  const last7DaysStart = daysList[0].start
  const last7DaysEnd = daysList[6].end
  const reviewsDoneLast7Days = recordsWithDates.filter(r => r.date >= last7DaysStart && r.date <= last7DaysEnd).length

  // Mastery Rate
  const currentMastery = getMasteryStateAt(new Date())
  const masteryRateMastered = currentMastery.mastered
  const masteryRateTotal = allCards.length

  // Time Studied
  const totalDurationSeconds = records.reduce((acc, r) => acc + (r.reviewDuration || 0), 0)
  const timeStudiedMins = Math.round(totalDurationSeconds / 60)
  const timeStudiedAvgMins = reviewDays.size > 0 ? Math.round(timeStudiedMins / reviewDays.size) : 0

  // Speed Growth Summaries
  const avgSpeedGrowth = totalGrowthCount > 0 ? Math.round((totalGrowthSum / totalGrowthCount) * 10) / 10 : 0
  const avgReviewDuration = records.length > 0 ? Math.round((totalDurationSeconds / records.length) * 10) / 10 : 0

  const result: DashboardStats = {
    streak,
    maxStreak,
    reviewsDoneTotal,
    reviewsDoneLast7Days,
    masteryRateMastered,
    masteryRateTotal,
    timeStudiedMins,
    timeStudiedAvgMins,
    avgSpeedGrowth,
    avgReviewDuration,
    graphs: {
      reviews: {
        days: reviewsDays,
        weeks: reviewsWeeks,
        months: reviewsMonths
      },
      mastery: {
        days: masteryDays,
        weeks: masteryWeeks,
        months: masteryMonths
      },
      speedGrowth: {
        days: speedGrowthDays,
        weeks: speedGrowthWeeks,
        months: speedGrowthMonths
      }
    }
  }

  cachedResult = result
  cachedRecordsHash = recordsHash
  cachedDecksHash = decksHash

  return result
}
