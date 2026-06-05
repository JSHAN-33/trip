import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Plane, MapPin, Check, Copy, Share2, X } from 'lucide-react';
import { getMyTrips, removeMyTrip, createTrip, uid, addMyTrip, setTripNickname } from '../utils/store';
import { themes, themeList } from '../utils/themes';
import { countries } from '../utils/countries';

const STEPS = ['theme', 'details'];

export default function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(() => getMyTrips());
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Create flow state
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState('cocoaBlue');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('KR');
  const [days, setDays] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Invite modal
  const [inviteModal, setInviteModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const country = countries.find(c => c.code === selectedCountry) || countries[0];

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
    if (code) navigate(`/trip/${code}`);
  }

  function resetCreate() {
    setShowCreate(false);
    setStep('theme');
    setSelectedTheme('cocoaBlue');
    setName('');
    setNickname('');
    setSelectedCountry('KR');
    setDays(5);
    setSubmitting(false);
  }

  async function handleCreateSubmit() {
    if (!name.trim() || !nickname.trim() || submitting) return;
    setSubmitting(true);
    try {
      const tripId = uid();
      await createTrip(tripId, {
        name: name.trim(),
        country: country.code,
        currency: country.currency,
        currencySymbol: country.symbol,
        exchangeRate: country.defaultRate,
        themeId: selectedTheme,
        days,
        nights: Math.max(days - 1, 0),
      });
      setTripNickname(tripId, nickname.trim());
      addMyTrip({
        id: tripId,
        name: name.trim(),
        country: country.code,
        flag: country.flag,
        nickname: nickname.trim(),
        themeId: selectedTheme,
      });
      setTrips(getMyTrips());
      resetCreate();
      // Show invite modal
      const baseUrl = window.location.origin;
      setInviteModal({ tripId, tripName: name.trim(), url: `${baseUrl}/join/${tripId}`, code: tripId });
    } catch (err) {
      console.error('Failed to create trip:', err);
      setSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!inviteModal) return;
    navigator.clipboard.writeText(inviteModal.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare() {
    if (!inviteModal) return;
    if (navigator.share) {
      navigator.share({
        title: `加入旅行 - ${inviteModal.tripName}`,
        text: `來加入我的旅行「${inviteModal.tripName}」！`,
        url: inviteModal.url,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  }

  function goToTrip() {
    if (!inviteModal) return;
    const tripId = inviteModal.tripId;
    setInviteModal(null);
    navigate(`/trip/${tripId}`);
  }

  const currentTheme = themes[selectedTheme];

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
            {trips.map(trip => {
              const theme = themes[trip.themeId] || themes.cocoaBlue;
              return (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                  className="relative bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div
                    className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                  />
                  <div className="text-3xl flex-shrink-0">{trip.flag || '\ud83c\udf0d'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 font-semibold text-base truncate pr-6">{trip.name}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{trip.nickname || '我'}</p>
                  </div>
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
            onClick={() => setShowCreate(true)}
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

      {/* ═══ Create Trip Flow ═══ */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={resetCreate}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3" />

            {/* Step 1: Theme Selection */}
            {step === 'theme' && (
              <div className="px-6 pt-5 pb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">選擇主題色</h3>
                <p className="text-sm text-gray-400 mb-6">每趟旅行有專屬的色彩風格</p>

                <div className="grid grid-cols-5 gap-4 mb-8">
                  {themeList.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`relative w-14 h-14 rounded-full border-[3px] transition-all ${
                          selectedTheme === t.id ? 'scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${t.primary} 50%, ${t.accent} 50%)`,
                          borderColor: selectedTheme === t.id ? t.primary : 'transparent',
                        }}
                      >
                        {selectedTheme === t.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium ${
                        selectedTheme === t.id ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {t.nameZh}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Theme preview strip */}
                <div className="rounded-2xl overflow-hidden mb-6">
                  <div className="h-16 flex">
                    <div className="flex-1" style={{ backgroundColor: currentTheme.primary }} />
                    <div className="flex-1" style={{ backgroundColor: currentTheme.accent }} />
                  </div>
                  <div className="h-8" style={{ backgroundColor: currentTheme.accentLight }} />
                </div>

                <button
                  onClick={() => setStep('details')}
                  className="w-full py-3.5 rounded-xl text-white font-medium transition-all active:scale-[0.97]"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  下一步
                </button>
              </div>
            )}

            {/* Step 2: Trip Details */}
            {step === 'details' && (
              <div className="px-6 pt-5 pb-8 overflow-y-auto" style={{ maxHeight: '80vh' }}>
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setStep('theme')}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="text-xl font-bold text-gray-800">旅行資訊</h3>
                </div>

                <div className="space-y-5">
                  {/* Trip name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">旅行名稱</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="例：東京五日遊"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">你的暱稱</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="旅伴怎麼稱呼你？"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目的地</label>
                    <div className="grid grid-cols-4 gap-2">
                      {countries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedCountry(c.code)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all ${
                            selectedCountry === c.code
                              ? 'border-gray-800 bg-gray-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-xl">{c.flag}</span>
                          <span className={`text-[11px] font-medium ${
                            selectedCountry === c.code ? 'text-gray-800' : 'text-gray-500'
                          }`}>{c.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      匯率：1 {country.symbol} = NT$ {country.defaultRate < 1 ? country.defaultRate : country.defaultRate.toFixed(1)}
                    </p>
                  </div>

                  {/* Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">天數</label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setDays(Math.max(1, days - 1))}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium hover:bg-gray-50"
                      >-</button>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-gray-800">{days}</span>
                        <span className="text-sm text-gray-400 ml-1">天</span>
                        <span className="text-sm text-gray-300 mx-1">/</span>
                        <span className="text-sm text-gray-400">{Math.max(days - 1, 0)} 夜</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDays(Math.min(30, days + 1))}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium hover:bg-gray-50"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleCreateSubmit}
                  disabled={!name.trim() || !nickname.trim() || submitting}
                  className="w-full mt-6 py-3.5 rounded-xl text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  {submitting ? '建立中...' : '建立旅行'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Invite Modal ═══ */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={goToTrip}>
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">旅行已建立！</h3>
            <p className="text-sm text-gray-400 mb-5">分享連結邀請旅伴加入</p>

            {/* Invite link box */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">邀請連結</p>
              <p className="text-sm text-gray-700 font-mono break-all">{inviteModal.url}</p>
            </div>

            {/* Trip code */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-gray-400 mb-1">旅行代碼</p>
              <p className="text-lg text-gray-800 font-bold font-mono tracking-wider">{inviteModal.code}</p>
            </div>

            <div className="flex gap-3 mb-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium transition-colors active:scale-[0.97]"
              >
                <Copy className="w-4 h-4" />
                {copied ? '已複製！' : '複製連結'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 text-white font-medium transition-colors active:scale-[0.97]"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>

            <button
              onClick={goToTrip}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              進入旅行 →
            </button>
          </div>
        </div>
      )}

      {/* ═══ Join Modal ═══ */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50" onClick={() => setShowJoinModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-gray-800 mb-4">加入旅行</h3>
            <p className="text-sm text-gray-400 mb-3">輸入旅行代碼或貼上邀請連結</p>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="貼上旅行代碼..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
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
