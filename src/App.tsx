import { useState, useEffect } from "react"
import {
  Sun,
  Moon,
  Sparkles,
  Settings as SettingsIcon,
  Key,
  Smartphone,
  Bell,
  Info,
  Layers,
  BookOpen,
  Menu,
  X
} from "lucide-react"
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom"
import { encryptApiKey, decryptApiKey, type EncryptedPayload } from "./lib/crypto"
import { saveEncryptedApiKey, getEncryptedApiKey, removeEncryptedApiKey } from "./lib/db"
import { SetupDrawer } from "./components/drawers/SetupDrawer"
import { useFcm } from "./components/drawers/FcmDrawer"
import { Settings, type SettingsState, DEFAULT_SETTINGS } from "./pages/Settings"
import { INITIAL_DECKS } from "./components/Deck/Decks"
import { type Deck } from "./components/Deck/Deck"
import { Dashboard } from "./pages/Dashboard"
import { Review } from "./pages/Review"
import { DeckOverview, DeckViewer } from "./pages/DeckOverview"
import { Documentation } from "./pages/Documentation"

import { loadDecks, saveDecks } from "./lib/deckStorage"
import { getDeckDueCount, getReviewQueue, syncFcmReminders, getNewCardsReviewedTodayCount } from "./lib/spacedRepetition"
import { clearAllReviewHistory } from "./lib/historyStorage"

function AppContent() {
  // Decks & Deck Editor State
  const [decks, setDecks] = useState<Deck[]>([])
  const [hasLoadedDecks, setHasLoadedDecks] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on desktop screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])


  // Load decks asynchronously on mount
  useEffect(() => {
    loadDecks()
      .then((savedDecks) => {
        setDecks(savedDecks)
        setHasLoadedDecks(true)
      })
      .catch((err) => {
        console.error("Failed to load decks", err)
        setDecks(INITIAL_DECKS)
        setHasLoadedDecks(true)
      })
  }, [])

  // Save decks asynchronously on change (only after loaded)
  useEffect(() => {
    if (hasLoadedDecks) {
      saveDecks(decks)
    }
  }, [decks, hasLoadedDecks])

  // Restore route on load
  useEffect(() => {
    const savedPath = localStorage.getItem("current_page")
    if (savedPath && savedPath !== location.pathname) {
      if (savedPath.startsWith("/review") && reviewQueue.length === 0) {
        navigate("/dashboard", { replace: true })
      } else {
        navigate(savedPath, { replace: true })
      }
    } else if (location.pathname === "/") {
      navigate("/dashboard", { replace: true })
    }
  }, [])

  // Save route on change
  useEffect(() => {
    if (location.pathname && location.pathname !== "/" && !location.pathname.startsWith("/review")) {
      localStorage.setItem("current_page", location.pathname)
    }
  }, [location.pathname])

  const toggleDeckEnabled = (deckId: string) => {
    setDecks(prev =>
      prev.map(d => (d.id === deckId ? { ...d, enabled: !d.enabled } : d))
    )
  }

  const handleUpdateDeck = (deckId: string, updates: Partial<Deck>) => {
    setDecks(prev =>
      prev.map(d => (d.id === deckId ? { ...d, ...updates } : d))
    )
  }

  const handleAddCardToDeck = (deckId: string, newCard: any) => {
    setDecks(prev =>
      prev.map(d =>
        d.id === deckId
          ? {
            ...d,
            cards: [...d.cards, newCard]
          }
          : d
      )
    )
  }

  const handleDeleteCardFromDeck = (deckId: string, cardId: string) => {
    setDecks(prev =>
      prev.map(d =>
        d.id === deckId
          ? {
            ...d,
            cards: d.cards.filter(c => c.id !== cardId)
          }
          : d
      )
    )
  }

  const handleCreateNewDeck = () => {
    const newDeckId = `deck-${Date.now()}`
    const newDeck: Deck = {
      id: newDeckId,
      title: `New Deck ${decks.length + 1}`,
      description: "Custom flashcard collection",
      due: 0,
      enabled: true,
      cards: []
    }
    setDecks(prev => [...prev, newDeck])
    navigate(`/deck/${newDeckId}`)
  }

  const handleDeleteDeck = (deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId))
  }

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved) return saved === "dark"
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return true
  })

  // Settings State & Local Storage Persistence
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_settings")
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse settings", e)
        }
      }
    }
    return DEFAULT_SETTINGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app_settings", JSON.stringify(settings))
    }
    setDarkMode(settings.darkMode)
  }, [settings])

  const handleUpdateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleResetSettings = () => {
    setSettings(prev => ({
      ...DEFAULT_SETTINGS,
      darkMode: prev.darkMode
    }))
  }

  const handleResetData = async () => {
    try {
      const resetDecks = decks.map(deck => {
        const resetCards = deck.cards.map(card => {
          const {
            interval,
            repetition,
            easeFactor,
            nextReviewDate,
            lastReviewed,
            difficulty,
            masteryLevel,
            ...rest
          } = card
          return rest
        })
        return {
          ...deck,
          cards: resetCards
        }
      })

      await clearAllReviewHistory()
      setDecks(resetDecks)
      alert("Review history and card progress have been successfully reset!")
      navigate("/dashboard")
    } catch (err: any) {
      console.error("Failed to reset due dates and history:", err)
      alert(`Failed to reset data: ${err.message || err}`)
    }
  }

  const handleImportData = (payload: {
    importedDecks: Deck[]
    importedSettings?: SettingsState
    importedReviewCount: number
  }) => {
    setDecks(payload.importedDecks)
    if (payload.importedSettings) {
      setSettings(payload.importedSettings)
    }
  }

  // Setup Drawer State
  const [activeDrawerStep, setActiveDrawerStep] = useState<"apiKey" | "pwa" | "fcm" | null>(null)

  // API Provider State
  const [apiProvider, setApiProvider] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("api_provider") || "Google"
    }
    return "Google"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("api_provider", apiProvider)
    }
  }, [apiProvider])

  // API Key & IndexedDB State
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null)
  const [pinInput, setPinInput] = useState("")
  const [rawApiKeyInput, setRawApiKeyInput] = useState("")
  const [cryptoStatus, setCryptoStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null)
  const [decryptedKeyPreview, setDecryptedKeyPreview] = useState<string | null>(null)
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({})

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(display-mode: standalone)").matches || localStorage.getItem("pwa_installed") === "true"
    }
    return false
  })

  // FCM State
  const {
    isFcmEnabled,
    fcmToken,
    firebaseConfig,
    useLocalEmulator,
    scheduledReminders,
    setScheduledReminders,
    cancelScheduledReminder,
    triggerCloudScheduledNotification,
    handleEnableFcm,
    handleDisableFcm,
    setUseLocalEmulator
  } = useFcm()

  // Spaced Repetition Queue & Filter State
  const [reviewQueue, setReviewQueue] = useState<any[]>([])

  // Sync FCM Reminders whenever decks, settings, or FCM state changes
  useEffect(() => {
    if (hasLoadedDecks && isFcmEnabled && fcmToken && firebaseConfig?.projectId) {
      syncFcmReminders(
        decks,
        settings,
        fcmToken,
        firebaseConfig.projectId,
        useLocalEmulator,
        setScheduledReminders
      ).catch((err) => console.error("Failed to sync FCM reminders:", err))
    }
  }, [
    decks,
    hasLoadedDecks,
    isFcmEnabled,
    fcmToken,
    firebaseConfig,
    useLocalEmulator,
    settings.reminderInterval,
    settings.spacedRepetition
  ])


  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  // Load Encrypted API Key from LocalStorage
  useEffect(() => {
    setDecryptedKeyPreview(null)
    setCryptoStatus(null)
    setRawApiKeyInput("")
    setPinInput("")

    getEncryptedApiKey(apiProvider)
      .then((payload) => {
        setEncryptedPayload(payload)
      })
      .catch((err) => console.error("Error loading key from LocalStorage:", err))
  }, [apiProvider])

  // PWA Prompt & Install Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const handleAppInstalled = () => {
      setIsPwaInstalled(true)
      localStorage.setItem("pwa_installed", "true")
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  // Listen for changes in PWA standalone display mode
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPwaInstalled(e.matches || localStorage.getItem("pwa_installed") === "true")
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange)
    } else {
      mediaQuery.addListener(handleMediaChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange)
      } else {
        mediaQuery.removeListener(handleMediaChange)
      }
    }
  }, [])


  // Auto Notice Tooltip on Page Loaded
  const [autoNoticeStep, setAutoNoticeStep] = useState<"pwa" | "apiKey" | "fcm" | null>(null)
  const [isAutoNoticeVisible, setIsAutoNoticeVisible] = useState(false)

  useEffect(() => {
    const targetStep = !isPwaInstalled ? "pwa" : !encryptedPayload ? "apiKey" : !isFcmEnabled ? "fcm" : null
    if (targetStep) {
      setAutoNoticeStep(targetStep)
      const showTimer = setTimeout(() => {
        setIsAutoNoticeVisible(true)
      }, 300)
      const hideTimer = setTimeout(() => {
        setIsAutoNoticeVisible(false)
      }, 4300)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    } else {
      setAutoNoticeStep(null)
      setIsAutoNoticeVisible(false)
    }
  }, [isPwaInstalled, encryptedPayload, isFcmEnabled])


  // API Key Encryption Handlers
  const handleSaveApiKey = async () => {
    if (!pinInput.trim()) {
      setCryptoStatus({ type: "error", msg: "Please provide a PIN to encrypt the key." })
      return
    }
    if (!rawApiKeyInput.trim()) {
      setCryptoStatus({ type: "error", msg: `Please enter your ${apiProvider} API Key.` })
      return
    }
    try {
      setCryptoStatus({ type: "info", msg: "Encrypting with AES-GCM-256..." })
      const payload = await encryptApiKey(rawApiKeyInput.trim(), pinInput.trim())
      await saveEncryptedApiKey(apiProvider, payload)
      setEncryptedPayload(payload)
      setDecryptedKeys(prev => ({ ...prev, [apiProvider.toLowerCase()]: rawApiKeyInput.trim() }))
      setRawApiKeyInput("")
      setPinInput("")
      setCryptoStatus({ type: "success", msg: "API Key encrypted & stored in LocalStorage!" })
    } catch (err: any) {
      setCryptoStatus({ type: "error", msg: `Encryption failed: ${err.message || err}` })
    }
  }

  const handleDecryptApiKey = async () => {
    if (!encryptedPayload) return
    if (!pinInput.trim()) {
      setCryptoStatus({ type: "error", msg: "Please enter your PIN to decrypt." })
      return
    }
    try {
      const decrypted = await decryptApiKey(encryptedPayload, pinInput.trim())
      setDecryptedKeyPreview(decrypted)
      setDecryptedKeys(prev => ({ ...prev, [apiProvider.toLowerCase()]: decrypted }))
      setCryptoStatus({ type: "success", msg: "Decryption successful! Key valid." })
    } catch (err) {
      setDecryptedKeyPreview(null)
      setCryptoStatus({ type: "error", msg: "Incorrect PIN or decryption error." })
    }
  }

  const handleRemoveApiKey = async () => {
    try {
      await removeEncryptedApiKey(apiProvider)
      setEncryptedPayload(null)
      setDecryptedKeyPreview(null)
      setDecryptedKeys(prev => {
        const next = { ...prev }
        delete next[apiProvider.toLowerCase()]
        return next
      })
      setCryptoStatus({ type: "info", msg: "Key removed from LocalStorage." })
    } catch (err: any) {
      setCryptoStatus({ type: "error", msg: `Failed to remove key: ${err.message}` })
    }
  }

  // PWA Install Handler
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setIsPwaInstalled(true)
        localStorage.setItem("pwa_installed", "true")
      }
      setDeferredPrompt(null)
    } else {
      // Toggle for simulation/manual verification
      const nextState = !isPwaInstalled
      setIsPwaInstalled(nextState)
      localStorage.setItem("pwa_installed", String(nextState))
    }
  }

  const decksWithDueCounts = decks.map(d => ({
    ...d,
    due: getDeckDueCount(d, settings)
  }))

  const totalReviewsDue = (() => {
    if (!settings.spacedRepetition) return 0
    const enabledDecks = decks.filter(d => d.enabled)
    const allCards = enabledDecks.flatMap(d => d.cards)
    const now = new Date()
    const scheduledDue = allCards.filter(c => c.nextReviewDate && new Date(c.nextReviewDate) <= now).length
    const newCards = allCards.filter(c => !c.nextReviewDate).length
    const reviewedToday = getNewCardsReviewedTodayCount()
    const allowedNewCards = Math.max(0, 10 - reviewedToday)
    return scheduledDue + Math.min(newCards, allowedNewCards)
  })()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/30 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="relative inline-flex items-center pr-2 md:pr-6">
                <span className="hidden sm:inline font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  AI Flash Cards
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 border-l border-border pl-6">
              <button
                onClick={() => navigate("/deck-overview")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === "/deck-overview" || location.pathname.startsWith("/deck/")
                    ? "text-primary font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Decks</span>
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={() => navigate("/documentation")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === "/documentation"
                    ? "text-primary font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Docs</span>
              </button>
            </nav>
          </div>

          <nav className="flex items-center gap-2 relative">
            {/* Header Setup Icon Buttons */}
            <div className="flex items-center gap-2 pr-2 border-r border-border">
              {/* 1. Install PWA Button */}
              <div className="relative group">
                <button
                  onClick={() => setActiveDrawerStep("pwa")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${isPwaInstalled
                    ? "border-emerald-500/30 text-emerald-500 hover:border-emerald-500/60 bg-emerald-500/10"
                    : "border-rose-500/30 text-rose-500 hover:border-rose-500/60 bg-rose-500/10 animate-pulse-slow"
                    }`}
                  aria-label="Install PWA"
                  title="Install PWA"
                >
                  <Smartphone className="h-5 w-5" />
                </button>

                {/* Hover Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden w-64 group-hover:block rounded-xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50 pointer-events-none animate-in fade-in duration-150">
                  <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> What breaks without it?
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    Progressive Web Apps shield your local data from accidental and automatic cleanups in the long term. Also prerequisite for receiving reminder notifications when the app is closed.
                  </p>
                </div>

                {/* Auto Slide-In Tooltip on Page Load */}
                {autoNoticeStep === "pwa" && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-50 pointer-events-none transition-all duration-500 ease-out whitespace-nowrap ${isAutoNoticeVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95"
                      }`}
                  >
                    <div className="relative flex items-center gap-2 rounded-xl border border-rose-500/30 bg-popover px-3.5 py-2 text-m font-bold text-rose-500 shadow-xl animate-pulse-slow">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-t border-l border-rose-500/30 rotate-45" />
                      <Sparkles className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Finish page setup here</span>
                    </div>
                  </div>
                )}
              </div>
              {/* 2. API Key Button */}
              <div className="relative group">
                <button
                  onClick={() => {
                    setActiveDrawerStep("apiKey")
                    setCryptoStatus(null)
                    setDecryptedKeyPreview(null)
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${encryptedPayload
                    ? "border-emerald-500/30 text-emerald-500 hover:border-emerald-500/60 bg-emerald-500/10"
                    : "border-rose-500/30 text-rose-500 hover:border-rose-500/60 bg-rose-500/10 animate-pulse-slow"
                    }`}
                  aria-label="LLM API Key Setup"
                  title="LLM API Key"
                >
                  <Key className="h-5 w-5" />
                </button>

                {/* Hover Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden w-64 group-hover:block rounded-xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50 pointer-events-none animate-in fade-in duration-150">
                  <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> What breaks without it?
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    Without an API Key, answer evaluation doesn't work.
                  </p>
                </div>

                {/* Auto Slide-In Tooltip on Page Load */}
                {autoNoticeStep === "apiKey" && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-50 pointer-events-none transition-all duration-500 ease-out whitespace-nowrap ${isAutoNoticeVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95"
                      }`}
                  >
                    <div className="relative flex items-center gap-2 rounded-xl border border-rose-500/30 bg-popover px-3.5 py-2 text-m font-bold text-rose-500 shadow-xl animate-pulse-slow">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-t border-l border-rose-500/30 rotate-45" />
                      <Sparkles className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Finish page setup here</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Setup FCM Button */}
              <div className="relative group">
                <button
                  onClick={() => setActiveDrawerStep("fcm")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${isFcmEnabled
                    ? "border-emerald-500/30 text-emerald-500 hover:border-emerald-500/60 bg-emerald-500/10"
                    : "border-rose-500/30 text-rose-500 hover:border-rose-500/60 bg-rose-500/10 animate-pulse-slow"
                    }`}
                  aria-label="Setup FCM"
                  title="Setup FCM"
                >
                  <Bell className="h-5 w-5" />
                </button>

                {/* Hover Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden w-64 group-hover:block rounded-xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50 pointer-events-none animate-in fade-in duration-150">
                  <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> What breaks without it?
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    Firebase Cloud Messaging (FCM) enables study reminders for due reviews. PWA installation is required for this to work while the app is closed.
                  </p>
                </div>

                {/* Auto Slide-In Tooltip on Page Load */}
                {autoNoticeStep === "fcm" && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-50 pointer-events-none transition-all duration-500 ease-out whitespace-nowrap ${isAutoNoticeVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95"
                      }`}
                  >
                    <div className="relative flex items-center gap-2 rounded-xl border border-rose-500/30 bg-popover px-3.5 py-2 text-m font-bold text-rose-500 shadow-xl animate-pulse-slow">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-t border-l border-rose-500/30 rotate-45" />
                      <Sparkles className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Finish page setup here</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => handleUpdateSetting("darkMode", !settings.darkMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

             {/* Header Settings Button */}
            <button
              onClick={() => navigate("/settings")}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${location.pathname === "/settings" ? "ring-2 ring-primary/40 border-primary" : ""
                }`}
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
            <div className="container max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  navigate("/deck-overview")
                  setMobileMenuOpen(false)
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === "/deck-overview" || location.pathname.startsWith("/deck/")
                    ? "text-primary font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                }`}
              >
                <Layers className="h-5 w-5" />
                <span>Decks</span>
              </button>
              <div className="h-px bg-border/60 my-1" />
              <button
                onClick={() => {
                  navigate("/documentation")
                  setMobileMenuOpen(false)
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === "/documentation"
                    ? "text-primary font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span>Documentation</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <Dashboard
                decks={decksWithDueCounts}
                totalDue={totalReviewsDue}
                onStartReview={() => {
                  const queue = getReviewQueue(decks, settings, null)
                  setReviewQueue(queue)
                  navigate("/review")
                }}
                onBrowseDecks={() => navigate("/deck-overview")}
              />
            }
          />
          <Route
            path="/deck-overview"
            element={
              <DeckOverview
                decks={decksWithDueCounts}
                editingDeckId={null}
                onSelectDeck={(id) => navigate(`/deck/${id}`)}
                onToggleDeckEnabled={toggleDeckEnabled}
                onCreateNewDeck={handleCreateNewDeck}
              />
            }
          />
          <Route
            path="/deck/:deckId"
            element={
              <DeckRouteWrapper
                decks={decks}
                settings={settings}
                handleUpdateDeck={handleUpdateDeck}
                handleAddCardToDeck={handleAddCardToDeck}
                handleDeleteCardFromDeck={handleDeleteCardFromDeck}
                handleDeleteDeck={handleDeleteDeck}
                decryptedKeys={decryptedKeys}
                setDecryptedKeys={setDecryptedKeys}
                setReviewQueue={setReviewQueue}
              />
            }
          />
          <Route
            path="/review"
            element={
              <Review
                reviewQueue={reviewQueue}
                decks={decks}
                settings={settings}
                handleUpdateSetting={handleUpdateSetting}
                decryptedKeys={decryptedKeys}
                setDecryptedKeys={setDecryptedKeys}
                setDecks={setDecks}
              />
            }
          />
          <Route
            path="/documentation"
            element={<Documentation />}
          />
          <Route
            path="/settings"
            element={
              <Settings
                settings={settings}
                onUpdateSetting={handleUpdateSetting}
                onResetDefaults={handleResetSettings}
                onOpenDrawerStep={(step) => setActiveDrawerStep(step)}
                onResetData={handleResetData}
                decks={decks}
                onImportData={handleImportData}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Closable Setup Drawer Modal */}
      <SetupDrawer
        activeDrawerStep={activeDrawerStep}
        onClose={() => setActiveDrawerStep(null)}
        apiKeyProps={{
          apiProvider,
          setApiProvider,
          pinInput,
          setPinInput,
          rawApiKeyInput,
          setRawApiKeyInput,
          cryptoStatus,
          encryptedPayload,
          decryptedKeyPreview,
          handleSaveApiKey,
          handleDecryptApiKey,
          handleRemoveApiKey,
          settings,
          onUpdateSetting: handleUpdateSetting
        }}
        pwaProps={{
          isPwaInstalled,
          canInstallDirectly: !!deferredPrompt,
          handleInstallPwa
        }}
        fcmProps={{
          isFcmEnabled,
          fcmToken,
          firebaseConfig,
          handleEnableFcm,
          handleDisableFcm,
          scheduledReminders,
          setScheduledReminders,
          cancelScheduledReminder,
          triggerCloudScheduledNotification,
          useLocalEmulator,
          setUseLocalEmulator
        }}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16 py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 AI Flash Cards. Designed with pure aesthetics and offline capability.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DeckRouteWrapper({
  decks,
  settings,
  handleUpdateDeck,
  handleAddCardToDeck,
  handleDeleteCardFromDeck,
  handleDeleteDeck,
  decryptedKeys,
  setDecryptedKeys,
  setReviewQueue,
}: {
  decks: Deck[]
  settings: SettingsState
  handleUpdateDeck: any
  handleAddCardToDeck: any
  handleDeleteCardFromDeck: any
  handleDeleteDeck: any
  decryptedKeys: any
  setDecryptedKeys: any
  setReviewQueue: any
}) {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const currentDeck = decks.find(d => d.id === deckId)

  if (!currentDeck) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex flex-col gap-6">
      <DeckViewer
        currentDeck={currentDeck}
        onClose={() => navigate("/deck-overview")}
        onUpdateDeck={handleUpdateDeck}
        onAddCard={handleAddCardToDeck}
        onDeleteCard={handleDeleteCardFromDeck}
        dueCount={getDeckDueCount(currentDeck, settings)}
        onStartReviewDeck={(id) => {
          const queue = getReviewQueue(decks, settings, id)
          setReviewQueue(queue)
          navigate("/review")
        }}
        onDeleteDeck={(id) => {
          handleDeleteDeck(id)
          navigate("/deck-overview")
        }}
        settings={settings}
        decryptedKeys={decryptedKeys}
        setDecryptedKeys={setDecryptedKeys}
      />
    </div>
  )
}



export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
