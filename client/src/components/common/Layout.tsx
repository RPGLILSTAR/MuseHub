import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { usePlayerStore } from '@/store/playerStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <ScrollToTop />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-muse-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className={`relative z-10 ${currentTrack ? 'pb-28' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
