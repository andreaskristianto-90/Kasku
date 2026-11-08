import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [pesan, setPesan] = useState(null)
  const timer = useRef()

  const tampilkan = useCallback((teks, jenis = 'sukses') => {
    clearTimeout(timer.current)
    setPesan({ teks, jenis, id: Date.now() })
    timer.current = setTimeout(() => setPesan(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={tampilkan}>
      {children}
      <div className="toast-wadah" role="status" aria-live="polite">
        {pesan && <div key={pesan.id} className={`toast toast-${pesan.jenis}`}>{pesan.teks}</div>}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
