export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getErrorMessage(err: unknown, defaultMessage: string): string {
  return err instanceof Error ? err.message : defaultMessage
}
