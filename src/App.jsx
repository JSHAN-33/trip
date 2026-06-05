import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTripStore, getTripNickname, setTripNickname, addMyTrip, checkTripExists } from './utils/store';
import { applyTheme } from './utils/themes';
import { getCountry } from './utils/countries';
import { UserCircle, LogOut } from 'lucide-react';
import BottomNav from './components/BottomNav';
import NicknameModal from './components/NicknameModal';
import FloatingCalculator from './components/FloatingCalculator';
import Home from './pages/Home';
import CreateTrip from './pages/CreateTrip';
import Itinerary from './pages/Itinerary';
import Info from './pages/Info';
import Luggage from './pages/Luggage';
import MustBuy from './pages/MustBuy';
import Split from './pages/Split';

function TripLayout() {
  const { tripId } = useParams();
  const [data, update] = useTripStore(tripId);
  const [showMenu, setShowMenu] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [nickname, setNickname] = useState(() => getTripNickname(tripId));

  // Auto-login via URL parameter ?user=NAME
  useEffect(() => {
    const urlUser = searchParams.get('user');
    if (urlUser && urlUser.trim()) {
      const trimmed = urlUser.trim();
      setTripNickname(tripId, trimmed);
      setNickname(trimmed);
      searchParams.delete('user');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Apply theme when trip data loads
  useEffect(() => {
    if (data?.themeId) applyTheme(data.themeId);
  }, [data?.themeId]);

  // Register member when nickname is set
  useEffect(() => {
    if (!nickname || !data) return;
    if (!data.members.includes(nickname)) {
      update(d => ({
        ...d,
        members: [...d.members, nickname],
        luggage: { ...d.luggage, [nickname]: d.luggage[nickname] || [] },
        mustBuy: { ...d.mustBuy, personal: { ...d.mustBuy.personal, [nickname]: d.mustBuy.personal[nickname] || [] } },
        expenses: { ...d.expenses, personal: { ...d.expenses.personal, [nickname]: d.expenses.personal[nickname] || [] } },
      }));
    }
    // Save to my trips
    const country = getCountry(data.country);
    addMyTrip({ id: tripId, name: data.name, country: data.country, flag: country.flag, nickname });
  }, [nickname, data?.members?.length]);

  // Loading
  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-primary-light">Loading...</p>
        </div>
      </div>
    );
  }

  // Need nickname
  if (!nickname) {
    return (
      <NicknameModal
        tripName={data.name}
        onSubmit={(name) => {
          setTripNickname(tripId, name);
          setNickname(name);
        }}
      />
    );
  }

  const handleSwitchUser = () => {
    localStorage.removeItem(`trip-user-${tripId}`);
    setNickname(null);
    setShowMenu(false);
  };

  return (
    <div className="pb-16">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between">
        <a href="/" className="text-xs font-bold text-primary-dark tracking-wider">{data.name}</a>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1.5 text-primary hover:text-primary-dark transition"
          >
            <UserCircle size={18} />
            <span className="text-sm font-medium">{nickname}</span>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 z-50 min-w-[140px]">
                <button
                  onClick={handleSwitchUser}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-dark hover:bg-surface transition"
                >
                  <LogOut size={14} />
                  切換使用者
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Routes>
        <Route path="itinerary" element={<Itinerary tripId={tripId} nickname={nickname} />} />
        <Route path="info" element={<Info tripId={tripId} />} />
        <Route path="luggage" element={<Luggage tripId={tripId} nickname={nickname} />} />
        <Route path="must-buy" element={<MustBuy tripId={tripId} nickname={nickname} />} />
        <Route path="split" element={<Split tripId={tripId} nickname={nickname} />} />
        <Route path="*" element={<Navigate to="itinerary" replace />} />
      </Routes>

      <FloatingCalculator data={data} />
      <BottomNav tripId={tripId} />
    </div>
  );
}

// Join redirect: /join/:tripId
function JoinRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/trip/${tripId}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateTrip />} />
        <Route path="/join/:tripId" element={<JoinRedirect />} />
        <Route path="/trip/:tripId/*" element={<TripLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
