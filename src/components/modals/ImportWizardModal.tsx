import React, { useState, useRef, useMemo } from "react"
import {
  Upload,
  X,
  Layers,
  Sliders,
  CheckSquare,
  Square,
  FileJson,
  CheckCircle2,
  AlertCircle,
  FolderUp,
  RefreshCw
} from "lucide-react"
import type { Deck } from "../Deck/Deck"
import type { SettingsState } from "../../pages/Settings"
import {
  parseAndValidateImportJson,
  stripReviewDataFromCard,
  type ParsedImportData
} from "../../lib/importExport"
import { saveReviewHistoryBatch } from "../../lib/historyStorage"

export interface ImportSuccessPayload {
  importedDecks: Deck[]
  importedSettings?: SettingsState
  importedReviewCount: number
}

export interface ImportWizardModalProps {
  isOpen: boolean
  onClose: () => void
  existingDecks: Deck[]
  onImportSuccess: (result: ImportSuccessPayload) => void
}

export function ImportWizardModal({
  isOpen,
  onClose,
  existingDecks,
  onImportSuccess
}: ImportWizardModalProps) {
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [includeReviewData, setIncludeReviewData] = useState(true)
  const [includeSettings, setIncludeSettings] = useState(true)
  const [importStrategy, setImportStrategy] = useState<"merge" | "createNew">("merge")
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const totalCardsSelected = useMemo(() => {
    if (!parsedData) return 0
    return parsedData.decks
      .filter(d => selectedDeckIds.includes(d.id))
      .reduce((sum, d) => sum + d.cards.length, 0)
  }, [parsedData, selectedDeckIds])

  if (!isOpen) return null

  const handleReset = () => {
    setParsedData(null)
    setFileName(null)
    setSelectedDeckIds([])
    setIncludeReviewData(true)
    setIncludeSettings(true)
    setIsImporting(false)
    setErrorMessage(null)
    setSuccessMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileChange = (file: File) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrorMessage("Please select a valid .json file.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = parseAndValidateImportJson(text)
        setParsedData(data)
        setFileName(file.name)
        setSelectedDeckIds(data.decks.map(d => d.id))
        setIncludeReviewData(data.hasReviewData)
        setIncludeSettings(data.hasSettings)
      } catch (err: any) {
        console.error("Failed to parse JSON file:", err)
        setErrorMessage(err.message || "Failed to parse JSON file.")
        setParsedData(null)
      }
    }
    reader.onerror = () => {
      setErrorMessage("Error reading file.")
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleToggleDeck = (deckId: string) => {
    setSelectedDeckIds(prev =>
      prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]
    )
  }

  const handleSelectAll = () => {
    if (parsedData) {
      setSelectedDeckIds(parsedData.decks.map(d => d.id))
    }
  }

  const handleDeselectAll = () => {
    setSelectedDeckIds([])
  }

  const handleExecuteImport = async () => {
    if (!parsedData) return

    if (selectedDeckIds.length === 0 && (!includeSettings || !parsedData.settings)) {
      setErrorMessage("Please select at least one deck or settings to import.")
      return
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const chosenImportDecks = parsedData.decks.filter(d => selectedDeckIds.includes(d.id))
      const processedDecks: Deck[] = chosenImportDecks.map(deck => {
        const targetDeckId = importStrategy === "createNew" ? `deck-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : deck.id
        const cards = deck.cards.map(card => {
          const baseCard = includeReviewData ? card : stripReviewDataFromCard(card)
          return {
            ...baseCard,
            id: importStrategy === "createNew" ? `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : baseCard.id,
            deckId: targetDeckId
          }
        })

        return {
          ...deck,
          id: targetDeckId,
          title: importStrategy === "createNew" && existingDecks.some(d => d.title === deck.title)
            ? `${deck.title} (Imported)`
            : deck.title,
          cards,
          due: includeReviewData ? deck.due : 0
        }
      })

      // Combine with existing decks based on strategy
      let finalDecks: Deck[] = []
      if (importStrategy === "merge") {
        const importedIdSet = new Set(processedDecks.map(d => d.id))
        const remainingExisting = existingDecks.filter(d => !importedIdSet.has(d.id))
        finalDecks = [...remainingExisting, ...processedDecks]
      } else {
        finalDecks = [...existingDecks, ...processedDecks]
      }

      // Review history import
      let importedReviewRecordsCount = 0
      if (includeReviewData && parsedData.reviewHistory.length > 0) {
        const chosenDeckIdSet = new Set(selectedDeckIds)
        const relevantHistory = parsedData.reviewHistory.filter(r => chosenDeckIdSet.has(r.deckId))

        if (relevantHistory.length > 0) {
          await saveReviewHistoryBatch(relevantHistory)
          importedReviewRecordsCount = relevantHistory.length
        }
      }

      const importedSettings = includeSettings && parsedData.settings ? parsedData.settings : undefined

      // Notify parent app
      onImportSuccess({
        importedDecks: finalDecks,
        importedSettings,
        importedReviewCount: importedReviewRecordsCount
      })

      setSuccessMessage(
        `Successfully imported ${processedDecks.length} deck${processedDecks.length === 1 ? "" : "s"}${
          importedReviewRecordsCount > 0 ? ` and ${importedReviewRecordsCount} review record${importedReviewRecordsCount === 1 ? "" : "s"}` : ""
        }${importedSettings ? " and applied settings" : ""}!`
      )

      setTimeout(() => {
        setIsImporting(false)
        onClose()
      }, 1200)
    } catch (err: any) {
      console.error("Import failed:", err)
      setErrorMessage(err.message || "Failed to process import.")
      setIsImporting(false)
    }
  }

  const allSelected = Boolean(parsedData && parsedData.decks.length > 0 && selectedDeckIds.length === parsedData.decks.length)
  const noneSelected = selectedDeckIds.length === 0

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
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
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Import Settings
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close import wizard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto divide-y divide-border/50">
          {/* File Upload / Drop Area */}
          {!parsedData ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border/80 hover:border-primary/50 hover:bg-secondary/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0])
                    }
                  }}
                />
                <div className="p-3 rounded-2xl bg-secondary text-primary mb-3">
                  <FolderUp className="h-8 w-8" />
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  Choose a JSON file or drag & drop it here
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Accepts flashcards export files (.json) containing decks, review history, and app settings.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileJson className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {parsedData.decks.length} deck{parsedData.decks.length === 1 ? "" : "s"} found
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border/40 cursor-pointer transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Decks Checkbox Selection */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Select Decks
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                      {selectedDeckIds.length}/{parsedData.decks.length} selected
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
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-xl p-2 bg-secondary/15">
                    {parsedData.decks.map(deck => {
                      const isChecked = selectedDeckIds.includes(deck.id)
                      const isExisting = existingDecks.some(d => d.id === deck.id)

                      return (
                        <div
                          key={deck.id}
                          onClick={() => handleToggleDeck(deck.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
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
                            {isExisting && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-medium">
                                Exists
                              </span>
                            )}
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
                    onClick={() => parsedData.hasReviewData && setIncludeReviewData(prev => !prev)}
                    className={`flex items-center gap-2.5 select-none py-1 group ${
                      !parsedData.hasReviewData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {includeReviewData && parsedData.hasReviewData ? (
                      <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      Include review history
                    </span>
                    {!parsedData.hasReviewData && (
                      <span className="text-xs text-muted-foreground italic">(Not in file)</span>
                    )}
                  </div>

                  {/* Include Settings Checkbox */}
                  <div
                    onClick={() => parsedData.hasSettings && setIncludeSettings(prev => !prev)}
                    className={`flex items-center gap-2.5 select-none py-1 group ${
                      !parsedData.hasSettings ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {includeSettings && parsedData.hasSettings ? (
                      <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      Include settings
                    </span>
                    {!parsedData.hasSettings && (
                      <span className="text-xs text-muted-foreground italic">(Not in file)</span>
                    )}
                  </div>
                </div>

                {/* Import Strategy */}
                <div className="pt-2 px-3">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Deck Collision Handling
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportStrategy("merge")}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                        importStrategy === "merge"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                      }`}
                    >
                      <div className="font-semibold text-foreground">Merge / Update</div>
                      <div className="text-[11px] text-muted-foreground">Replace matching decks</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStrategy("createNew")}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                        importStrategy === "createNew"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40"
                      }`}
                    >
                      <div className="font-semibold text-foreground">Create as New</div>
                      <div className="text-[11px] text-muted-foreground">Import as new copies</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
            </>
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

          {parsedData && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || (selectedDeckIds.length === 0 && (!includeSettings || !parsedData.settings))}
              className="px-5 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import from JSON
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
