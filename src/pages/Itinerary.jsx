import { useState, useRef, useMemo } from 'react';
import {
  Clock,
  MapPin,
  StickyNote,
  Plus,
  Trash2,
  Navigation,
  CalendarDays,
  ChevronUp,
  ChevronDown,
  User,
  Pencil,
  Check,
  X,
  GripVertical,
  ArrowRightLeft,
  Camera,
} from 'lucide-react';
import { useTripStore, uid } from '../utils/store';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Chinese number words ──
const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function chineseDayLabel(n) {
  if (n <= 10) return `第${CHINESE_NUMBERS[n - 1]}天`;
  return `第${n}天`;
}

function buildDayLabels(days) {
  const labels = [];
  for (let i = 1; i <= days; i++) {
    labels.push({ key: `day${i}`, label: `Day ${i}`, sub: chineseDayLabel(i) });
  }
  return labels;
}

// ── Compress image to small thumbnail base64 ──
function compressImage(file, maxWidth = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = { time: '', title: '', location: '', note: '', photos: [] };

function openGoogleMap(location) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank', 'noopener,noreferrer');
}

function PhotoPicker({ photos, onChange }) {
  const fileRef = useRef(null);
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    onChange([...(photos || []), ...compressed]);
    e.target.value = '';
  };
  return (
    <div>
      <label className="block text-[11px] font-semibold text-primary-dark mb-1">照片</label>
      <div className="flex items-center gap-2 flex-wrap">
        {(photos || []).map((src, i) => (
          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
            <img src={src} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-14 h-14 rounded-lg border-2 border-dashed border-border text-primary-light hover:border-primary hover:text-primary transition flex items-center justify-center"
        >
          <Camera size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>
    </div>
  );
}

function SortableCard({ item, index, activeDay, dayLabels, editingId, editForm, onEditChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onMoveToDay, onUpdatePhotos }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-border rounded-2xl p-4 relative">
      {/* Index badge */}
      <span className="absolute -top-2 -left-1 bg-accent text-primary-dark text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
        {index + 1}
      </span>

      {editingId === item.id ? (
        /* --- Edit Mode --- */
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-primary-dark">編輯行程</span>
          <div>
            <label className="block text-[11px] font-semibold text-primary-dark mb-1">時間</label>
            <input type="time" value={editForm.time} onChange={onEditChange('time')} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-primary-dark mb-1">活動名稱 <span className="text-red-400">*</span></label>
            <input type="text" value={editForm.title} onChange={onEditChange('title')} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-primary-dark mb-1">地點</label>
            <input type="text" value={editForm.location} onChange={onEditChange('location')} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-primary-dark mb-1">備註</label>
            <textarea value={editForm.note} onChange={onEditChange('note')} rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none" />
          </div>
          <PhotoPicker photos={editForm.photos || []} onChange={(p) => onEditChange('photos')({ target: { value: p } })} />
          <div className="flex gap-2">
            <button onClick={onCancelEdit} className="flex-1 py-2 rounded-xl text-sm font-medium text-primary-light bg-white border border-border hover:bg-surface transition flex items-center justify-center gap-1">
              <X size={14} /> 取消
            </button>
            <button onClick={() => onSaveEdit(item.id)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition flex items-center justify-center gap-1">
              <Check size={14} /> 儲存
            </button>
          </div>
        </div>
      ) : (
        /* --- Display Mode --- */
        <>
          {/* Drag handle + action buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-0.5">
            <button
              onClick={() => setShowMoveMenu(v => !v)}
              className="p-1.5 rounded-lg text-primary-light hover:text-primary hover:bg-accent-light transition"
              aria-label="移到其他天"
            >
              <ArrowRightLeft size={14} />
            </button>
            <button onClick={() => onStartEdit(item)} className="p-1.5 rounded-lg text-primary-light hover:text-primary hover:bg-border/50 transition" aria-label="編輯">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-primary-light hover:text-red-500 hover:bg-red-50 transition" aria-label="刪除">
              <Trash2 size={14} />
            </button>
            <div {...attributes} {...listeners} className="p-1.5 rounded-lg text-primary-light hover:text-primary cursor-grab active:cursor-grabbing touch-none">
              <GripVertical size={14} />
            </div>
          </div>

          {/* Move to day menu */}
          {showMoveMenu && (
            <div className="absolute top-12 right-3 bg-white border border-border rounded-xl shadow-lg p-2 z-40">
              <p className="text-[10px] text-primary-light px-2 mb-1">移到...</p>
              {dayLabels.filter(d => d.key !== activeDay).map(d => (
                <button
                  key={d.key}
                  onClick={() => { onMoveToDay(item.id, d.key); setShowMoveMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-accent-light rounded-lg transition"
                >
                  {d.label} {d.sub}
                </button>
              ))}
            </div>
          )}

          {/* Time */}
          {item.time && (
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={13} className="text-accent flex-shrink-0" />
              <span className="text-xs font-semibold text-primary bg-accent-light px-2 py-0.5 rounded-md">
                {item.time}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-[15px] font-bold text-primary-dark leading-snug pr-24">
            {item.title}
          </h3>

          {/* Location */}
          {item.location && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <MapPin size={13} className="text-primary-light flex-shrink-0 mt-0.5" />
              <span className="text-xs text-primary-light leading-relaxed">{item.location}</span>
            </div>
          )}

          {/* Note */}
          {item.note && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <StickyNote size={13} className="text-primary-light/60 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-primary-light/80 leading-relaxed">{item.note}</span>
            </div>
          )}

          {/* Photos */}
          {item.photos?.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto scrollbar-none">
              {item.photos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  onClick={() => setPreviewImg(src)}
                  className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                />
              ))}
            </div>
          )}

          {/* Photo preview overlay */}
          {previewImg && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setPreviewImg(null)}>
              <img src={previewImg} className="max-w-full max-h-full rounded-xl" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60">
            <div className="flex items-center gap-1 text-[11px] text-primary-light/70">
              <User size={11} />
              <span>{item.addedBy}</span>
            </div>
            {item.location && (
              <div className="flex gap-1.5">
                <button onClick={() => openGoogleMap(item.location)} className="flex items-center gap-1 text-[11px] font-medium text-primary bg-white px-2.5 py-1.5 rounded-lg border border-border hover:border-primary hover:shadow-sm transition">
                  <MapPin size={11} /> Google Map
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SortableDayRow({ dayKey, label, sub, count }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dayKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
      <div {...attributes} {...listeners} className="text-primary-light cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={18} />
      </div>
      <div className="flex-1">
        <span className="text-sm font-bold text-primary-dark">{label}</span>
        <span className="text-xs text-primary-light ml-2">{sub}</span>
      </div>
      <span className="text-xs text-primary-light bg-surface px-2 py-0.5 rounded-full">
        {count} 個行程
      </span>
    </div>
  );
}

export default function Itinerary({ tripId, nickname }) {
  const [data, update] = useTripStore(tripId);
  const [activeDay, setActiveDay] = useState('day1');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [reorderMode, setReorderMode] = useState(false);
  const longPressTimer = useRef(null);

  const dayLabels = useMemo(() => buildDayLabels(data?.days || 5), [data?.days]);
  const [dayOrder, setDayOrder] = useState(() => dayLabels.map(d => d.key));

  // Sync dayOrder when days count changes
  useMemo(() => {
    setDayOrder(dayLabels.map(d => d.key));
  }, [dayLabels.length]);

  const activities = data?.itinerary?.[activeDay] || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
  );

  const daySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  if (!data) return null;

  const handleDayLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setDayOrder(dayLabels.map(d => d.key));
      setReorderMode(true);
    }, 2000);
  };

  const handleDayLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDayDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = dayOrder.indexOf(active.id);
    const newIndex = dayOrder.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setDayOrder(arrayMove(dayOrder, oldIndex, newIndex));
  };

  const confirmDayReorder = () => {
    const newItinerary = {};
    dayOrder.forEach((fromKey, i) => {
      const toKey = dayLabels[i].key;
      newItinerary[toKey] = data.itinerary?.[fromKey] || [];
    });
    update(prev => ({ ...prev, itinerary: newItinerary }));
    setReorderMode(false);
  };

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const handleEditChange = (field) => (e) => setEditForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;
    update(prev => ({
      ...prev,
      itinerary: {
        ...prev.itinerary,
        [activeDay]: [...(prev.itinerary[activeDay] || []), {
          id: uid(), time: form.time.trim(), title: trimmedTitle,
          location: form.location.trim(), note: form.note.trim(),
          photos: form.photos || [],
          addedBy: nickname || '匿名',
        }],
      },
    }));
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleDelete = (itemId) => {
    update(prev => ({
      ...prev,
      itinerary: { ...prev.itinerary, [activeDay]: (prev.itinerary[activeDay] || []).filter(i => i.id !== itemId) },
    }));
    if (editingId === itemId) setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ time: item.time, title: item.title, location: item.location, note: item.note, photos: item.photos || [] });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_FORM); };

  const saveEdit = (itemId) => {
    const trimmedTitle = editForm.title.trim();
    if (!trimmedTitle) return;
    update(prev => ({
      ...prev,
      itinerary: {
        ...prev.itinerary,
        [activeDay]: (prev.itinerary[activeDay] || []).map(item =>
          item.id === itemId ? { ...item, time: editForm.time.trim(), title: trimmedTitle, location: editForm.location.trim(), note: editForm.note.trim(), photos: editForm.photos || [] } : item
        ),
      },
    }));
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activities.findIndex(i => i.id === active.id);
    const newIndex = activities.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    update(prev => ({
      ...prev,
      itinerary: { ...prev.itinerary, [activeDay]: arrayMove(prev.itinerary[activeDay] || [], oldIndex, newIndex) },
    }));
  };

  const moveToDay = (itemId, targetDay) => {
    const item = activities.find(i => i.id === itemId);
    if (!item) return;
    update(prev => ({
      ...prev,
      itinerary: {
        ...prev.itinerary,
        [activeDay]: (prev.itinerary[activeDay] || []).filter(i => i.id !== itemId),
        [targetDay]: [...(prev.itinerary[targetDay] || []), item],
      },
    }));
  };

  if (reorderMode) {
    return (
      <div className="pb-24 bg-white min-h-dvh">
        <div className="px-4 pt-5 pb-3 border-b border-border">
          <h1 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <CalendarDays size={20} />
            調整天數順序
          </h1>
          <p className="text-xs text-primary-light mt-0.5">拖動調整每天的順序，完成後按儲存</p>
        </div>

        <div className="px-4 pt-4 space-y-2">
          <DndContext sensors={daySensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
            <SortableContext items={dayOrder} strategy={verticalListSortingStrategy}>
              {dayOrder.map((dayKey) => {
                const dayInfo = dayLabels.find(d => d.key === dayKey);
                if (!dayInfo) return null;
                const count = (data.itinerary?.[dayKey] || []).length;
                return (
                  <SortableDayRow
                    key={dayKey}
                    dayKey={dayKey}
                    label={dayInfo.label}
                    sub={dayInfo.sub}
                    count={count}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        <div className="px-4 mt-6 flex gap-2">
          <button
            onClick={() => setReorderMode(false)}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-primary-light bg-white border border-border hover:bg-surface transition flex items-center justify-center gap-1"
          >
            <X size={16} /> 取消
          </button>
          <button
            onClick={confirmDayReorder}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition flex items-center justify-center gap-1"
          >
            <Check size={16} /> 儲存順序
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-white min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <CalendarDays size={20} />
            行程規劃
          </h1>
          <p className="text-xs text-primary-light mt-0.5">{data.days} 天 {data.nights} 夜 · 長按天數可調整順序</p>
        </div>
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none"
          onPointerDown={handleDayLongPressStart}
          onPointerUp={handleDayLongPressEnd}
          onPointerLeave={handleDayLongPressEnd}
        >
          {dayLabels.map(({ key, label, sub }) => {
            const isActive = activeDay === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveDay(key); setEditingId(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-accent text-primary-dark shadow-sm' : 'bg-surface text-primary-light hover:bg-border'
                }`}
              >
                <span className="block text-xs font-semibold">{label}</span>
                <span className="block text-[10px] mt-0.5 opacity-70">{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity List with DnD */}
      <div className="px-4 pt-4 space-y-3">
        {activities.length === 0 && (
          <div className="text-center py-16">
            <Navigation size={40} className="mx-auto text-accent mb-3 opacity-60" />
            <p className="text-primary-light text-sm">這天還沒有行程</p>
            <p className="text-primary-light/60 text-xs mt-1">點下方按鈕新增活動</p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {activities.map((item, index) => (
              <SortableCard
                key={item.id}
                item={item}
                index={index}
                activeDay={activeDay}
                dayLabels={dayLabels}
                editingId={editingId}
                editForm={editForm}
                onEditChange={handleEditChange}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onDelete={handleDelete}
                onMoveToDay={moveToDay}
                onUpdatePhotos={(photos) => handleEditChange('photos')({ target: { value: photos } })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Activity */}
      <div className="px-4 mt-4">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-accent text-primary font-medium text-sm hover:bg-accent-light/40 transition">
            <Plus size={18} /> 新增行程
          </button>
        ) : (
          <form onSubmit={handleAdd} className="bg-accent-light/40 rounded-2xl p-4 border border-accent/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-primary-dark">新增活動</h3>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-primary-light hover:text-primary transition p-1">
                <ChevronUp size={18} />
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-primary-dark mb-1">時間</label>
                <input type="time" value={form.time} onChange={handleChange('time')} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-primary-dark mb-1">活動名稱 <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={handleChange('title')} placeholder="例如：市區觀光" className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-primary-dark mb-1">地點</label>
                <input type="text" value={form.location} onChange={handleChange('location')} placeholder="輸入地址或地點名稱" className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-primary-dark mb-1">備註</label>
                <textarea value={form.note} onChange={handleChange('note')} placeholder="任何補充資訊..." rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none" />
              </div>
              <PhotoPicker photos={form.photos || []} onChange={(p) => setForm(prev => ({ ...prev, photos: p }))} />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-primary-light bg-white border border-border hover:bg-surface transition">取消</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition">新增</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
