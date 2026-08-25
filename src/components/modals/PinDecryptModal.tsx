import React, { useState, useEffect } from "react"
import { Key, X, Lock, AlertCircle, Check, RefreshCw } from "lucide-react"
import { encryptApiKey, decryptApiKey, type EncryptedPayload } from "../../lib/crypto"
import { saveEncryptedApiKey, getEncryptedApiKey } from "../../lib/db"

export interface PinDecryptModalProps {
  isOpen: boolean
  onClose: () => void
  provider: string
  onKeySuccess: (apiKey: string) => void
  setDecryptedKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function PinDecryptModal({
  isOpen,
  onClose,
  provider,
  onKeySuccess,
  setDecryptedKeys
}: PinDecryptModalProps) {
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null)
  const [pinInput, setPinInput] = useState("")
  const [byokRawKey, setByokRawKey] = useState("")
  const [saveKeyToDevice, setSaveKeyToDevice] = useState(false)
  const [pinStatus, setPinStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load encrypted API Key from IndexedDB/LocalStorage when provider/modal changes
  useEffect(() => {
    if (isOpen && provider) {
      setPinStatus(null)
      setPinInput("")
      setByokRawKey("")
      setSaveKeyToDevice(false)
      setEncryptedPayload(null)

      getEncryptedApiKey(provider)
        .then((payload) => {
          setEncryptedPayload(payload)
        })
        .catch((err) => {
          console.error("Error reading encryption from localstorage", err)
          setEncryptedPayload(null)
        })
    }
  }, [isOpen, provider])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsProcessing(true)
    setPinStatus({ type: "info", msg: "Processing..." })

    try {
      if (encryptedPayload) {
        // PIN Decrypt Mode
        if (!pinInput.trim()) {
          setPinStatus({ type: "error", msg: "Please enter your PIN." })
          setIsProcessing(false)
          return
        }

        const decrypted = await decryptApiKey(encryptedPayload, pinInput.trim())

        // Decrypted successfully!
        setDecryptedKeys((prev) => ({ ...prev, [provider.toLowerCase()]: decrypted }))
        setPinStatus({ type: "success", msg: "Decrypted successfully!" })
        onKeySuccess(decrypted)
        onClose()
      } else {
        // Raw BYOK Mode
        if (!byokRawKey.trim()) {
          setPinStatus({ type: "error", msg: "Please enter your API Key." })
          setIsProcessing(false)
          return
        }

        const apiKeyToUse = byokRawKey.trim()

        if (saveKeyToDevice) {
          if (!pinInput.trim()) {
            setPinStatus({ type: "error", msg: "Please provide a PIN to encrypt and save your key." })
            setIsProcessing(false)
            return
          }
          const payload = await encryptApiKey(apiKeyToUse, pinInput.trim())
          await saveEncryptedApiKey(provider, payload)
        }

        setDecryptedKeys((prev) => ({ ...prev, [provider.toLowerCase()]: apiKeyToUse }))
        setPinStatus({ type: "success", msg: "Key verified!" })
        onKeySuccess(apiKeyToUse)
        onClose()
      }
    } catch (err: any) {
      console.error(err)
      setPinStatus({ type: "error", msg: err.message || "Incorrect PIN or decryption error." })
    } finally {
      setIsProcessing(false)
    }
  }

  const hasEncryptedKeyInLocalStorage = () => {
    try {
      const savedKeys = localStorage.getItem("encrypted_api_keys")
      if (!savedKeys) return false
      const parsed = JSON.parse(savedKeys)
      return !!parsed[provider.toLowerCase()]
    } catch {
      return false
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isProcessing) onClose()
        }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal dialog */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Key Required
          </h3>
          <button
            onClick={() => {
              if (!isProcessing) onClose()
            }}
            disabled={isProcessing}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {encryptedPayload
            ? `Enter your PIN to decrypt your saved ${provider} key for this session.`
            : `Enter a temporary raw ${provider} API key below to use for this session.`}
        </p>

        <div className="space-y-4">
          {encryptedPayload ? (
            /* Decrypt Saved Key Mode */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Enter Decryption PIN
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter the PIN you used to encrypt the key"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  disabled={isProcessing}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setEncryptedPayload(null)
                  setPinStatus(null)
                }}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
                disabled={isProcessing}
              >
                Or enter a temporary API key instead
              </button>
            </div>
          ) : (
            /* Raw BYOK Mode */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  {provider} API Key
                </label>
                <input
                  type="password"
                  value={byokRawKey}
                  onChange={(e) => setByokRawKey(e.target.value)}
                  placeholder="Paste key here"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="save-key-checkbox-hint"
                  checked={saveKeyToDevice}
                  onChange={(e) => setSaveKeyToDevice(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  disabled={isProcessing}
                />
                <label htmlFor="save-key-checkbox-hint" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Save securely on this device (requires PIN)
                </label>
              </div>

              {saveKeyToDevice && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Create Decryption PIN
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Choose a PIN (e.g. 1234)"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {/* If there is an encrypted payload stored, let them toggle back */}
              {hasEncryptedKeyInLocalStorage() && (
                <button
                  type="button"
                  onClick={async () => {
                    const payload = await getEncryptedApiKey(provider)
                    setEncryptedPayload(payload)
                    setPinStatus(null)
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer block"
                  disabled={isProcessing}
                >
                  Use saved encrypted key instead
                </button>
              )}
            </div>
          )}

          {pinStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${pinStatus.type === "success"
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : pinStatus.type === "error"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
            >
              {pinStatus.type === "error" ? (
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              ) : pinStatus.type === "success" ? (
                <Check className="h-4.5 w-4.5 shrink-0" />
              ) : (
                <RefreshCw className="h-4.5 w-4.5 animate-spin shrink-0" />
              )}
              <span>{pinStatus.msg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-10 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? "Processing..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
