import { useRef, useEffect, useState } from 'react'

interface LogDisplayProps {
  logs: string[]
}

export function LogDisplay({ logs }: LogDisplayProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  useEffect(() => {
    if (shouldAutoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, shouldAutoScroll])

  const handleScroll = () => {
    if (logRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setShouldAutoScroll(isAtBottom)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{logs.length} log entries</span>
        {!shouldAutoScroll && (
          <span className="text-xs">Auto-scroll paused (scroll to bottom to resume)</span>
        )}
      </div>
      <div
        ref={logRef}
        onScroll={handleScroll}
        className="bg-black text-green-400 font-mono text-sm p-4 rounded-md h-64 overflow-y-auto"
        style={{ fontFamily: 'monospace' }}
      >
        {logs.map((log, index) => (
          <div key={index} className="whitespace-nowrap text-xs">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
