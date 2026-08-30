// src/lib/browserNotification.ts

/**
 * Interface representing a scheduled experimental / browser reminder.
 */
export interface BrowserReminderOptions {
  id: string
  title: string
  body: string
  sendAt: number
}

// In-memory active client timers for when the tab/window is alive
const activeTimers = new Map<string, number>()

/**
 * Checks if the standard Notification API is supported in the current environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

/**
 * Checks if the experimental Notification Triggers API (TimestampTrigger) is supported.
 * W3C Specification / Chromium Experimental Web Platform features.
 */
export function isNotificationTriggerSupported(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }

  const hasShowTrigger = "showTrigger" in Notification.prototype
  const hasTimestampTrigger =
    "TimestampTrigger" in window ||
    "TimestampTrigger" in (globalThis as unknown as Record<string, unknown>)

  return hasShowTrigger && hasTimestampTrigger
}

/**
 * Returns the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) {
    return "unsupported"
  }
  return Notification.permission
}

/**
 * Requests browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) {
    return "unsupported"
  }
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (err) {
    console.error("Error requesting notification permission:", err)
    return Notification.permission
  }
}

/**
 * Triggers an immediate browser notification using either the active Service Worker
 * registration or direct Notification constructor.
 */
export async function sendInstantBrowserNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false
  }

  const defaultOptions: NotificationOptions = {
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "instant-notification",
    ...options,
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, defaultOptions)
        return true
      }
    }
  } catch (err) {
    console.warn("ServiceWorker showNotification failed, falling back to Notification constructor:", err)
  }

  try {
    new Notification(title, defaultOptions)
    return true
  } catch (err) {
    console.error("Notification constructor failed:", err)
    return false
  }
}

interface ExperimentalNotificationOptions extends NotificationOptions {
  showTrigger?: unknown
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  getNotifications(filter?: { tag?: string; includeTriggered?: boolean }): Promise<Notification[]>
}

/**
 * Schedules a notification using the experimental Notification Triggers API if available,
 * and always creates an active client timer as a resilient runtime fallback.
 */
export async function scheduleExperimentalNotification(
  reminder: BrowserReminderOptions
): Promise<boolean> {
  const { id, title, body, sendAt } = reminder
  const now = Date.now()
  const delay = sendAt - now

  if (delay <= 0) {
    return false
  }

  // Clear any existing client timer for this ID
  if (activeTimers.has(id)) {
    window.clearTimeout(activeTimers.get(id))
    activeTimers.delete(id)
  }

  // 1. Attempt to schedule using the experimental Notification Triggers API
  let scheduledViaTriggers = false
  if (isNotificationTriggerSupported() && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && "showNotification" in reg) {
        const TimestampTriggerClass =
          (window as unknown as { TimestampTrigger: new (timestamp: number) => unknown }).TimestampTrigger ||
          (globalThis as unknown as { TimestampTrigger: new (timestamp: number) => unknown }).TimestampTrigger

        if (TimestampTriggerClass) {
          const trigger = new TimestampTriggerClass(sendAt)
          const options: ExperimentalNotificationOptions = {
            body,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: `local-reminder-${id}`,
            data: { id, sendAt, url: "/" },
            showTrigger: trigger,
          }
          await reg.showNotification(title, options)
          scheduledViaTriggers = true
          console.log(`[Experimental API] Scheduled notification for ${new Date(sendAt).toLocaleTimeString()} with TimestampTrigger.`)
        }
      }
    } catch (err) {
      console.warn("Notification Triggers scheduling failed, using client timer fallback:", err)
    }
  }

  // 2. Set client-side timeout fallback (active while app tab is alive)
  const timer = window.setTimeout(async () => {
    activeTimers.delete(id)
    await sendInstantBrowserNotification(title, {
      body,
      tag: `local-reminder-${id}`,
      data: { id, sendAt, url: "/" },
    })
  }, delay)

  activeTimers.set(id, timer)
  return scheduledViaTriggers
}

/**
 * Cancels a scheduled experimental / browser reminder and removes any triggered notification.
 */
export async function cancelExperimentalNotification(id: string): Promise<void> {
  // 1. Clear active client timer
  if (activeTimers.has(id)) {
    window.clearTimeout(activeTimers.get(id))
    activeTimers.delete(id)
  }

  // 2. Close scheduled notifications in Service Worker registration if supported
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg && "getNotifications" in reg) {
        // Query notifications including triggered ones
        const extendedReg = reg as ExtendedServiceWorkerRegistration
        const notifications = await extendedReg.getNotifications({
          tag: `local-reminder-${id}`,
          includeTriggered: true,
        })
        for (const notif of notifications) {
          notif.close()
        }
      }
    } catch (err) {
      console.warn("Failed to close Service Worker notifications for reminder", id, err)
    }
  }
}

/**
 * Re-initializes all client timers for stored active reminders on app startup.
 */
export function initBrowserNotificationTimers(
  reminders: BrowserReminderOptions[],
  onTrigger?: (reminder: BrowserReminderOptions) => void
): void {
  const now = Date.now()

  // Clear obsolete timers
  for (const [id, timerId] of activeTimers.entries()) {
    if (!reminders.some((r) => r.id === id && r.sendAt > now)) {
      window.clearTimeout(timerId)
      activeTimers.delete(id)
    }
  }

  // Schedule timers for active future reminders
  for (const reminder of reminders) {
    const delay = reminder.sendAt - now
    if (delay > 0 && !activeTimers.has(reminder.id)) {
      const timer = window.setTimeout(async () => {
        activeTimers.delete(reminder.id)
        await sendInstantBrowserNotification(reminder.title, {
          body: reminder.body,
          tag: `local-reminder-${reminder.id}`,
          data: { id: reminder.id, sendAt: reminder.sendAt, url: "/" }
        })
        if (onTrigger) {
          onTrigger(reminder)
        }
      }, delay)
      activeTimers.set(reminder.id, timer)
    }
  }
}

/**
 * Helper to schedule a quick test notification after a specified duration in seconds.
 */
export async function scheduleExperimentalTestNotification(
  delaySeconds: number = 10
): Promise<{ id: string; sendAt: number; isNativeTrigger: boolean }> {
  const id = `test-${Math.random().toString(36).substring(2, 9)}`
  const sendAt = Date.now() + delaySeconds * 1000
  const isNativeTrigger = await scheduleExperimentalNotification({
    id,
    title: "Experimental Browser Notification ⏰",
    body: `Success! Scheduled notification fired after ${delaySeconds} seconds using the ${isNotificationTriggerSupported() ? "Experimental Notification Triggers API" : "Browser Timer Fallback"
      }.`,
    sendAt
  })

  return { id, sendAt, isNativeTrigger }
}
