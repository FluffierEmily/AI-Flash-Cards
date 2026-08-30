import { useState, useEffect, useCallback } from "react"
import { initializeApp, getApp, getApps } from "firebase/app"
import { getMessaging, getToken, deleteToken } from "firebase/messaging"
import { fcmCloudService } from "../lib/fcm"
import type { LocalReminder } from "../lib/spacedRepetition"
import {
  scheduleExperimentalTestNotification,
  cancelExperimentalNotification,
} from "../lib/browserNotification"

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export function parseFirebaseConfig(text: string): Partial<FirebaseConfig> {
  const extract = (key: string) => {
    const match = text.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`))
    return match ? match[1] : ""
  }

  const apiKey = extract("apiKey")
  const authDomain = extract("authDomain")
  const projectId = extract("projectId")
  const storageBucket = extract("storageBucket")
  const messagingSenderId = extract("messagingSenderId")
  const appId = extract("appId")

  if (apiKey && projectId && messagingSenderId && appId) {
    return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
  }

  // Fallback to plain JSON parsing
  try {
    const cleanText = text.trim()
    const parsed = JSON.parse(cleanText)
    if (parsed && typeof parsed === "object") {
      return {
        apiKey: parsed.apiKey || "",
        authDomain: parsed.authDomain || "",
        projectId: parsed.projectId || "",
        storageBucket: parsed.storageBucket || "",
        messagingSenderId: parsed.messagingSenderId || "",
        appId: parsed.appId || "",
      }
    }
  } catch {
    // Ignore error
  }

  return {}
}

export function useFcm() {
  const [isFcmEnabled, setIsFcmEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fcm_enabled") === "true"
    }
    return false
  })

  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fcm_token")
    }
    return null
  })

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fcm_config")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse fcm_config", e)
        }
      }
    }
    return null
  })

  const [vapidKey, setVapidKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fcm_vapid_key") || ""
    }
    return ""
  })

  const [status, setStatus] = useState<"unconfigured" | "connecting" | "connected" | "error">(() => {
    if (typeof window !== "undefined") {
      const isEnabled = localStorage.getItem("fcm_enabled") === "true"
      const hasConfig = !!localStorage.getItem("fcm_config")
      const hasToken = !!localStorage.getItem("fcm_token")
      if (!hasConfig) return "unconfigured"
      if (isEnabled && hasToken) return "connected"
      return "unconfigured"
    }
    return "unconfigured"
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const getFirebaseMessaging = useCallback((config: FirebaseConfig) => {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp()
      return getMessaging(app)
    } catch (err) {
      console.error("Firebase Initialization Error:", err)
      return null
    }
  }, [])

  const handleEnableFcm = useCallback(
    async (config: FirebaseConfig, vKey: string) => {
      setStatus("connecting")
      setErrorMsg(null)
      try {
        if (typeof Notification === "undefined") {
          throw new Error("Notifications are not supported in this browser.")
        }

        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          throw new Error("Notification permission denied by user.")
        }

        if (!("serviceWorker" in navigator)) {
          throw new Error("Service Worker is not supported by this browser.")
        }

        // Check if any service worker is registered to prevent hanging
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length === 0) {
          throw new Error(
            "No active Service Worker registration found. If you are developing locally, please reload the page to register the PWA service worker."
          )
        }

        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("PWA Service Worker took too long to respond. Try refreshing the page.")),
              4000
            )
          ),
        ])

        if (!reg) {
          throw new Error("No active Service Worker registration found.")
        }

        const messaging = getFirebaseMessaging(config)
        if (!messaging) {
          throw new Error("Failed to initialize Firebase SDK. Please verify config credentials.")
        }

        const token = await getToken(messaging, {
          serviceWorkerRegistration: reg,
          vapidKey: vKey.trim(),
        })

        if (!token) {
          throw new Error("Failed to retrieve FCM token from Google's servers.")
        }

        // Save successful credentials and state
        setFirebaseConfig(config)
        setVapidKey(vKey)
        setFcmToken(token)
        setIsFcmEnabled(true)
        setStatus("connected")

        localStorage.setItem("fcm_config", JSON.stringify(config))
        localStorage.setItem("fcm_vapid_key", vKey)
        localStorage.setItem("fcm_token", token)
        localStorage.setItem("fcm_enabled", "true")
      } catch (err: unknown) {
        console.error("FCM Enable Error:", err)
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
        setStatus("error")
        setIsFcmEnabled(false)
        localStorage.setItem("fcm_enabled", "false")
        throw err
      }
    },
    [getFirebaseMessaging]
  )

  const handleDisableFcm = useCallback(async () => {
    setStatus("connecting")
    try {
      if (firebaseConfig) {
        const messaging = getFirebaseMessaging(firebaseConfig)
        if (messaging) {
          await deleteToken(messaging)
        }
      }
    } catch (err) {
      console.error("Error deleting FCM token:", err)
    } finally {
      setIsFcmEnabled(false)
      setFcmToken(null)
      localStorage.removeItem("fcm_token")
      localStorage.setItem("fcm_enabled", "false")
      setStatus("unconfigured")
    }
  }, [firebaseConfig, getFirebaseMessaging])

  // Attempt to refresh/verify connection if config already exists
  useEffect(() => {
    let isMounted = true
    if (isFcmEnabled && firebaseConfig && vapidKey && !fcmToken) {
      const timer = window.setTimeout(() => {
        if (isMounted) {
          handleEnableFcm(firebaseConfig, vapidKey).catch(() => {})
        }
      }, 0)
      return () => {
        isMounted = false
        window.clearTimeout(timer)
      }
    }
  }, [isFcmEnabled, firebaseConfig, vapidKey, fcmToken, handleEnableFcm])

  const [useLocalEmulator, setUseLocalEmulator] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fcm_use_emulator") !== "false"
    }
    return true
  })

  const [scheduledReminders, setScheduledReminders] = useState<LocalReminder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fcm_scheduled_reminders")
        if (saved) {
          const parsed = JSON.parse(saved) as LocalReminder[]
          const now = Date.now()
          const active = parsed.filter((r) => r.sendAt > now)
          if (active.length !== parsed.length) {
            localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(active))
          }
          return active
        }
      } catch (err) {
        console.error("Failed to load initial reminders:", err)
      }
    }
    return []
  })

  // Prune expired reminders periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem("fcm_scheduled_reminders")
        if (saved) {
          const parsed = JSON.parse(saved) as LocalReminder[]
          const now = Date.now()
          const active = parsed.filter((r) => r.sendAt > now)
          if (active.length !== parsed.length) {
            localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(active))
            setScheduledReminders(active)
          }
        }
      } catch (err) {
        console.error("Failed to prune reminders:", err)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Persist emulator setting
  useEffect(() => {
    localStorage.setItem("fcm_use_emulator", String(useLocalEmulator))
  }, [useLocalEmulator])

  const cancelScheduledReminder = useCallback(
    async (reminder: LocalReminder) => {
      try {
        if (reminder.type === "experimental") {
          await cancelExperimentalNotification(reminder.id)
        } else {
          const projectId = firebaseConfig?.projectId
          if (projectId) {
            await fcmCloudService.cancelReminder(projectId, reminder.taskId, reminder.useLocalEmulator)
          }
        }

        const saved = localStorage.getItem("fcm_scheduled_reminders")
        const currentReminders = saved ? (JSON.parse(saved) as LocalReminder[]) : []
        const updated = currentReminders.filter((r) =>
          r.id ? r.id !== reminder.id : r.taskId !== reminder.taskId
        )
        localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(updated))
        setScheduledReminders(updated)
      } catch (err) {
        console.error("Failed to cancel scheduled reminder:", err)
        throw err
      }
    },
    [firebaseConfig]
  )

  const triggerCloudScheduledNotification = useCallback(async () => {
    const projectId = firebaseConfig?.projectId
    if (!fcmToken || !projectId) {
      throw new Error("FCM not fully configured.")
    }
    const sendAtTimestamp = new Date(Date.now() + 10 * 1000).toISOString()
    const response = await fcmCloudService.scheduleReminder(
      projectId,
      {
        fcmToken,
        sendAtTimestamp,
        title: "Scheduled Cloud Test ⏰",
        body: "Hello! This scheduled push notification has arrived after 10 seconds.",
      },
      useLocalEmulator
    )

    if (response && response.success && response.taskId) {
      const newReminder: LocalReminder = {
        id: Math.random().toString(36).substring(2, 9),
        taskId: response.taskId,
        title: "Scheduled Cloud Test ⏰",
        body: "Hello! This scheduled push notification has arrived after 10 seconds.",
        sendAt: new Date(sendAtTimestamp).getTime(),
        useLocalEmulator: useLocalEmulator,
        type: "fcm",
      }

      const saved = localStorage.getItem("fcm_scheduled_reminders")
      const currentReminders = saved ? (JSON.parse(saved) as LocalReminder[]) : []
      const updated = [...currentReminders, newReminder]
      localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(updated))
      setScheduledReminders(updated)
    }
  }, [fcmToken, firebaseConfig, useLocalEmulator])

  const triggerExperimentalScheduledNotification = useCallback(async () => {
    const { id, sendAt } = await scheduleExperimentalTestNotification(10)
    const newReminder: LocalReminder = {
      id,
      taskId: `local-${id}`,
      title: "Experimental Browser Notification ⏰",
      body: "Hello! This scheduled local notification has arrived after 10 seconds.",
      sendAt,
      useLocalEmulator: false,
      type: "experimental",
    }

    const saved = localStorage.getItem("fcm_scheduled_reminders")
    const currentReminders = saved ? (JSON.parse(saved) as LocalReminder[]) : []
    const updated = [...currentReminders, newReminder]
    localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(updated))
    setScheduledReminders(updated)
  }, [])

  return {
    isFcmEnabled,
    fcmToken,
    firebaseConfig,
    vapidKey,
    status,
    errorMsg,
    handleEnableFcm,
    handleDisableFcm,
    scheduledReminders,
    setScheduledReminders,
    cancelScheduledReminder,
    triggerCloudScheduledNotification,
    triggerExperimentalScheduledNotification,
    useLocalEmulator,
    setUseLocalEmulator,
  }
}
