import { Router } from 'express';
import { musicController } from '../controllers/music.controller';
import { optionalAuth, authRequired } from '../middleware/auth';

const router = Router();
const c = musicController;
const h = (fn: Function) => (req: any, res: any, next: any) => fn.call(c, req, res, next);

router.get('/search', h(c.search));
router.get('/hot-search', h(c.getHotSearch));
router.get('/search/suggest', h(c.getSearchSuggestions));
router.get('/banners', h(c.getBanners));
router.get('/personalized', h(c.getPersonalized));
router.get('/playlists/top', h(c.getTopPlaylists));
router.get('/playlists/highquality', h(c.getHighQualityPlaylists));
router.get('/playlists/categories', h(c.getPlaylistCategories));
router.get('/playlists/:id', h(c.getPlaylistDetail));
router.get('/songs/top', h(c.getTopSongs));
router.get('/songs/new', h(c.getNewSongs));
router.get('/songs/url/:id', h(c.getSongUrl));
router.get('/songs/lyric/:id', h(c.getLyric));
router.get('/songs/comments/:id', h(c.getSongComments));
router.get('/songs/site-comments/:songId', h(c.getSongSiteComments));
router.get('/artists/top', h(c.getTopArtists));
router.get('/artists/:id', h(c.getArtistDetail));
router.get('/artists/:id/albums', h(c.getArtistAlbums));
router.get('/albums/new', h(c.getNewAlbums));
router.get('/albums/:id', h(c.getAlbumDetail));
router.get('/rankings', h(c.getAllRankings));
router.get('/rankings/:id', h(c.getRankingDetail));

router.use(optionalAuth);
router.post('/songs/site-comments/:songId', authRequired, h(c.postSongSiteComment));
router.delete('/songs/site-comments/:commentId', authRequired, h(c.deleteSongSiteComment));
router.post('/user/like', h(c.toggleLike));
router.get('/user/liked', h(c.getLikedSongs));
router.get('/user/liked/status', h(c.getLikedStatus));
router.post('/user/history', h(c.addToHistory));
router.get('/user/history', h(c.getPlayHistory));
router.get('/user/playlists', h(c.getUserPlaylists));
router.get('/user/playlists/:id', h(c.getUserPlaylistDetail));
router.post('/user/playlists', h(c.createPlaylist));
router.delete('/user/playlists/:id', h(c.deletePlaylist));
router.post('/user/playlists/:id/add', authRequired, h(c.addToUserPlaylist));
router.post('/user/playlists/:id/remove', authRequired, h(c.removeFromUserPlaylist));

export default router;
