import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { createTrip, uid, addMyTrip, setTripNickname } from '../utils/store';
import { themeList } from '../utils/themes';
import { countries } from '../utils/countries';

export default function CreateTrip() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('KR');
  const [days, setDays] = useState(5);
  const [selectedTheme, setSelectedTheme] = useState('cocoaBlue');
  const [submitting, setSubmitting] = useState(false);

  const country = countries.find((c) => c.code === selectedCountry) || countries[0];

  async function handleSubmit(e) {
    e.preventDefault();
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
        nights: days - 1,
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
      navigate(`/trip/${tripId}`);
    } catch (err) {
      console.error('Failed to create trip:', err);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">建立新旅行</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 pb-32 space-y-7">
        {/* Trip Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">旅行名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：東京五日遊"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">你的暱稱</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="旅伴怎麼稱呼你？"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">目的地</label>
          <div className="grid grid-cols-3 gap-2">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCountry(c.code)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  selectedCountry === c.code
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{c.flag}</span>
                <span className={`text-xs font-medium ${
                  selectedCountry === c.code ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            匯率：1 {country.symbol} = NT$ {country.defaultRate < 1 ? country.defaultRate : country.defaultRate.toFixed(1)}
          </p>
        </div>

        {/* Number of Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">天數</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDays(Math.max(1, days - 1))}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-800">{days}</span>
              <span className="text-sm text-gray-400 ml-1">天</span>
              <span className="text-sm text-gray-300 mx-1">/</span>
              <span className="text-sm text-gray-400">{Math.max(days - 1, 0)} 夜</span>
            </div>
            <button
              type="button"
              onClick={() => setDays(Math.min(30, days + 1))}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Theme Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">主題色</label>
          <div className="grid grid-cols-5 gap-3">
            {themeList.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTheme(t.id)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                    selectedTheme === t.id ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.primary} 50%, ${t.accent} 50%)`,
                  }}
                >
                  {selectedTheme === t.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  selectedTheme === t.id ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {t.nameZh}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={!name.trim() || !nickname.trim() || submitting}
            className="w-full bg-gray-800 text-white rounded-xl py-3.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-transform max-w-lg mx-auto block"
          >
            {submitting ? '建立中...' : '建立旅行'}
          </button>
        </div>
      </form>
    </div>
  );
}
