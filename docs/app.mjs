// SPDX-License-Identifier: GPL-3.0-or-later
import { parseVideo, cleanFavorites, youtubeSearch } from './core.mjs';
const $ = id => document.getElementById(id);
const KEY = 'ytfree.web.favorites.v1';
let favorites = [];
let storageAvailable = true;
try { favorites = cleanFavorites(JSON.parse(localStorage.getItem(KEY) || '[]')); }
catch { storageAvailable = false; }
let current = null, player = null, playerReady = false, installPrompt = null;
let pageToken = '', lastQuery = '', searchController;
let savedPortrait = false, rotationExpanded = false, manuallyClosedLandscape = false;
const apiKey = String(window.YTF_CONFIG?.youtubeApiKey || '').trim();
const stage = $('video-stage');
const report = message => { $('status').textContent = message; };
const isLandscape = () => matchMedia('(orientation: landscape)').matches;
const isMobileScreen = () => matchMedia('(pointer: coarse)').matches;

function saveFavorites() {
  try { localStorage.setItem(KEY, JSON.stringify(favorites)); }
  catch { storageAvailable = false; report('Не удалось сохранить избранное: проверьте доступ к хранилищу браузера.'); }
  renderFavorites(); updateFavoriteButton();
}
function toggleFavorite(video) {
  const exists = favorites.some(item => item.id === video.id);
  if (!exists && favorites.length >= 500) { report('В избранном уже 500 видео. Удалите ненужное, чтобы добавить новое.'); return; }
  favorites = exists ? favorites.filter(item => item.id !== video.id)
    : cleanFavorites([video, ...favorites]);
  saveFavorites();
  if (storageAvailable) report(exists ? 'Видео удалено из избранного.' : 'Видео добавлено в избранное.');
}
function updateFavoriteButton() {
  const selected = current && favorites.some(item => item.id === current.id);
  $('favorite-current').setAttribute('aria-pressed', String(!!selected));
  $('favorite-current').textContent = selected ? '★ В избранном' : '☆ В избранное';
}
function switchTab(favorite) {
  $('watch-panel').hidden = favorite;
  $('favorites-panel').hidden = !favorite;
  for (const [id, active] of [['watch-tab', !favorite], ['favorites-tab', favorite]]) {
    $(id).classList.toggle('active', active); $(id).setAttribute('aria-pressed', String(active));
  }
  // Never let an invisible player continue in another tab of the app.
  if (favorite) { player?.pauseVideo?.(); leaveRotationView(); }
}
function videoCard(video) {
  const card = document.createElement('article'); card.className = 'video-card';
  const open = document.createElement('button'); open.className = 'open-video';
  open.setAttribute('aria-label', `Смотреть: ${video.title}`);
  const image = document.createElement('img'); image.className = 'thumb'; image.loading = 'lazy';
  image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; image.alt = '';
  const copy = document.createElement('div'); copy.className = 'card-copy';
  const title = document.createElement('h3'); title.textContent = video.title;
  const author = document.createElement('p'); author.textContent = video.author;
  copy.append(title, author); open.append(image, copy);
  open.addEventListener('click', () => openVideo(video));
  const star = document.createElement('button'); star.className = 'star';
  const selected = favorites.some(item => item.id === video.id);
  star.textContent = selected ? '★' : '☆'; star.setAttribute('aria-pressed', String(selected));
  star.setAttribute('aria-label', `${selected ? 'Удалить из избранного' : 'В избранное'}: ${video.title}`);
  star.addEventListener('click', () => { toggleFavorite(video); star.textContent = favorites.some(item => item.id === video.id) ? '★' : '☆'; star.setAttribute('aria-pressed', String(favorites.some(item => item.id === video.id))); });
  card.append(open, star); return card;
}
function renderFavorites() {
  $('favorites-count').textContent = String(favorites.length);
  $('favorites').replaceChildren(...favorites.map(videoCard));
  $('favorites-empty').hidden = favorites.length > 0;
}

let apiPromise;
function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('player-timeout')), 20000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(); };
    const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); script.remove(); apiPromise = null; reject(new Error('player-network')); };
    document.head.append(script);
  });
  return apiPromise;
}
function playerError(code) {
  const reasons = { 2: 'Некорректная ссылка на видео.', 5: 'Браузер не смог воспроизвести это видео.',
    100: 'Видео удалено, недоступно или скрыто автором.',
    101: 'Автор запретил просмотр на других сайтах.', 150: 'Автор запретил просмотр на других сайтах.',
    153: 'YouTube не смог подтвердить источник плеера. Попробуйте открыть сайт в Chrome.' };
  $('player-error').hidden = false;
  $('player-error').textContent = `${reasons[code] || 'Не удалось загрузить плеер YouTube. Проверьте интернет.'} Можно открыть ролик кнопкой «На YouTube».`;
  leaveRotationView();
}
function updateMetadata(video) {
  $('video-title').textContent = video.title; $('video-author').textContent = video.author;
  $('youtube-link').href = `https://www.youtube.com/watch?v=${video.id}`;
  updateFavoriteButton();
}
async function openVideo(video) {
  const parsed = parseVideo(video.id); if (!parsed) return;
  const id = parsed.id;
  current = { id, title: video.title || `Видео YouTube · ${id}`, author: video.author || 'YouTube' };
  const selected = current;
  switchTab(false); $('placeholder').hidden = true; $('player-mount').hidden = false;
  $('video-info').hidden = false; $('player-error').hidden = true;
  updateMetadata(current); report('Загружаем видео…');
  const hash = new URLSearchParams({ v: id });
  history.replaceState(null, '', `#${hash}`);
  $('viewer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  // This public metadata endpoint requires no API key; it is never proxied or cached offline.
  fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { signal: AbortSignal.timeout(10000) })
    .then(response => response.ok ? response.json() : null).then(data => {
      if (!data || current !== selected) return;
      current.title = String(data.title || current.title); current.author = String(data.author_name || 'YouTube');
      updateMetadata(current);
      const saved = favorites.find(item => item.id === id);
      if (saved) { Object.assign(saved, current); saveFavorites(); }
    }).catch(() => {});
  try {
    await loadPlayerApi(); if (current !== selected) return;
    if (player && playerReady) player.loadVideoById({ videoId: id, startSeconds: video.start || 0 });
    else {
      player?.destroy?.(); const mount = document.createElement('div'); mount.id = 'youtube-player';
      $('player-mount').replaceChildren(mount); playerReady = false;
      player = new YT.Player('youtube-player', {
        host: 'https://www.youtube-nocookie.com', videoId: id,
        playerVars: { autoplay: 0, playsinline: 1, fs: 1, origin: location.origin, start: video.start || 0 },
        events: {
          onReady: () => { playerReady = true; if (current?.id !== id) player.loadVideoById(current.id); report('Нажмите ▶ в плеере, чтобы начать просмотр.'); },
          onError: event => playerError(event.data),
          onStateChange: event => {
            if (event.data === YT.PlayerState.PLAYING) { report(''); savedPortrait = !isLandscape(); updateRotationView(); }
            if (event.data === YT.PlayerState.ENDED) leaveRotationView();
          }
        }
      });
    }
  } catch { playerError(); }
}
async function searchVideos(query, append = false) {
  if (!navigator.onLine) { report('Нет интернета. Избранное доступно, а поиск и видео — после подключения.'); return; }
  searchController?.abort(); searchController = new AbortController();
  $('search-submit').disabled = true; $('more-results').disabled = true;
  report('Ищем видео…');
  try {
    const parameters = new URLSearchParams({ key: apiKey, part: 'snippet', q: query,
      type: 'video', videoEmbeddable: 'true', maxResults: '12' });
    if (append && pageToken) parameters.set('pageToken', pageToken);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${parameters}`, { signal: searchController.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.errors?.[0]?.reason || 'api');
    const videos = cleanFavorites((data.items || []).map(item => ({ id: item.id?.videoId,
      title: decodeTitle(item.snippet?.title || ''), author: item.snippet?.channelTitle || 'YouTube' })));
    switchTab(false); $('results-panel').hidden = false;
    if (!append) $('results').replaceChildren();
    $('results').append(...videos.map(videoCard));
    pageToken = data.nextPageToken || ''; lastQuery = query;
    $('more-results').hidden = !pageToken;
    $('results-note').textContent = query;
    report(videos.length ? '' : 'По этому запросу ничего не найдено. Попробуйте другое название.');
    if (!append) $('results-panel').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    if (error.name !== 'AbortError') report(error.message === 'quotaExceeded'
      ? 'Дневной лимит поиска исчерпан. Используйте поиск на YouTube или вставьте ссылку.'
      : 'Поиск сейчас недоступен. Вставьте ссылку на видео или откройте YouTube.');
  } finally { $('search-submit').disabled = false; $('more-results').disabled = false; }
}
function decodeTitle(text) { const doc = new DOMParser().parseFromString(text, 'text/html'); return doc.body.textContent || text; }
$('search-form').addEventListener('submit', event => {
  event.preventDefault(); const query = $('query').value.trim(); if (!query) return;
  const video = parseVideo(query);
  if (video) { openVideo({ ...video }); return; }
  if (/^(https?:\/\/|www\.|youtu\.be\/)/i.test(query)) { report('Нужна ссылка на отдельное видео YouTube: watch, Shorts или прямой эфир.'); return; }
  if (apiKey) searchVideos(query);
  else {
    window.open(youtubeSearch(query), '_blank', 'noopener,noreferrer');
    report('Поиск открыт на YouTube. Скопируйте ссылку на найденное видео и вставьте её сюда.');
  }
});
$('more-results').addEventListener('click', () => searchVideos(lastQuery, true));
$('favorite-current').addEventListener('click', () => { if (current) toggleFavorite(current); });
$('watch-tab').addEventListener('click', () => switchTab(false));
$('favorites-tab').addEventListener('click', () => switchTab(true));
$('back-watch').addEventListener('click', () => { switchTab(false); $('query').focus(); });
$('focus-search').addEventListener('click', () => $('query').focus());
if (apiKey) $('search-hint').textContent = 'Поиск видео на YouTube или просмотр по прямой ссылке.';

function leaveRotationView() {
  stage.classList.remove('rotation-view'); document.body.classList.remove('rotation-active');
  $('exit-stage').hidden = true; rotationExpanded = false;
  if (document.fullscreenElement === stage) document.exitFullscreen?.().catch(() => {});
}
function updateRotationView() {
  if (!current || $('watch-panel').hidden || !isMobileScreen()) return;
  if (!isLandscape()) {
    savedPortrait = true; manuallyClosedLandscape = false;
    if (rotationExpanded) leaveRotationView();
    return;
  }
  if (manuallyClosedLandscape || !savedPortrait || player?.getPlayerState?.() !== 1) return;
  stage.classList.add('rotation-view'); document.body.classList.add('rotation-active');
  $('exit-stage').hidden = false; rotationExpanded = true;
  // A browser may reject fullscreen without a fresh user gesture. The in-page view remains usable.
  if (!document.fullscreenElement) stage.requestFullscreen?.().catch(() => {});
}
$('fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement === stage || stage.classList.contains('rotation-view')) { leaveRotationView(); return; }
  $('exit-stage').hidden = false;
  if (stage.requestFullscreen) { try { await stage.requestFullscreen(); return; } catch {} }
  stage.classList.add('rotation-view'); document.body.classList.add('rotation-active');
  $('exit-stage').hidden = false; rotationExpanded = true;
});
$('exit-stage').addEventListener('click', () => { manuallyClosedLandscape = true; leaveRotationView(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { manuallyClosedLandscape = true; leaveRotationView(); } });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && rotationExpanded) { manuallyClosedLandscape = true; leaveRotationView(); } });
screen.orientation?.addEventListener('change', updateRotationView);
window.addEventListener('orientationchange', () => setTimeout(updateRotationView, 200));
matchMedia('(orientation: landscape)').addEventListener('change', updateRotationView);

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => { if (event.target === dialog && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > dialog.clientWidth || event.offsetY > dialog.clientHeight)) dialog.close(); });
}
$('about').addEventListener('click', () => $('about-dialog').showModal());
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
$('install').addEventListener('click', async () => {
  if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; }
  else $('install-dialog').showModal();
});
window.addEventListener('appinstalled', () => { $('install').hidden = true; installPrompt = null; report('Приложение добавлено на главный экран.'); });
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) $('install').hidden = true;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
window.addEventListener('offline', () => report('Вы офлайн. Избранное сохранено; для просмотра нужен интернет.'));
window.addEventListener('online', () => report('Соединение восстановлено.'));
renderFavorites();
if (!navigator.onLine) report('Вы офлайн. Для просмотра видео нужен интернет.');
const initial = new URLSearchParams(location.hash.slice(1)).get('v');
if (initial && parseVideo(initial)) openVideo({ id: initial });
