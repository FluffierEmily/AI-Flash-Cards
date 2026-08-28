import React, { useEffect } from "react"
import { X, Minimize2 } from "lucide-react"

export interface FullscreenGraphModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export function FullscreenGraphModal({
  isOpen,
  onClose,
  title,
  icon,
  actions,
  children
}: FullscreenGraphModalProps) {
  // Close on ESC key press & lock body scroll when open
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 md:p-8">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-6xl h-[88vh] max-h-[900px] flex flex-col bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border/60 bg-card shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground truncate">
                  {title}
                </h3>
              )}
            </div>
          </div>

          {/* Right Actions & Close Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
              title="Close Fullscreen (Esc)"
              aria-label="Close fullscreen modal"
            >
              <Minimize2 className="h-4.5 w-4.5 hidden sm:block" />
              <X className="h-5 w-5 sm:hidden" />
            </button>
          </div>
        </div>

        {/* Modal Graph Content Area */}
        <div className="flex-1 w-full min-h-0 p-4 sm:p-7 flex flex-col overflow-hidden bg-gradient-to-b from-card to-background/50">
          {children}
        </div>
      </div>
    </div>
  )
}
