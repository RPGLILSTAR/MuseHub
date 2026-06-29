import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('music playlist mutations require auth and owner checks', () => {
  const routes = read('src/routes/music.routes.ts');
  const controller = read('src/controllers/music.controller.ts');
  const service = read('src/services/dbMusic.service.ts');

  assert.match(routes, /post\('\/user\/playlists\/:id\/add', authRequired/);
  assert.match(routes, /post\('\/user\/playlists\/:id\/remove', authRequired/);
  assert.match(controller, /dbMusicService\.addToPlaylist\(userId, playlistId, parsedSongId\)/);
  assert.match(controller, /dbMusicService\.removeFromPlaylist\(userId, playlistId, parsedSongId\)/);
  assert.match(service, /WHERE id = \? AND user_id = \?/);
});

test('collection list mutations are scoped to the current user', () => {
  const routes = read('src/routes/collection.routes.ts');
  const service = read('src/services/dbCollection.service.ts');

  assert.match(routes, /dbCollectionService\.addToList\(req\.user!\.userId/);
  assert.match(routes, /dbCollectionService\.removeFromList\(req\.user!\.userId/);
  assert.match(service, /SELECT id FROM user_lists WHERE id = \? AND user_id = \?/);
});

test('production auth configuration does not silently use demo secrets', () => {
  const auth = read('src/middleware/auth.ts');
  const database = read('src/database/index.ts');

  assert.match(auth, /JWT_SECRET must be configured in production/);
  assert.match(database, /process\.env\.NODE_ENV !== 'production'/);
  assert.match(database, /CREATE_DEFAULT_ADMIN/);
});
