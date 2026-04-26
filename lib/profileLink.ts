/** Normalized handle without @ for URLs. */
export function profileHandleFromUsername(username: string): string {
  const t = username.trim();
  return t.startsWith("@") ? t.slice(1) : t;
}

/** Mock share link — same host style as group invites (`konekta.link/g/...`). */
export function profileShareUrl(username: string): string {
  const handle = profileHandleFromUsername(username);
  return `https://konekta.link/u/${encodeURIComponent(handle || "user")}`;
}
