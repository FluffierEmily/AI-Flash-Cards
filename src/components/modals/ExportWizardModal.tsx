import { useState, useEffect, useMemo } from "react"
import {
  Download,
  X,
  Layers,
  Sliders,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import type { Deck } from "../Deck/Deck"
import type { SettingsState } from "../../pages/Settings"
import { createExportPayload, downloadJsonFile } from "../../lib/importExport"

export interface ExportWizardModalProps {
  isOpen: boolean
  onClose: () => void
  decks: Deck[]
  settings: SettingsState
}

export function ExportWizardModal({
  isOpen,
  onClose,
  decks,
  settings
}: ExportWizardModalProps) {
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [includeReviewData, setIncludeReviewData] = useState(true)
  const [includeSettings, setIncludeSettings] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize selected decks when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedDeckIds(decks.map(d => d.id))
      setIncludeReviewData(true)
      setIncludeSettings(true)
      setIsExporting(false)
      setExportSuccess(false)
      setErrorMessage(null)
    }
  }, [isOpen, decks])

  const totalCardsSelected = useMemo(() => {
    return decks
      .filter(d => selectedDeckIds.includes(d.id))
      .reduce((sum, d) => sum + d.cards.length, 0)
  }, [decks, selectedDeckIds])

  if (!isOpen) return null

  const handleToggleDeck = (deckId: string) => {
    setSelectedDeckIds(prev =>
      prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]
    )
  }

  const handleSelectAll = () => {
    setSelectedDeckIds(decks.map(d => d.id))
  }

  const handleDeselectAll = () => {
    setSelectedDeckIds([])
  }

  const handleExport = async () => {
    if (selectedDeckIds.length === 0 && !includeSettings) {
      setErrorMessage("Please select at least one deck or enable settings to export.")
      return
    }

    setIsExporting(true)
    setErrorMessage(null)

    try {
      const payload = await createExportPayload({
        decks,
        selectedDeckIds,
        includeReviewData,
        includeSettings,
        currentSettings: settings
      })

      const dateStr = new Date().toISOString().split("T")[0]
      const filename = `flashcards-export-${dateStr}.json`
      const jsonContent = JSON.stringify(payload, null, 2)

      downloadJsonFile(jsonContent, filename)
      setExportSuccess(true)

      // Auto close after brief display or let user close
      setTimeout(() => {
        setIsExporting(false)
      }, 500)
    } catch (err: any) {
      console.error("Export failed:", err)
      setErrorMessage(err.message || "Failed to generate export file.")
      setIsExporting(false)
    }
  }

  const allSelected = decks.length > 0 && selectedDeckIds.length === decks.length
  const noneSelected = selectedDeckIds.length === 0

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-5 md:px-6 md:py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Export Settings
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close export wizard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto">
          {/* Deck Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Select Decks
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                  {selectedDeckIds.length}/{decks.length} selected
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                  {totalCardsSelected} {totalCardsSelected === 1 ? "card" : "cards"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={allSelected}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-primary hover:bg-primary/10 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  Select All
                </button>
                <span className="text-muted-foreground/40 text-xs">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={noneSelected}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="px-2">
              {decks.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No decks found in the application.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-xl p-2 bg-secondary/15">
                  {decks.map(deck => {
                    const isChecked = selectedDeckIds.includes(deck.id)
                    return (
                      <div
                        key={deck.id}
                        onClick={() => handleToggleDeck(deck.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${isChecked
                          ? "bg-card border-primary/40 shadow-xs text-foreground"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {deck.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono">
                            {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Options Section */}
          <div className="pt-4 space-y-3">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Additional Data
            </span>

            <div className="space-y-2 pt-0.5 px-3">
              {/* Include Review Data Checkbox */}
              <div
                onClick={() => setIncludeReviewData(prev => !prev)}
                className="flex items-center gap-2.5 cursor-pointer select-none py-1 group"
              >
                {includeReviewData ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
                )}
                <span className="text-sm font-medium text-foreground">
                  Include review history
                </span>
              </div>

              {/* Include Settings Checkbox */}
              <div
                onClick={() => setIncludeSettings(prev => !prev)}
                className="flex items-center gap-2.5 cursor-pointer select-none py-1 group"
              >
                {includeSettings ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
                )}
                <span className="text-sm font-medium text-foreground">
                  Include settings
                </span>
              </div>
            </div>
          </div>

          {/* Status feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>JSON file generated and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:px-6 border-t border-border bg-secondary/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (selectedDeckIds.length === 0 && !includeSettings)}
            className="px-5 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export to JSON"}
          </button>
        </div>
      </div>
    </div>
  )
}
