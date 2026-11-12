const BASEHUB_ASSET_HOST = 'assets.basehub.com';

/**
 * Resized, compressed variant of a BaseHub asset via its image CDN.
 * Defaults to AVIF; use `format: 'jpeg'` for social-share images, which some
 * scrapers can't decode as AVIF. Non-BaseHub URLs are returned unchanged.
 */
export function cmsImage(
  url: string,
  width: number,
  { quality = 75, format = 'avif' }: { quality?: number; format?: 'avif' | 'jpeg' } = {},
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== BASEHUB_ASSET_HOST) return url;

  parsed.searchParams.set('width', String(width));
  parsed.searchParams.set('quality', String(quality));
  parsed.searchParams.set('format', format);
  return parsed.href;
}

/** `srcset` value for a BaseHub asset at the given widths; empty for other URLs. */
export function cmsImageSrcset(url: string, widths: number[]): string | undefined {
  if (cmsImage(url, widths[0]) === url) return undefined;
  return widths.map((width) => `${cmsImage(url, width)} ${width}w`).join(', ');
}
