// SPDX-License-Identifier: GPL-3.0-or-later
export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export function parseVideo(input) {
  const text = String(input || '').trim();
  if (VIDEO_ID.test(text)) return { id: text, start: 0 };
  let url;
  try { url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`); }
  catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
  let id;
  if (['youtu.be', 'www.youtu.be'].includes(host)) id = url.pathname.split('/')[1];
  else if (youtube.includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    id = parts[0] === 'watch' ? url.searchParams.get('v')
      : ['shorts', 'live', 'embed'].includes(parts[0]) ? parts[1] : null;
  } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed') id = parts[1];
  }
  if (!VIDEO_ID.test(id || '')) return null;
  const stamp = url.searchParams.get('t') || url.searchParams.get('start') || '';
  let seconds = /^\d+$/.test(stamp) ? Number(stamp) : 0;
  const time = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(stamp);
  if (time && stamp) seconds = Number(time[1] || 0) * 3600
    + Number(time[2] || 0) * 60 + Number(time[3] || 0);
  return { id, start: Math.min(seconds, 604800) };
}
export function cleanFavorites(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && VIDEO_ID.test(item.id || '')
    && !seen.has(item.id) && seen.add(item.id)).slice(0, 500)
    .map(item => ({ id: item.id, title: String(item.title || `Видео ${item.id}`).slice(0, 300),
      author: String(item.author || 'YouTube').slice(0, 160) }));
}
export function youtubeSearch(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}
