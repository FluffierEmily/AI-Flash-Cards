import React from "react"
import { ShieldCheck, ChevronDown, Lock, Key, AlertCircle, Check, Unlock, Trash2, Sparkles } from "lucide-react"
import type { EncryptedPayload } from "../../lib/crypto"
import { PROVIDER_MODELS } from "../../lib/ai"
import type { SettingsState } from "../../pages/Settings"

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}

export interface ApiKeyDrawerProps {
  apiProvider: string
  setApiProvider: (provider: string) => void
  pinInput: string
  setPinInput: (pin: string) => void
  rawApiKeyInput: string
  setRawApiKeyInput: (key: string) => void
  cryptoStatus: { type: "success" | "error" | "info"; msg: string } | null
  encryptedPayload: EncryptedPayload | null
  decryptedKeyPreview: string | null
  handleSaveApiKey: () => void
  handleDecryptApiKey: () => void
  handleRemoveApiKey: () => void
  settings: SettingsState
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

export const getApiKeyPlaceholder = (provider: string) => {
  switch (provider) {
    case "Google":
      return "Paste key (AIzaSy...)"
    case "OpenAI":
      return "Paste key (sk-...)"
    case "Anthropic":
      return "Paste key (sk-ant-...)"
    case "OpenRouter":
      return "Paste key (sk-or-...)"
    case "Groq":
      return "Paste key (gsk_...)"
    case "DeepSeek":
      return "Paste key (sk-...)"
    case "Mistral":
      return "Paste key (...)"
    default:
      return "Paste API key..."
  }
}

export function ApiKeyDrawer({
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
  onUpdateSetting
}: ApiKeyDrawerProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Default AI Model Settings Card */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Sparkles className="h-4 w-4" />
          Default AI Model
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Provider
            </label>
            <div className="relative">
              <select
                value={settings.aiModelProvider}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdateSetting("aiModelProvider", val)
                  setApiProvider(val)
                  onUpdateSetting("aiModelName", PROVIDER_MODELS[val]?.[0] || "")
                }}
                className="w-full h-9 px-2.5 rounded-xl border border-border bg-background text-[11px] text-foreground outline-none focus:border-primary appearance-none cursor-pointer pr-7"
              >
                {Object.keys(PROVIDER_MODELS).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Model
            </label>
            <div className="relative">
              <select
                value={settings.aiModelName}
                onChange={(e) => onUpdateSetting("aiModelName", e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border bg-background text-[11px] text-foreground outline-none focus:border-primary appearance-none cursor-pointer pr-7"
              >
                {(PROVIDER_MODELS[settings.aiModelProvider] || []).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ShieldCheck className="h-4 w-4" />
          Client-Side AES Encryption
        </div>
        <p>
          Your API Key is never stored in plain text or sent to third-party tracking servers.
          It is encrypted locally with PBKDF2 + AES-GCM (256-bit) using your personal PIN key before saving into IndexedDB.
          <br /><br />
          If you forgot your PIN, you can add the API key again with a new PIN to overwrite the old one.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Decryption PIN Key
          </label>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="4-12 characters/ numbers/ symbols of your choice"
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            {apiProvider} API Key
          </label>
          <input
            type="password"
            value={rawApiKeyInput}
            onChange={(e) => setRawApiKeyInput(e.target.value)}
            placeholder={getApiKeyPlaceholder(apiProvider)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {cryptoStatus && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${cryptoStatus.type === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
            cryptoStatus.type === "error" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
              "bg-blue-500/10 text-blue-500 border border-blue-500/20"
            }`}>
            {cryptoStatus.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
            <span>{cryptoStatus.msg}</span>
          </div>
        )}

        <button
          onClick={handleSaveApiKey}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Lock className="h-4 w-4" />
          Encrypt & Save
        </button>

        {encryptedPayload && (
          <div className="flex gap-2">
            <button
              onClick={handleDecryptApiKey}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
            >
              <Unlock className="h-3.5 w-3.5" />
              Decrypt with PIN
            </button>
          </div>
        )}
      </div>

      {/* Stored Key verification section */}
      {encryptedPayload && (
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <DatabaseIcon className="h-4 w-4 text-emerald-500" />
              Found Key Stored in IndexedDB
            </span>
            <button
              onClick={handleRemoveApiKey}
              className="h-10 px-3 flex items-center justify-center text-rose-500 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Remove Key"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>




          {decryptedKeyPreview && (
            <div className="p-3 rounded-xl border border-border bg-secondary/50 text-xs space-y-1">
              <span className="text-muted-foreground block text-[11px]">Provider: <strong className="text-foreground">{apiProvider}</strong></span>
              <span className="text-muted-foreground block text-[11px]">Decrypted Key preview:</span>
              <span className="font-mono text-emerald-500 break-all">{decryptedKeyPreview}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
