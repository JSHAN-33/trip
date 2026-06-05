import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Plane, MapPin } from 'lucide-react';
import { getMyTrips, removeMyTrip } from '../utils/store';
import { themes } from '../utils/themes';

export default function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(() => getMyTrips());
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  function handleDelete(e, tripId) {
    e.stopPropagation();
    if (deletingId === tripId) {
      removeMyTrip(tripId);
      setTrips(getMyTrips());
      setDeletingId(null);
    } else {
      setDeletingId(tripId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  }

  function handleJoin() {
    const code = joinCode.trim();
    if (code) {
      navigate(`/trip/${code}`);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center gap-2 mb-1">
          <Plane className="w-5 h-5 text-gray-400" />
          <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">Travel Companion</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Trip</h1>
      </div>

      {/* Trip List */}
      <div className="px-6 pb-32">
        {trips.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-lg mb-1">還沒有旅行</p>
            <p className="text-gray-300 text-sm">建立一個吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
              My Trips ({trips.length})
            </p>
            {trips.map((trip) => {
              const theme = themes[trip.themeId] || themes.cocoaBlue;
              return (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                  className="relative bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {/* Theme color dot */}
                  <div
                    className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                  />

                  {/* Flag */}
                  <div className="text-3xl flex-shrink-0">{trip.flag || '🌍'}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 font-semibold text-base truncate pr-6">{trip.name}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{trip.nickname || '我'}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(e, trip.id)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      deletingId === trip.id
                        ? 'bg-red-50 text-red-500'
                        : 'text-gray-300 hover:text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/create')}
            className="flex-1 bg-gray-800 text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <Plus className="w-4 h-4" />
            建立新旅行
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3.5 font-medium active:scale-[0.97] transition-transform"
          >
            加入旅行
          </button>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end justify-center z-50"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-gray-800 mb-4">加入旅行</h3>
            <p className="text-sm text-gray-400 mb-3">輸入旅行代碼來加入</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="貼上旅行代碼..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-100 text-gray-500 rounded-xl py-3 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleJoin}
                disabled={!joinCode.trim()}
                className="flex-1 bg-gray-800 text-white rounded-xl py-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
