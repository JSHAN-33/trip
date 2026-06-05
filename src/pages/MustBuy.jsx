import { useState, useRef } from 'react';
import { useTripStore, uid, uploadImage } from '../utils/store';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Users,
  User,
  Camera,
  Link,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

const TABS = [
  { key: 'shared', label: '共用清單', icon: Users },
  { key: 'personal', label: '個人清單', icon: User },
];

export default function MustBuy({ tripId, nickname }) {
  const [data, update] = useTripStore(tripId);
  const [activeTab, setActiveTab] = useState('shared');
  const [newItem, setNewItem] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newLink, setNewLink] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!data) return null;

  const currentUser = nickname;
  const sharedList = data.mustBuy?.shared || [];
  const personalList = data.mustBuy?.personal?.[currentUser] || [];

  const activeList = activeTab === 'shared' ? sharedList : personalList;
  const boughtCount = activeList.filter(i => i.bought).length;
  const totalCount = activeList.length;

  // ── Pick photo ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Add item ──
  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed || uploading) return;

    let image = null;
    const link = newLink.trim() || null;

    if (imageFile) {
      try {
        setUploading(true);
        image = await uploadImage(imageFile);
      } catch (err) {
        console.error('Upload failed', err);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    update(prev => {
      const mustBuy = { ...prev.mustBuy };

      if (activeTab === 'shared') {
        mustBuy.shared = [
          ...mustBuy.shared,
          { id: uid(), name: trimmed, bought: false, boughtBy: null, image, link },
        ];
      } else {
        mustBuy.personal = {
          ...mustBuy.personal,
          [currentUser]: [
            ...(mustBuy.personal[currentUser] || []),
            { id: uid(), name: trimmed, bought: false, image, link },
          ],
        };
      }

      return { ...prev, mustBuy };
    });

    setNewItem('');
    clearImage();
    setNewLink('');
    setShowExtra(false);
  };

  // ── Toggle bought ──
  const handleToggle = (id) => {
    update(prev => {
      const mustBuy = { ...prev.mustBuy };

      if (activeTab === 'shared') {
        mustBuy.shared = mustBuy.shared.map(item =>
          item.id === id
            ? {
                ...item,
                bought: !item.bought,
                boughtBy: !item.bought ? currentUser : null,
              }
            : item
        );
      } else {
        mustBuy.personal = {
          ...mustBuy.personal,
          [currentUser]: (mustBuy.personal[currentUser] || []).map(item =>
            item.id === id ? { ...item, bought: !item.bought } : item
          ),
        };
      }

      return { ...prev, mustBuy };
    });
  };

  // ── Delete item ──
  const handleDelete = (id) => {
    update(prev => {
      const mustBuy = { ...prev.mustBuy };

      if (activeTab === 'shared') {
        mustBuy.shared = mustBuy.shared.filter(item => item.id !== id);
      } else {
        mustBuy.personal = {
          ...mustBuy.personal,
          [currentUser]: (mustBuy.personal[currentUser] || []).filter(
            item => item.id !== id
          ),
        };
      }

      return { ...prev, mustBuy };
    });
  };

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <ShoppingBag size={24} className="text-primary" />
        <h1 className="text-xl font-bold text-primary-dark">必買清單</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-border rounded-xl p-1 mb-5">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setNewItem('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-primary-dark shadow-sm'
                  : 'text-primary-light hover:text-primary'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="bg-white border border-border rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-dark">
            {activeTab === 'shared' ? '團隊進度' : '個人進度'}
          </span>
          <span className="text-sm font-semibold text-primary">
            {boughtCount} / {totalCount}
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(boughtCount / totalCount) * 100}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* Add item form */}
      <form onSubmit={handleAdd} className="bg-white border border-border rounded-xl p-3 mb-5 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={
              activeTab === 'shared'
                ? '新增共用必買品...'
                : '新增個人必買品...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface/50 text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm"
          />
          <button
            type="submit"
            disabled={!newItem.trim() || uploading}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="flex items-center gap-1 text-xs text-primary-light hover:text-primary transition"
        >
          {showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          附加照片 / 連結
        </button>

        {showExtra && (
          <div className="space-y-2 pt-1">
            {/* Photo picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="預覽"
                  className="w-full max-h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-primary-light/30 text-primary-light hover:border-primary hover:text-primary hover:bg-surface/50 transition text-xs"
              >
                <Camera size={18} />
                從相簿選擇照片
              </button>
            )}

            {/* Link input */}
            <div className="flex items-center gap-2">
              <Link size={16} className="text-primary-light shrink-0" />
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="貼上商品連結..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface/50 text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-xs"
              />
            </div>
          </div>
        )}
      </form>

      {/* Item list */}
      <div className="space-y-2">
        {activeList.length === 0 && (
          <div className="text-center py-12 text-primary-light">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">還沒有項目</p>
            <p className="text-xs mt-1 opacity-70">在上方輸入框新增吧</p>
          </div>
        )}

        {activeList.map(item => (
          <div
            key={item.id}
            className={`rounded-xl border transition-all overflow-hidden ${
              item.bought
                ? 'bg-accent-light/40 border-accent/30'
                : 'bg-white border-border hover:border-primary/30'
            }`}
          >
            {/* Image thumbnail */}
            {item.image && (
              <button
                onClick={() => setPreviewImg(item.image)}
                className="w-full block"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className={`w-full h-32 object-cover transition-all ${
                    item.bought ? 'opacity-50 grayscale' : ''
                  }`}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </button>
            )}

            <div className="flex items-center gap-3 px-4 py-3">
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(item.id)}
                className="shrink-0 transition-colors"
              >
                {item.bought ? (
                  <CheckCircle2 size={22} className="text-accent" />
                ) : (
                  <Circle size={22} className="text-primary-light/50" />
                )}
              </button>

              {/* Name & buyer */}
              <div className="flex-1 min-w-0">
                <span
                  className={`block text-sm truncate transition-all ${
                    item.bought
                      ? 'line-through text-primary-light'
                      : 'text-primary-dark font-medium'
                  }`}
                >
                  {item.name}
                </span>
                {activeTab === 'shared' && item.bought && item.boughtBy && (
                  <span className="text-xs text-accent mt-0.5 block">
                    {item.boughtBy} 已購買
                  </span>
                )}
              </div>

              {/* Link button */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg text-accent hover:text-primary hover:bg-surface transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="shrink-0 p-1.5 rounded-lg text-primary-light/40 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image preview modal */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          >
            <X size={28} />
          </button>
          <img
            src={previewImg}
            alt="預覽"
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
