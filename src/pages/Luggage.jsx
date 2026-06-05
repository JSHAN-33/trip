import { useState } from 'react';
import { useTripStore, uid } from '../utils/store';
import { Plus, Trash2, CheckCircle2, Circle, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  {
    name: '重要文件與財物',
    note: '隨身攜帶，切勿托運',
    items: [
      '護照：正本（效期需 6 個月以上）',
      '簽證：紙本簽證或電子簽證憑證',
      '機票與訂房資訊：電子檔或紙本備份',
      '現金與信用卡：當地貨幣、台幣、信用卡',
    ],
  },
  {
    name: '電子設備',
    note: '行動電源、電池嚴禁托運',
    items: [
      '行動電源：嚴禁托運，必須放在隨身行李',
      '萬用轉接頭與變壓器：確認當地電壓與插座形式',
      '充電線與豆腐頭：手機、相機、行動電源之充電線',
    ],
  },
  {
    name: '衣物與配飾',
    note: '',
    items: [
      '外出服裝',
      '內衣褲與襪子',
      '睡衣/休閒服',
      '舒適鞋類與拖鞋',
      '墨鏡、帽子',
    ],
  },
  {
    name: '盥洗與個人護理',
    note: '液體單瓶 >100ML 須托運',
    items: [
      '個人盥洗包：牙刷、牙膏、洗面乳、洗髮精/沐浴乳小樣',
      '保養品與化妝品：常用護膚品、防曬乳、卸妝用品',
      '日常藥品：感冒藥、止痛藥、腸胃藥、暈車藥、個人慢性病藥',
      '衛生用品：面紙、濕紙巾、口罩、生理用品',
    ],
  },
];

function buildDefaultLuggage() {
  return DEFAULT_CATEGORIES.map(cat => ({
    id: uid(),
    name: cat.name,
    note: cat.note,
    items: cat.items.map(item => ({ id: uid(), name: item, checked: false })),
  }));
}

export default function Luggage({ tripId, nickname }) {
  const [data, update] = useTripStore(tripId);
  const [newItems, setNewItems] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const user = nickname;

  if (!data) return null;

  // Initialize with default categories if user has no luggage data or has old flat array
  let categories = data.luggage[user];
  if (!categories || !Array.isArray(categories) || categories.length === 0 || !categories[0]?.items) {
    const defaults = buildDefaultLuggage();
    update(prev => ({
      ...prev,
      luggage: { ...prev.luggage, [user]: defaults },
    }));
    categories = defaults;
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.checked).length, 0);

  const toggleItem = (catId, itemId) => {
    update(prev => ({
      ...prev,
      luggage: {
        ...prev.luggage,
        [user]: prev.luggage[user].map(cat =>
          cat.id === catId
            ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item) }
            : cat
        ),
      },
    }));
  };

  const deleteItem = (catId, itemId) => {
    update(prev => ({
      ...prev,
      luggage: {
        ...prev.luggage,
        [user]: prev.luggage[user].map(cat =>
          cat.id === catId
            ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
            : cat
        ),
      },
    }));
  };

  const addItem = (e, catId) => {
    e.preventDefault();
    const text = (newItems[catId] || '').trim();
    if (!text) return;

    update(prev => ({
      ...prev,
      luggage: {
        ...prev.luggage,
        [user]: prev.luggage[user].map(cat =>
          cat.id === catId
            ? { ...cat, items: [...cat.items, { id: uid(), name: text, checked: false }] }
            : cat
        ),
      },
    }));
    setNewItems(prev => ({ ...prev, [catId]: '' }));
  };

  const toggleCollapse = (catId) => {
    setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-primary-dark">行李清單</h1>
        <p className="text-sm text-primary-light mt-0.5">{user} 的個人清單</p>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="bg-white border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary-dark">打包進度</span>
            <span className="text-sm font-semibold text-primary">{checkedItems} / {totalItems}</span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${totalItems ? (checkedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-5">
        {categories.map(cat => {
          const catChecked = cat.items.filter(i => i.checked).length;
          const isCollapsed = collapsed[cat.id];

          return (
            <div key={cat.id}>
              {/* Category Header */}
              <button
                onClick={() => toggleCollapse(cat.id)}
                className="flex items-center gap-2 mb-2 w-full text-left"
              >
                <div className="w-1 h-5 bg-primary rounded-full" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-primary-dark">
                    {cat.name}
                  </span>
                  {cat.note && (
                    <span className="text-xs text-primary-light ml-1">
                      ({cat.note})
                    </span>
                  )}
                </div>
                <span className="text-xs text-primary-light mr-1">{catChecked}/{cat.items.length}</span>
                {isCollapsed ? <ChevronDown size={16} className="text-primary-light" /> : <ChevronUp size={16} className="text-primary-light" />}
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                        item.checked ? 'bg-gray-50' : 'bg-white border border-border'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(cat.id, item.id)}
                        className="flex-shrink-0 text-primary hover:text-primary-dark transition"
                      >
                        {item.checked ? (
                          <CheckCircle2 size={22} className="text-primary" />
                        ) : (
                          <Circle size={22} className="text-primary-light" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-colors ${
                          item.checked ? 'line-through text-primary-light' : 'text-primary-dark'
                        }`}
                      >
                        {item.name}
                      </span>
                      <button
                        onClick={() => deleteItem(cat.id, item.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-primary-light hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Add Item to Category */}
                  <form onSubmit={(e) => addItem(e, cat.id)} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newItems[cat.id] || ''}
                      onChange={(e) => setNewItems(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder="新增項目..."
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!(newItems[cat.id] || '').trim()}
                      className="px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Plus size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
