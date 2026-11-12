import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideo, cleanFavorites, youtubeSearch } from '../docs/core.mjs';
const id = 'aqz-KE-bpKQ';
test('recognizes watch, share, shorts, live, embed and mobile links', () => {
  for (const url of [id, `https://www.youtube.com/watch?v=${id}`, `https://youtu.be/${id}?si=abc`,
    `https://m.youtube.com/watch?v=${id}`, `youtube.com/shorts/${id}`, `https://youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`]) assert.equal(parseVideo(url)?.id, id, url);
});
test('preserves timestamps without allowing unbounded values', () => {
  assert.equal(parseVideo(`https://youtu.be/${id}?t=1h2m3s`).start, 3723);
  assert.equal(parseVideo(`https://youtube.com/watch?v=${id}&t=90`).start, 90);
  assert.equal(parseVideo(`https://youtu.be/${id}?t=9999999999`).start, 604800);
});
test('rejects unrelated hosts, malicious protocols and channel/playlist links', () => {
  for (const url of [`https://youtube.com.evil.test/watch?v=${id}`, `https://evil.test/${id}`,
    `javascript:alert(1)`, `https://youtube.com/playlist?list=abc`, 'https://youtube.com/@channel',
    `ftp://youtube.com/watch?v=${id}`, 'hello']) assert.equal(parseVideo(url), null, url);
});
test('favorites survive corrupt data and deduplicate by video ID', () => {
  assert.deepEqual(cleanFavorites({}), []);
  const list = cleanFavorites([null, {id:'x'}, {id, title:'A'}, {id, title:'B'}]);
  assert.equal(list.length, 1); assert.equal(list[0].title, 'A');
  assert.equal(cleanFavorites([{id, title:'x'.repeat(999)}])[0].title.length, 300);
});
test('search encodes user input in an official YouTube URL', () => {
  assert.equal(new URL(youtubeSearch('  море & дождь  ')).searchParams.get('search_query'), 'море & дождь');
});
