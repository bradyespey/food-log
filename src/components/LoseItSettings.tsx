import React, { useState, useEffect } from 'react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
        <button
          onClick={closeSettings}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Lose It! Session</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Your session cookie authenticates food logging. It lasts 7–14 days depending on activity.
        </p>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-5">
          {status === 'ok' || hasExisting ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" /> Cookie saved
            </span>
          ) : status === 'expired' ? (
            <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" /> Session expired — paste a fresh cookie below
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4" /> No cookie saved yet
            </span>
          )}
        </div>

        {/* How-to */}
        <details className="mb-4 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 select-none">
            How to get your cookie
          </summary>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>
              Log in to{' '}
              <a href="https://www.loseit.com" target="_blank" rel="noreferrer"
                className="text-blue-500 underline inline-flex items-center gap-0.5">
                loseit.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Open DevTools (F12) → Network tab</li>
            <li>Click any request to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/web/service</code></li>
            <li>In Request Headers, find <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Cookie:</code></li>
            <li>Copy the entire value and paste it below</li>
          </ol>
        </details>

        {/* Cookie input */}
        <textarea
          value={cookie}
          onChange={e => setCookie(e.target.value)}
          placeholder="Paste your Cookie: header value here…"
          rows={4}
          className="w-full text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg p-3
                     bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        {saved  && <p className="text-sm text-green-600 dark:text-green-400 mb-3">Cookie saved! Food logging will use it immediately.</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={closeSettings}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !cookie.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Cookie'}
          </button>
        </div>
      </div>
    </div>
  )
}
