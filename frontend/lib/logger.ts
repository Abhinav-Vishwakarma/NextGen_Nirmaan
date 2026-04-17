type LogLevel = 'info' | 'warn' | 'error'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  log(level: LogLevel, message: string, meta?: unknown): void {
    if (!isDev) return

    if (level === 'error') {
      console.error(message, meta)
      return
    }

    if (level === 'warn') {
      console.warn(message, meta)
      return
    }

    console.log(message, meta)
  },
}
