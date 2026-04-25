import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useLoseIt } from '../contexts/LoseItContext'

export function LoseItSettings() {
  const { status, saveCookie, loadCookie, closeSettings } = useLoseIt()
  const [cookie, setCookie]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved,  setSaved]      = useState(false)
  const [error,  setError]      = useState('')
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    loadCookie().then(c => setHasExisting(!!c))
  }, [loadCookie])

  const handleSave = async () => {
    const trimmed = cookie.trim()
    if (!trimmed) { setError('Paste your Lose It! cookie first.'); return }
    // Basic sanity check — must look like a cookie string
    if (!trimmed.includes('=') || trimmed.length < 50) {
      setError('That doesn\'t look like a valid cookie. Copy the entire Cookie: header value from DevTools.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveCookie(trimmed)
      setSaved(true)
      setCookie('')
      setHasExisting(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="surface relative w-full max-w-lg rounded-lg p-5 sm:p-6">
        <button
          onClick={closeSettings}
          className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs font-semibold uppercase text-muted-foreground">Profile settings</p>
        <h2 className="font-display mt-1 text-3xl leading-tight text-foreground">Lose It! Session</h2>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          Your session cookie authenticates food logging. It lasts 7–14 days depending on activity.
        </p>

        {/* Status indicator */}
        <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-3">
          {status === 'ok' || hasExisting ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <CheckCircle className="w-4 h-4" /> Cookie saved
            </span>
          ) : status === 'expired' ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <AlertCircle className="w-4 h-4" /> Session expired — paste a fresh cookie below
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-accent">
              <AlertCircle className="w-4 h-4" /> No cookie saved yet
            </span>
          )}
        </div>

        {/* How-to */}
        <details className="mb-4 rounded-lg border border-border bg-card/70 p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground select-none">
            How to get your cookie
          </summary>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>
              Log in to{' '}
              <a href="https://www.loseit.com" target="_blank" rel="noreferrer"
                className="text-primary underline inline-flex items-center gap-0.5">
                loseit.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Open DevTools (F12) → Network tab</li>
            <li>Click any request to <code className="bg-secondary px-1 rounded">/web/service</code></li>
            <li>In Request Headers, find <code className="bg-secondary px-1 rounded">Cookie:</code></li>
            <li>Copy the entire value and paste it below</li>
          </ol>
        </details>

        {/* Cookie input */}
        <textarea
          value={cookie}
          onChange={e => setCookie(e.target.value)}
          placeholder="Paste your Cookie: header value here…"
          rows={4}
          className="mb-3 w-full resize-none rounded-lg border border-border bg-card/80 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {saved  && <p className="text-sm text-primary mb-3">Cookie saved! Food logging will use it immediately.</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={closeSettings}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !cookie.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Cookie'}
          </button>
        </div>
      </div>
    </div>
  )
}
