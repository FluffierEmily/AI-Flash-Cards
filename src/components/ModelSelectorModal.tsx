import { Settings, X, Lock, Unlock, AlertCircle } from "lucide-react"
import { PROVIDER_MODELS } from "../lib/ai"
import type { SettingsState } from "./Settings"

export interface ModelSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  settings: SettingsState
  aiEvaluationProvider: string // raw value from state (could be "")
  aiEvaluationModel: string // raw value from state (could be "")
  onUpdateOverride: (provider: string, model: string) => void
  decryptedKeys: Record<string, string>
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  settings,
  aiEvaluationProvider,
  aiEvaluationModel,
  onUpdateOverride,
  decryptedKeys
}: ModelSelectorModalProps) {
  if (!isOpen) return null

  // Compute active resolved provider for status display
  const activeProvider = aiEvaluationProvider || settings.aiModelProvider
  const isUsingDefault = !aiEvaluationProvider

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay with Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            AI Evaluation Model
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Provider</label>
            <select
              value={aiEvaluationProvider}
              onChange={(e) => {
                const val = e.target.value
                if (val === "") {
                  onUpdateOverride("", "")
                } else {
                  onUpdateOverride(val, PROVIDER_MODELS[val]?.[0] || "")
                }
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm cursor-pointer outline-none focus:border-primary"
            >
              <option value="">Use Global Default ({settings.aiModelProvider})</option>
              {Object.keys(PROVIDER_MODELS).map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Model</label>
            <select
              value={isUsingDefault ? "" : aiEvaluationModel}
              onChange={(e) => {
                if (!isUsingDefault) {
                  onUpdateOverride(aiEvaluationProvider, e.target.value)
                }
              }}
              disabled={isUsingDefault}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm cursor-pointer outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUsingDefault ? (
                <option value="">Use Global Default ({settings.aiModelName})</option>
              ) : (
                (PROVIDER_MODELS[aiEvaluationProvider] || []).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              )}
            </select>
          </div>

          {activeProvider === "Anthropic" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Note on Anthropic CORS
              </div>
              <p className="leading-relaxed">
                Direct browser requests to Anthropic block due to CORS policy. Consider using Google, OpenAI, or
                OpenRouter to run Claude models.
              </p>
            </div>
          )}

          <div className="p-3 bg-secondary/50 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
              {decryptedKeys[activeProvider.toLowerCase()] ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <Unlock className="h-3.5 w-3.5" /> Key Decrypted & In Memory
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Key Encrypted / Not set
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer mt-2"
        >
          Apply Settings
        </button>
      </div>
    </div>
  )
}
