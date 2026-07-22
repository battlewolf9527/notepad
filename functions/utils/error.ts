export class Logger {
  static info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, meta)
  }

  static error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, { error, ...meta })
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta)
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, meta)
  }
}
