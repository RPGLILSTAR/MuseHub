import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Layout from '@/components/common/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import MusicPlayer from '@/components/music/MusicPlayer';
import GlobalKeyboardShortcuts from '@/components/music/GlobalKeyboardShortcuts';
import AiAssistant from '@/components/ai/AiAssistant';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Movies from '@/pages/Movies';
import MovieDetail from '@/pages/MovieDetail';
import MyMovies from '@/pages/MyMovies';
import MovieListDetail from '@/pages/MovieListDetail';
import Books from '@/pages/Books';
import BookDetail from '@/pages/BookDetail';
import MyBooks from '@/pages/MyBooks';
import BookListDetail from '@/pages/BookListDetail';
import Music from '@/pages/Music';
import PlaylistDetail from '@/pages/PlaylistDetail';
import PlaylistSquare from '@/pages/PlaylistSquare';
import MusicSearch from '@/pages/MusicSearch';
import MusicRankings from '@/pages/MusicRankings';
import ArtistDetail from '@/pages/ArtistDetail';
import AlbumDetail from '@/pages/AlbumDetail';
import MyMusic from '@/pages/MyMusic';
import UserProfile from '@/pages/UserProfile';
import SocialConnections from '@/pages/SocialConnections';
import Settings from '@/pages/Settings';
import AnnualReport from '@/pages/AnnualReport';
import Feed from '@/pages/Feed';
import Recommend from '@/pages/Recommend';

import Dashboard from '@/pages/admin/Dashboard';
import UserManagement from '@/pages/admin/UserManagement';
import ReviewManagement from '@/pages/admin/ReviewManagement';
import AnnouncementManagement from '@/pages/admin/AnnouncementManagement';
import RecommendPanel from '@/pages/admin/RecommendPanel';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/my" element={<MyMovies />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/movies/list/:id" element={<MovieListDetail />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/my" element={<MyBooks />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/books/list/:id" element={<BookListDetail />} />
            <Route path="/music" element={<Music />} />
            <Route path="/music/playlists" element={<PlaylistSquare />} />
            <Route path="/music/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/music/search" element={<MusicSearch />} />
            <Route path="/music/rankings" element={<MusicRankings />} />
            <Route path="/music/artist/:id" element={<ArtistDetail />} />
            <Route path="/music/album/:id" element={<AlbumDetail />} />
            <Route path="/music/my" element={<MyMusic />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/user/:id/followers" element={<SocialConnections view="followers" />} />
            <Route path="/user/:id/following" element={<SocialConnections view="following" />} />
            <Route path="/user/:id/annual" element={<AnnualReport />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="announcements" element={<AnnouncementManagement />} />
            <Route path="recommend" element={<RecommendPanel />} />
          </Route>
        </Routes>

        {/* Global music player — persists across ALL routes including admin */}
        <MusicPlayer />
        <GlobalKeyboardShortcuts />
        <AiAssistant />

        <Toaster position="top-center" toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
        }} />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
