import { useState } from 'react';
import { useTripStore, uid } from '../utils/store';
import {
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Building2,
  Plus,
  Trash2,
  MapPin,
  CalendarCheck,
  CalendarX,
  Pencil,
  Check,
} from 'lucide-react';

const emptyFlight = { date: '', flightNo: '', airline: '', depTime: '', arrTime: '', depCode: '', depName: '', arrCode: '', arrName: '' };

const FLIGHT_TYPES = [
  { value: 'outbound', label: '去程', icon: PlaneTakeoff, headerBg: 'bg-primary', headerText: 'text-white' },
  { value: 'inbound', label: '回程', icon: PlaneLanding, headerBg: 'bg-accent', headerText: 'text-primary-dark' },
  { value: 'transfer', label: '轉機 / 移動', icon: Plane, headerBg: 'bg-primary-light', headerText: 'text-white' },
];

function getFlightMeta(type) {
  return FLIGHT_TYPES.find(t => t.value === type) || FLIGHT_TYPES[2];
}

function isFilled(f) {
  return f && f.depCode && f.arrCode;
}

function TicketCard({ flight, onUpdate, onDelete }) {
  const f = flight || emptyFlight;
  const filled = isFilled(f);
  const [editing, setEditing] = useState(!filled);
  const meta = getFlightMeta(f.type);
  const Icon = meta.icon;

  const set = (field, value) => onUpdate({ ...f, [field]: value });

  if (filled && !editing) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-border">
        <div className={`${meta.headerBg} ${meta.headerText} px-4 py-2 flex items-center justify-between`}>
          <span className="text-xs font-semibold tracking-wider">BOARDING PASS</span>
          <div className="flex items-center gap-1">
            <Icon size={14} />
            <span className="text-xs font-medium">{meta.label}</span>
          </div>
        </div>
        <div className="p-4 relative">
          <div className="absolute top-3 right-3 flex items-center gap-0.5">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-primary-light hover:text-primary hover:bg-border/50 transition">
              <Pencil size={14} />
            </button>
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg text-primary-light hover:text-red-500 hover:bg-red-50 transition">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-1">
            <div className="text-center min-w-[60px]">
              <p className="text-3xl font-bold text-primary-dark leading-tight">{f.depCode}</p>
              <p className="text-[10px] text-primary-light mt-0.5">{f.depName}</p>
            </div>
            <div className="flex-1 flex items-center justify-center px-3">
              <div className="flex-1 border-t border-dashed border-primary-light" />
              <Plane size={16} className="text-primary mx-2" />
              <div className="flex-1 border-t border-dashed border-primary-light" />
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-3xl font-bold text-primary-dark leading-tight">{f.arrCode}</p>
              <p className="text-[10px] text-primary-light mt-0.5">{f.arrName}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-border mt-3 pt-3">
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="text-[10px] text-primary-light">日期</p>
                <p className="text-xs font-semibold text-primary-dark mt-0.5">{f.date}</p>
              </div>
              <div>
                <p className="text-[10px] text-primary-light">起飛</p>
                <p className="text-xs font-semibold text-primary-dark mt-0.5">{f.depTime}</p>
              </div>
              <div>
                <p className="text-[10px] text-primary-light">降落</p>
                <p className="text-xs font-semibold text-primary-dark mt-0.5">{f.arrTime}</p>
              </div>
              <div>
                <p className="text-[10px] text-primary-light">航班</p>
                <p className="text-xs font-semibold text-primary-dark mt-0.5">{f.flightNo}</p>
              </div>
            </div>
            {f.airline && (
              <p className="text-[10px] text-primary-light text-center mt-2">{f.airline}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border">
      <div className={`${meta.headerBg} ${meta.headerText} px-4 py-2 flex items-center justify-between`}>
        <span className="text-xs font-semibold tracking-wider">BOARDING PASS</span>
        <div className="flex items-center gap-1">
          <Icon size={14} />
          <span className="text-xs font-medium">{meta.label}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Type selector */}
        <div>
          <label className="text-[10px] text-primary-light mb-1 block">機票類型</label>
          <div className="flex gap-2">
            {FLIGHT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                  f.type === t.value
                    ? 'bg-primary text-white'
                    : 'bg-surface text-primary-light hover:bg-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Airport codes */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-primary-light mb-1 block">出發機場</label>
            <input type="text" value={f.depCode} onChange={e => set('depCode', e.target.value.toUpperCase())} placeholder="TPE" className="w-full px-2.5 py-2 rounded-lg border border-border text-primary-dark text-lg font-bold text-center focus:outline-none focus:border-primary transition" />
          </div>
          <Plane size={18} className="text-primary-light mt-4" />
          <div className="flex-1">
            <label className="text-[10px] text-primary-light mb-1 block">抵達機場</label>
            <input type="text" value={f.arrCode} onChange={e => set('arrCode', e.target.value.toUpperCase())} placeholder="NRT" className="w-full px-2.5 py-2 rounded-lg border border-border text-primary-dark text-lg font-bold text-center focus:outline-none focus:border-primary transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={f.depName} onChange={e => set('depName', e.target.value)} placeholder="出發機場名稱" className="px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-xs focus:outline-none focus:border-primary transition" />
          <input type="text" value={f.arrName} onChange={e => set('arrName', e.target.value)} placeholder="抵達機場名稱" className="px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-xs focus:outline-none focus:border-primary transition" />
        </div>

        <div className="border-t border-dashed border-border" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-primary-light mb-1 block">日期</label>
            <input type="text" value={f.date} onChange={e => set('date', e.target.value)} placeholder="月/日" className="w-full px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-sm focus:outline-none focus:border-primary transition" />
          </div>
          <div>
            <label className="text-[10px] text-primary-light mb-1 block">航班編號</label>
            <input type="text" value={f.flightNo} onChange={e => set('flightNo', e.target.value)} placeholder="XX123" className="w-full px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-sm focus:outline-none focus:border-primary transition" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-primary-light mb-1 block">起飛</label>
            <input type="text" value={f.depTime} onChange={e => set('depTime', e.target.value)} placeholder="14:00" className="w-full px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-sm focus:outline-none focus:border-primary transition" />
          </div>
          <div>
            <label className="text-[10px] text-primary-light mb-1 block">降落</label>
            <input type="text" value={f.arrTime} onChange={e => set('arrTime', e.target.value)} placeholder="17:25" className="w-full px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-sm focus:outline-none focus:border-primary transition" />
          </div>
          <div>
            <label className="text-[10px] text-primary-light mb-1 block">航空公司</label>
            <input type="text" value={f.airline} onChange={e => set('airline', e.target.value)} placeholder="航空公司" className="w-full px-2.5 py-1.5 rounded-lg border border-border text-primary-dark text-sm focus:outline-none focus:border-primary transition" />
          </div>
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="py-2.5 px-4 rounded-xl border border-border text-red-500 text-sm font-medium hover:bg-red-50 transition"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => { if (isFilled(f)) setEditing(false); }}
            disabled={!isFilled(f)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Check size={16} />
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

function isAccFilled(acc) {
  return acc && acc.name && acc.name.trim();
}

function AccommodationCard({ acc, index, onUpdate, onDelete }) {
  const filled = isAccFilled(acc);
  const [editing, setEditing] = useState(!filled);

  if (filled && !editing) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-border">
        <div className="bg-accent px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-primary-dark" />
            <span className="text-xs font-semibold text-primary-dark tracking-wider">住宿 {index + 1}</span>
          </div>
          <span className="text-[10px] text-primary-dark/60">HOTEL</span>
        </div>
        <div className="p-4 relative">
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-primary-light hover:text-primary hover:bg-border/50 transition">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-primary-light hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 size={14} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-primary-dark pr-16">{acc.name}</h3>
          {acc.address && (
            <div className="flex items-start gap-1.5 mt-2">
              <MapPin size={13} className="text-primary-light mt-0.5 shrink-0" />
              <p className="text-xs text-primary-light leading-relaxed">{acc.address}</p>
            </div>
          )}
          {(acc.checkIn || acc.checkOut) && (
            <div className="border-t border-dashed border-border mt-3 pt-3">
              <div className="grid grid-cols-2 gap-4">
                {acc.checkIn && (
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck size={13} className="text-primary-light" />
                    <div>
                      <p className="text-[10px] text-primary-light">入住</p>
                      <p className="text-sm font-semibold text-primary-dark">{acc.checkIn}</p>
                    </div>
                  </div>
                )}
                {acc.checkOut && (
                  <div className="flex items-center gap-1.5">
                    <CalendarX size={13} className="text-primary-light" />
                    <div>
                      <p className="text-[10px] text-primary-light">退房</p>
                      <p className="text-sm font-semibold text-primary-dark">{acc.checkOut}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {acc.address && (
            <div className="flex gap-2 mt-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg bg-surface text-primary text-xs font-medium text-center hover:bg-border transition"
              >
                Google Map
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-primary bg-border px-2.5 py-1 rounded-full">住宿 {index + 1}</span>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-primary-light hover:text-red-500 hover:bg-red-50 transition">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1"><Building2 size={13} /> 名稱</label>
          <input type="text" value={acc.name} onChange={e => onUpdate('name', e.target.value)} placeholder="飯店 / 民宿名稱" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1"><MapPin size={13} /> 地址</label>
          <input type="text" value={acc.address} onChange={e => onUpdate('address', e.target.value)} placeholder="住宿地址" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1"><CalendarCheck size={13} /> 入住</label>
            <input type="text" value={acc.checkIn} onChange={e => onUpdate('checkIn', e.target.value)} placeholder="月/日" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1"><CalendarX size={13} /> 退房</label>
            <input type="text" value={acc.checkOut} onChange={e => onUpdate('checkOut', e.target.value)} placeholder="月/日" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm" />
          </div>
        </div>
        <button
          onClick={() => { if (isAccFilled(acc)) setEditing(false); }}
          disabled={!isAccFilled(acc)}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Check size={16} /> 完成
        </button>
      </div>
    </div>
  );
}

export default function Info({ tripId }) {
  const [data, update] = useTripStore(tripId);

  if (!data) return null;

  // Migrate old object-based flights to array format
  const rawFlights = data.info?.flights;
  const flights = Array.isArray(rawFlights) ? rawFlights : [];

  if (!Array.isArray(rawFlights) && rawFlights) {
    // One-time migration from { outbound, inbound, transfer } to array
    const migrated = [];
    if (rawFlights.outbound) migrated.push({ ...rawFlights.outbound, id: uid(), type: 'outbound' });
    if (rawFlights.inbound) migrated.push({ ...rawFlights.inbound, id: uid(), type: 'inbound' });
    if (rawFlights.transfer && isFilled(rawFlights.transfer)) migrated.push({ ...rawFlights.transfer, id: uid(), type: 'transfer' });
    if (migrated.length === 0) {
      migrated.push({ ...emptyFlight, id: uid(), type: 'outbound' });
      migrated.push({ ...emptyFlight, id: uid(), type: 'inbound' });
    }
    update(prev => ({
      ...prev,
      info: { ...prev.info, flights: migrated },
    }));
  }

  const accommodations = data.info?.accommodations || [];

  const updateFlight = (id, value) => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        flights: (prev.info.flights || []).map(f => f.id === id ? { ...value, id } : f),
      },
    }));
  };

  const deleteFlight = (id) => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        flights: (prev.info.flights || []).filter(f => f.id !== id),
      },
    }));
  };

  const addFlight = () => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        flights: [
          ...(prev.info.flights || []),
          { ...emptyFlight, id: uid(), type: 'outbound' },
        ],
      },
    }));
  };

  const addAccommodation = () => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        accommodations: [
          ...prev.info.accommodations,
          { id: uid(), name: '', address: '', checkIn: '', checkOut: '' },
        ],
      },
    }));
  };

  const updateAccommodation = (id, field, value) => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        accommodations: prev.info.accommodations.map(a => a.id === id ? { ...a, [field]: value } : a),
      },
    }));
  };

  const deleteAccommodation = (id) => {
    update(prev => ({
      ...prev,
      info: {
        ...prev.info,
        accommodations: prev.info.accommodations.filter(a => a.id !== id),
      },
    }));
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-primary-dark">旅遊資訊</h1>
        <p className="text-sm text-primary-light mt-0.5">航班與住宿資訊</p>
      </div>

      {/* Flights */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <Plane size={18} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-primary-dark">航班資訊</h2>
          </div>
          <button
            onClick={addFlight}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition"
          >
            <Plus size={14} />
            新增機票
          </button>
        </div>

        {flights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-border rounded-xl">
            <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center mb-3">
              <Plane size={24} className="text-primary-light" />
            </div>
            <p className="text-primary-dark font-medium mb-1">尚未新增航班</p>
            <p className="text-primary-light text-sm">點擊上方「新增機票」加入航班資訊</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flights.map(flight => (
              <TicketCard
                key={flight.id}
                flight={flight}
                onUpdate={(v) => updateFlight(flight.id, v)}
                onDelete={flights.length > 1 ? () => deleteFlight(flight.id) : null}
              />
            ))}
          </div>
        )}
      </section>

      {/* Accommodations */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <Building2 size={18} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-primary-dark">住宿資訊</h2>
          </div>
          <button
            onClick={addAccommodation}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition"
          >
            <Plus size={14} />
            新增
          </button>
        </div>

        {accommodations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-border rounded-xl">
            <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center mb-3">
              <Building2 size={24} className="text-primary-light" />
            </div>
            <p className="text-primary-dark font-medium mb-1">尚未新增住宿</p>
            <p className="text-primary-light text-sm">點擊上方「新增」按鈕來加入住宿資訊</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accommodations.map((acc, index) => (
              <AccommodationCard
                key={acc.id}
                acc={acc}
                index={index}
                onUpdate={(field, value) => updateAccommodation(acc.id, field, value)}
                onDelete={() => deleteAccommodation(acc.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
