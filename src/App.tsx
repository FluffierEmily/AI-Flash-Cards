import { useState, useEffect } from "react"
import {
  Sun,
  Moon,
  Sparkles,
  Settings,
  Key,
  Smartphone,
  Bell,
  Info
} from "lucide-react"
import { encryptApiKey, decryptApiKey, type EncryptedPayload } from "./lib/crypto"
import { saveEncryptedApiKey, getEncryptedApiKey, removeEncryptedApiKey } from "./lib/db"
import { SetupDrawer } from "./components/drawers/SetupDrawer"
import { useFcm } from "./components/drawers/FcmDrawer"
import { SettingsModal, type SettingsState, DEFAULT_SETTINGS } from "./components/Settings"
import { FlashcardReview } from "./components/Flashcard/Flashcards"
import { DummyDecks, INITIAL_DECKS } from "./components/Deck/Decks"
import { type Deck } from "./components/Deck/Deck"
import { DeckViewer } from "./components/Deck/DeckViewer"
import { Dashboard } from "./components/Dashboard"

import { loadDecks, saveDecks } from "./lib/deckStorage"
import { calculateNextReview, getDeckDueCount, getReviewQueue, syncFcmReminders } from "./lib/spacedRepetition"

export default function App() {
  // Decks & Deck Editor State
  const [decks, setDecks] = useState<Deck[]>([])
  const [hasLoadedDecks, setHasLoadedDecks] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

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
    setEditingDeckId(newDeckId)
    setIsReviewing(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId))
    if (editingDeckId === deckId) {
      setEditingDeckId(null)
    }
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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

  // Load Encrypted API Key from IndexedDB
  useEffect(() => {
    getEncryptedApiKey()
      .then((payload) => {
        if (payload) {
          setEncryptedPayload(payload)
        }
      })
      .catch((err) => console.error("Error loading key from IndexedDB:", err))
  }, [])

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
      await saveEncryptedApiKey(payload)
      setEncryptedPayload(payload)
      setRawApiKeyInput("")
      setPinInput("")
      setCryptoStatus({ type: "success", msg: "API Key encrypted & stored in IndexedDB!" })
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
      setCryptoStatus({ type: "success", msg: "Decryption successful! Key valid." })
    } catch (err) {
      setDecryptedKeyPreview(null)
      setCryptoStatus({ type: "error", msg: "Incorrect PIN or decryption error." })
    }
  }

  const handleRemoveApiKey = async () => {
    try {
      await removeEncryptedApiKey()
      setEncryptedPayload(null)
      setDecryptedKeyPreview(null)
      setCryptoStatus({ type: "info", msg: "Key removed from IndexedDB." })
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

  const totalReviewsDue = decksWithDueCounts.filter(d => d.enabled).reduce((acc, deck) => acc + deck.due, 0)

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/30 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="relative inline-flex items-center pr-6">
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                AI Flash Cards
              </span>
            </div>
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
              onClick={() => setIsSettingsOpen(true)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${isSettingsOpen ? "ring-2 ring-primary/40 border-primary" : ""
                }`}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">

        {/* Study Sandbox and Interactive Demo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Your Decks Sidebar - Left Column */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <DummyDecks
              decks={decksWithDueCounts}
              editingDeckId={editingDeckId}
              onSelectDeck={(id) => {
                setEditingDeckId(id)
                setIsReviewing(false)
              }}
              onToggleDeckEnabled={toggleDeckEnabled}
              onCreateNewDeck={handleCreateNewDeck}
            />
          </div>

          {/* Main Showcase / Deck Editor Area - Right Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {editingDeckId && decks.find(d => d.id === editingDeckId) ? (
              <DeckViewer
                currentDeck={decks.find(d => d.id === editingDeckId)!}
                onClose={() => setEditingDeckId(null)}
                onUpdateDeck={handleUpdateDeck}
                onAddCard={handleAddCardToDeck}
                onDeleteCard={handleDeleteCardFromDeck}
                dueCount={getDeckDueCount(decks.find(d => d.id === editingDeckId)!, settings)}
                onStartReviewDeck={(deckId) => {
                  const queue = getReviewQueue(decks, settings, deckId)
                  setReviewQueue(queue)
                  setIsReviewing(true)
                  setEditingDeckId(null)
                }}
                onDeleteDeck={handleDeleteDeck}
              />
            ) : isReviewing ? (
              <FlashcardReview
                cards={reviewQueue}
                onClose={() => setIsReviewing(false)}
                onReviewCard={(cardId, rating) => {
                  setDecks(prevDecks => {
                    return prevDecks.map(deck => {
                      const cardIndex = deck.cards.findIndex(c => c.id === cardId)
                      if (cardIndex === -1) return deck

                      const updatedCards = [...deck.cards]
                      const oldCard = updatedCards[cardIndex]
                      const newReviewStats = calculateNextReview(oldCard, rating)
                      
                      updatedCards[cardIndex] = {
                        ...oldCard,
                        ...newReviewStats
                      }

                      return {
                        ...deck,
                        cards: updatedCards
                      }
                    })
                  })
                }}
              />
            ) : (
              <Dashboard
                totalDue={totalReviewsDue}
                onStartReview={() => {
                  const queue = getReviewQueue(decks, settings, null)
                  setReviewQueue(queue)
                  setIsReviewing(true)
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Settings Bottom-Sliding Modal Drawer */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={handleUpdateSetting}
        onResetDefaults={handleResetSettings}
        onOpenDrawerStep={(step) => setActiveDrawerStep(step)}
      />

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
          handleRemoveApiKey
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
