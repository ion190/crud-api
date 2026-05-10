/** Serialize any value to a JSON string for SQLite storage */
export const toJson = (v: unknown): string => JSON.stringify(v ?? null)

/** Deserialize a JSON string from SQLite, returns null if falsy */
export const fromJson = <T>(v: string | null | undefined): T | null =>
  v ? (JSON.parse(v) as T) : null