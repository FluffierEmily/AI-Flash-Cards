import { useState, useEffect } from "react"
import { Bell, Copy, Check, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Trash2, Smartphone } from "lucide-react"
import { initializeApp, getApp, getApps } from "firebase/app"
import { getMessaging, getToken, deleteToken } from "firebase/messaging"
import { fcmCloudService } from "../../lib/fcm"
import type { LocalReminder } from "../../lib/spacedRepetition"

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface FcmDrawerProps {
  isFcmEnabled: boolean
  fcmToken: string | null
  firebaseConfig: FirebaseConfig | null
  handleEnableFcm: (config: FirebaseConfig, vapidKey: string) => Promise<void>
  handleDisableFcm: () => Promise<void>
  scheduledReminders: LocalReminder[]
  setScheduledReminders: React.Dispatch<React.SetStateAction<LocalReminder[]>>
  cancelScheduledReminder: (reminder: LocalReminder) => Promise<void>
  triggerCloudScheduledNotification: () => Promise<void>
  useLocalEmulator: boolean
  setUseLocalEmulator: React.Dispatch<React.SetStateAction<boolean>>
}



function parseFirebaseConfig(text: string): Partial<FirebaseConfig> {
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
  } catch (e) {
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

  const [status, setStatus] = useState<'unconfigured' | 'connecting' | 'connected' | 'error'>(() => {
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

  const getFirebaseMessaging = (config: FirebaseConfig) => {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp()
      return getMessaging(app)
    } catch (err) {
      console.error("Firebase Initialization Error:", err)
      return null
    }
  }

  // Attempt to refresh/verify connection if config already exists
  useEffect(() => {
    if (isFcmEnabled && firebaseConfig && vapidKey && !fcmToken) {
      handleEnableFcm(firebaseConfig, vapidKey).catch(() => {
        // Suppress initial automatic error noise
      })
    }
  }, [])

  const handleEnableFcm = async (config: FirebaseConfig, vKey: string) => {
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

      if (!('serviceWorker' in navigator)) {
        throw new Error("Service Worker is not supported by this browser.")
      }

      // Check if any service worker is registered to prevent hanging
      const registrations = await navigator.serviceWorker.getRegistrations()
      if (registrations.length === 0) {
        throw new Error("No active Service Worker registration found. If you are developing locally, please reload the page to register the PWA service worker.")
      }

      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("PWA Service Worker took too long to respond. Try refreshing the page.")), 4000)
        )
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
        vapidKey: vKey.trim()
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
    } catch (err: any) {
      console.error("FCM Enable Error:", err)
      const msg = err.message || String(err)
      setErrorMsg(msg)
      setStatus("error")
      setIsFcmEnabled(false)
      localStorage.setItem("fcm_enabled", "false")
      throw err
    }
  }

  const handleDisableFcm = async () => {
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
  }

  // Refactored states & effects from FcmDrawer component
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
          const active = parsed.filter(r => r.sendAt > now)
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

  // Prune storage every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem("fcm_scheduled_reminders")
        if (saved) {
          const parsed = JSON.parse(saved) as LocalReminder[]
          const now = Date.now()
          const active = parsed.filter(r => r.sendAt > now)
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

  const cancelScheduledReminder = async (reminder: LocalReminder) => {
    const projectId = firebaseConfig?.projectId
    if (!projectId) return
    try {
      await fcmCloudService.cancelReminder(projectId, reminder.taskId, reminder.useLocalEmulator)
      
      const saved = localStorage.getItem("fcm_scheduled_reminders")
      const currentReminders = saved ? (JSON.parse(saved) as LocalReminder[]) : []
      const updated = currentReminders.filter(r => r.taskId !== reminder.taskId)
      localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(updated))
      setScheduledReminders(updated)
    } catch (err) {
      console.error("Failed to cancel scheduled reminder:", err)
      throw err
    }
  }

  const triggerCloudScheduledNotification = async () => {
    const projectId = firebaseConfig?.projectId
    if (!fcmToken || !projectId) {
      throw new Error("FCM not fully configured.")
    }
    const sendAtTimestamp = new Date(Date.now() + 10 * 1000).toISOString()
    const response = await fcmCloudService.scheduleReminder(projectId, {
      fcmToken,
      sendAtTimestamp,
      title: "Scheduled Cloud Test ⏰",
      body: "Hello! This scheduled push notification has arrived after 10 seconds."
    }, useLocalEmulator)

    if (response && response.success && response.taskId) {
      const newReminder: LocalReminder = {
        id: Math.random().toString(36).substring(2, 9),
        taskId: response.taskId,
        title: "Scheduled Cloud Test ⏰",
        body: "Hello! This scheduled push notification has arrived after 10 seconds.",
        sendAt: new Date(sendAtTimestamp).getTime(),
        useLocalEmulator: useLocalEmulator
      }
      
      const saved = localStorage.getItem("fcm_scheduled_reminders")
      const currentReminders = saved ? (JSON.parse(saved) as LocalReminder[]) : []
      const updated = [...currentReminders, newReminder]
      localStorage.setItem("fcm_scheduled_reminders", JSON.stringify(updated))
      setScheduledReminders(updated)
    }
  }

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
    useLocalEmulator,
    setUseLocalEmulator
  }
}

export function FcmDrawer({
  isFcmEnabled,
  fcmToken,
  handleEnableFcm,
  handleDisableFcm,
  scheduledReminders,
  cancelScheduledReminder,
  triggerCloudScheduledNotification,
  useLocalEmulator,
  setUseLocalEmulator
}: FcmDrawerProps) {
  // Local form state initialized from localstorage if available
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).apiKey || "" : ""
  })
  const [authDomain, setAuthDomain] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).authDomain || "" : ""
  })
  const [projectId, setProjectId] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).projectId || "" : ""
  })
  const [storageBucket, setStorageBucket] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).storageBucket || "" : ""
  })
  const [messagingSenderId, setMessagingSenderId] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).messagingSenderId || "" : ""
  })
  const [appId, setAppId] = useState(() => {
    const saved = localStorage.getItem("fcm_config")
    return saved ? JSON.parse(saved).appId || "" : ""
  })
  const [vKey, setVKey] = useState(() => {
    return localStorage.getItem("fcm_vapid_key") || ""
  })

  const [rawConfigPaste, setRawConfigPaste] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [isManualExpanded, setIsManualExpanded] = useState(false)
  const [isGuideExpanded, setIsGuideExpanded] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Handle parsing when pasting the SDK configuration snippet
  useEffect(() => {
    if (rawConfigPaste.trim()) {
      const parsed = parseFirebaseConfig(rawConfigPaste)
      if (parsed.apiKey) setApiKey(parsed.apiKey)
      if (parsed.authDomain) setAuthDomain(parsed.authDomain)
      if (parsed.projectId) setProjectId(parsed.projectId)
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket)
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId)
      if (parsed.appId) setAppId(parsed.appId)
      setRawConfigPaste("") // Clear text area after successful parsing
    }
  }, [rawConfigPaste])

  const copyTokenToClipboard = async () => {
    if (!fcmToken) return
    try {
      await navigator.clipboard.writeText(fcmToken)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy token", err)
    }
  }

  const handleSaveAndEnable = async () => {
    setLocalError(null)
    setIsLoading(true)

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    }

    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
      setLocalError("Please fill out all mandatory Firebase config fields (or paste the Web configuration block).")
      setIsLoading(false)
      return
    }

    if (!vKey.trim()) {
      setLocalError("Web Push VAPID Public Key is required to request notifications subscription.")
      setIsLoading(false)
      return
    }

    try {
      await handleEnableFcm(config, vKey.trim())
    } catch (err: any) {
      setLocalError(err.message || "Failed to configure FCM. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearConfig = () => {
    handleDisableFcm()
    setApiKey("")
    setAuthDomain("")
    setProjectId("")
    setStorageBucket("")
    setMessagingSenderId("")
    setAppId("")
    setVKey("")
    setLocalError(null)
    localStorage.removeItem("fcm_config")
    localStorage.removeItem("fcm_vapid_key")
  }

  const triggerLocalTestNotification = async () => {
    try {
      if (typeof Notification === "undefined") {
        alert("Push notifications are not supported in this browser.")
        return
      }

      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission()
        if (result !== "granted") {
          alert("Notification permission was denied. Please enable notifications in your browser settings to test.")
          return
        }
      }

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          await reg.showNotification("AI Flash Cards 🔔", {
            body: "Success! Notification system is working correctly. Spaced repetition alerts will arrive when cards are due.",
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: "fcm-test",
          })
          console.log("Service Worker notification triggered.")
          return
        }
      }

      // Fallback
      new Notification("AI Flash Cards 🔔", {
        body: "Success! Notification system is working correctly (Fallback notification activated).",
        icon: "/favicon.svg"
      })
      console.log("Fallback notification triggered.")
    } catch (err: any) {
      console.error("Test notification failed:", err)
      alert(`Failed to trigger notification: ${err.message || err}`)
    }
  }

  const [isCloudSending, setIsCloudSending] = useState(false)
  const [isCloudScheduling, setIsCloudScheduling] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [cancellingTaskId, setCancellingTaskId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Keep countdown timer ticking dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCancelScheduledReminder = async (reminder: LocalReminder) => {
    if (!projectId) return
    setCancellingTaskId(reminder.taskId)
    try {
      await cancelScheduledReminder(reminder)
      setCloudStatus({ type: "success", text: "Successfully cancelled scheduled reminder!" })
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.message || String(err)
      setCloudStatus({ type: "error", text: `Failed to cancel reminder: ${errorMsg}` })
    } finally {
      setCancellingTaskId(null)
    }
  }

  const triggerCloudTestNotification = async () => {
    if (!fcmToken) {
      setLocalError("FCM registration token is required. Please enable Push Notifications first.")
      return
    }
    if (!projectId) {
      setLocalError("Project ID is required to invoke Cloud Functions.")
      return
    }

    setIsCloudSending(true)
    setCloudStatus(null)
    try {
      await fcmCloudService.sendPushNotification(projectId, {
        fcmToken,
        title: "Cloud Test ☁️",
        body: "Hello! This push notification was sent via your Cloud Function."
      }, useLocalEmulator)
      setCloudStatus({ type: "success", text: `Successfully sent cloud push notification via ${useLocalEmulator ? "Emulator" : "Production"}!` })
    } catch (err) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setCloudStatus({ type: "error", text: `Cloud Send Failed: ${errorMsg}` })
    } finally {
      setIsCloudSending(false)
    }
  }

  const handleTriggerCloudScheduledNotification = async () => {
    if (!fcmToken) {
      setLocalError("FCM registration token is required. Please enable Push Notifications first.")
      return
    }
    if (!projectId) {
      setLocalError("Project ID is required to invoke Cloud Functions.")
      return
    }

    setIsCloudScheduling(true)
    setCloudStatus(null)
    try {
      await triggerCloudScheduledNotification()
      setCloudStatus({ type: "success", text: `Successfully scheduled reminder for 10s from now via ${useLocalEmulator ? "Emulator" : "Production"}!` })
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.message || String(err)
      setCloudStatus({ type: "error", text: `Cloud Schedule Failed: ${errorMsg}` })
    } finally {
      setIsCloudScheduling(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-purple-500 font-semibold text-sm">
          <Bell className="h-4 w-4" />
          Intelligent Flashcard Review Reminders
        </div>
        <p>
          Firebase Cloud Messaging sends system-level browser notifications when cards are due, prompting you to review for maximum retention, even when the app is closed.
        </p>
      </div>

      {/* FCM Connection Status Panel */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground">Push Notification Status</h4>
        <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">{isFcmEnabled ? "Push Reminders Active" : "Reminders Disabled"}</p>
              <p className="text-[11px] text-muted-foreground">
                {isFcmEnabled ? "Registered with Firebase servers" : "Configure project credentials below to enable"}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isFcmEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
              {isFcmEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {/* Token Copy Section */}
          {isFcmEnabled && fcmToken && (
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">FCM Registration Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={fcmToken}
                  className="flex-1 bg-background text-[11px] px-3 py-1.5 rounded-lg border border-border font-mono text-muted-foreground select-all outline-none"
                />
                <button
                  onClick={copyTokenToClipboard}
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Copy Token"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Display errors if they occur */}
      {(localError) && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-500 flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Setup Error</p>
            <p className="opacity-90">{localError}</p>
          </div>
        </div>
      )}

      {/* Setup Forms */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-foreground">Configuration Details</h4>

        {/* Paste Box */}
        {!isFcmEnabled && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Paste Firebase Web App SDK Configuration</label>
            <textarea
              value={rawConfigPaste}
              onChange={(e) => setRawConfigPaste(e.target.value)}
              placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
};`}
              rows={5}
              className="w-full text-xs p-3 font-mono rounded-xl border border-border bg-background placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Paste the javascript configuration object or JSON snippet. It will automatically parse the fields below.
            </p>
          </div>
        )}

        {/* VAPID Web Push certificate key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Web Push VAPID Public Key (Required)</label>
          <input
            type="text"
            value={vKey}
            onChange={(e) => setVKey(e.target.value)}
            disabled={isFcmEnabled}
            placeholder="BDzHj6c1g..."
            className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none disabled:opacity-60"
          />
          <p className="text-[10px] text-muted-foreground">
            Found under Cloud Messaging Settings &rarr; Web Push Certificates. Required to subscribe the browser.
          </p>
        </div>

        {/* Manual Configuration Accordion */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-card">
          <button
            onClick={() => setIsManualExpanded(!isManualExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-secondary/20 cursor-pointer"
          >
            <span>Manual Configuration Fields</span>
            {isManualExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          
          {isManualExpanded && (
            <div className="p-4 border-t border-border/80 bg-secondary/10 space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Project ID</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">App ID</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Auth Domain (Optional)</label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Storage Bucket (Optional)</label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    disabled={isFcmEnabled}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background font-mono outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="space-y-2.5 pt-2">
        {!isFcmEnabled ? (
          <button
            onClick={handleSaveAndEnable}
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-70"
          >
            <Bell className="h-4 w-4" />
            {isLoading ? "Validating & Subscribing..." : "Enable Push & Save Config"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDisableFcm}
              className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent hover:text-accent-foreground transition-all shadow-sm cursor-pointer"
            >
              Disable Push
            </button>
            <button
              onClick={handleClearConfig}
              className="px-3 h-11 flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer"
              title="Delete config completely"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={triggerLocalTestNotification}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Test Notification Permission (Local Send)
        </button>

        {isFcmEnabled && (
          <div className="space-y-2.5 border-t border-border/50 pt-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cloud Function Tests</label>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/15">
              <span className="text-[11px] font-medium text-foreground">Route requests to local Emulator</span>
              <button
                type="button"
                onClick={() => setUseLocalEmulator(!useLocalEmulator)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  useLocalEmulator ? "bg-purple-500" : "bg-border"
                }`}
                role="switch"
                aria-checked={useLocalEmulator}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out ${
                    useLocalEmulator ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={triggerCloudTestNotification}
                disabled={isCloudSending || isCloudScheduling}
                className="h-10 flex items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" />
                {isCloudSending ? "Sending..." : "Cloud Send"}
              </button>
              <button
                onClick={handleTriggerCloudScheduledNotification}
                disabled={isCloudSending || isCloudScheduling}
                className="h-10 flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {isCloudScheduling ? "Scheduling..." : "Cloud Schedule (10s)"}
              </button>
            </div>
            {cloudStatus && (
              <div className={`p-2.5 rounded-lg border text-[11px] font-semibold ${
                cloudStatus.type === "success"
                  ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  : "border-rose-500/25 bg-rose-500/5 text-rose-500"
              }`}>
                {cloudStatus.text}
              </div>
            )}

            {/* Scheduled Reminders List */}
            {scheduledReminders.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50 space-y-2 text-left">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Scheduled Reminders ({scheduledReminders.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scheduledReminders.map((reminder) => {
                    const secondsLeft = Math.max(0, Math.ceil((reminder.sendAt - currentTime) / 1000))
                    return (
                      <div 
                        key={reminder.taskId}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/20 transition-all text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                          <p className="font-semibold truncate text-foreground flex items-center gap-1.5">
                            {reminder.title}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-normal">
                              {reminder.useLocalEmulator ? "Emulator" : "Cloud"}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{reminder.body}</p>
                          <p className="text-[10px] text-indigo-500 font-semibold">
                            {secondsLeft > 0 ? `Delivering in ${secondsLeft}s...` : "Delivering now..."}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelScheduledReminder(reminder)}
                          disabled={cancellingTaskId === reminder.taskId}
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Cancel scheduled reminder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guide details */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card text-xs">
        <button
          onClick={() => setIsGuideExpanded(!isGuideExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between font-semibold text-foreground hover:bg-secondary/20 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5 text-primary" /> How to Setup Firebase Project
          </span>
          {isGuideExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isGuideExpanded && (
          <div className="p-4 border-t border-border/80 bg-secondary/5 space-y-3 leading-relaxed text-muted-foreground">
            <p>To receive notifications offline, you need your own Firebase project credentials:</p>
            <ol className="list-decimal pl-5 space-y-2 text-[11px]">
              <li>
                Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="h-2.5 w-2.5" /></a> and click <strong>Add Project</strong>.
              </li>
              <li>
                Once created, click the <strong>Web icon (&lt;/&gt;)</strong> in the project home dashboard to add a Web app.
              </li>
              <li>
                Copy the <code>firebaseConfig</code> javascript object from the configuration snippet and paste it into the paste box above.
              </li>
              <li>
                Go to <strong>Project Settings &rarr; Cloud Messaging</strong> tab.
              </li>
              <li>
                Scroll down to the <strong>Web configuration</strong> section. Under <strong>Web Push certificates</strong>, click <strong>Generate Key Pair</strong>.
              </li>
              <li>
                Copy the generated long string (VAPID key) and paste it into the <strong>Web Push VAPID Public Key</strong> field above.
              </li>
              <li>
                Click <strong>Enable Push & Save Config</strong>. Approve the browser's request for notification permission when prompted.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
