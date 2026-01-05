export function normalizeExternalUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // If user pastes "discord.gg/..." or "www...", browsers treat it as relative.
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  if (withProtocol.length > 2048) return null;

  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
