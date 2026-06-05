import { useState, useMemo } from 'react';
import {
  useTripStore,
  uid,
  foreignToTwd,
  twdToForeign,
  calculateSettlements,
} from '../utils/store';
import {
  Receipt,
  Users,
  User,
  Calculator,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Coins,
  Tag,
} from 'lucide-react';

const TABS = [
  { key: 'shared', label: '共用分帳', icon: Users },
  { key: 'personal', label: '個人記帳', icon: User },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Main component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Split({ tripId, nickname }) {
  const [data, update] = useTripStore(tripId);
  const [activeTab, setActiveTab] = useState('shared');

  if (!data) return null;

  const currentUser = nickname;
  const symbol = data.currencySymbol || '$';
  const currency = data.currency || 'USD';
  const rate = data.exchangeRate || 1;

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <Receipt size={24} className="text-primary" />
        <h1 className="text-xl font-bold text-primary-dark">分帳</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-border rounded-xl p-1 mb-5">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-white text-primary-dark shadow-sm'
                  : 'text-primary-light hover:text-primary'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'shared' && (
        <SharedTab data={data} update={update} currentUser={currentUser} symbol={symbol} currency={currency} rate={rate} />
      )}
      {activeTab === 'personal' && (
        <PersonalTab data={data} update={update} currentUser={currentUser} symbol={symbol} currency={currency} rate={rate} />
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Shared expenses tab
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SharedTab({ data, update, currentUser, symbol, currency, rate }) {
  const members = data.members || [];
  const expenses = data.expenses?.shared || [];

  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState('');
  const [amountForeign, setAmountForeign] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser || '');
  const [splitAmong, setSplitAmong] = useState(members);
  const [showSettlement, setShowSettlement] = useState(false);

  const totalTWD = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amountTWD || 0), 0),
    [expenses]
  );

  const settlements = useMemo(
    () => calculateSettlements(expenses, members),
    [expenses, members]
  );

  const handleToggleSplit = (member) => {
    setSplitAmong(prev =>
      prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const foreign = parseInt(amountForeign, 10);
    if (!item.trim() || !foreign || !paidBy) return;

    const twd = foreignToTwd(foreign, rate);

    update(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        shared: [
          ...prev.expenses.shared,
          {
            id: uid(),
            item: item.trim(),
            amountForeign: foreign,
            amountTWD: twd,
            paidBy,
            splitAmong: splitAmong.length === members.length ? members : splitAmong,
            date: new Date().toISOString(),
          },
        ],
      },
    }));

    setItem('');
    setAmountForeign('');
    setPaidBy(currentUser || '');
    setSplitAmong(members);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    update(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        shared: prev.expenses.shared.filter(e => e.id !== id),
      },
    }));
  };

  const autoTWD = amountForeign ? foreignToTwd(parseInt(amountForeign, 10) || 0, rate) : 0;

  return (
    <>
      {/* Total card */}
      <div className="bg-primary-dark rounded-2xl px-5 py-4 mb-5 text-white">
        <p className="text-xs opacity-70 mb-1">共用花費總計</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">
            NT${totalTWD.toLocaleString()}
          </span>
        </div>
        <p className="text-xs opacity-50 mt-1">
          {expenses.length} 筆支出 / {members.length} 人分攤
        </p>
      </div>

      {/* Add expense toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium text-sm hover:border-primary hover:bg-surface transition mb-5"
        >
          <Plus size={18} />
          新增共用支出
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-border rounded-2xl p-4 mb-5 space-y-3"
        >
          {/* Item name */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              品項名稱
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="例如：晚餐"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm"
              autoFocus
            />
          </div>

          {/* Amount Foreign */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              金額 ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={amountForeign}
                onChange={(e) => setAmountForeign(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm pr-24"
              />
              {autoTWD > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent font-medium">
                  ≈ NT${autoTWD.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              誰先付
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm appearance-none"
            >
              {members.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Split among */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1.5">
              分攤成員
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const checked = splitAmong.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleSplit(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      checked
                        ? 'bg-accent text-white'
                        : 'bg-border text-primary-light hover:bg-border/70'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-primary-light font-medium text-sm hover:bg-border transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!item.trim() || !amountForeign || !paidBy || splitAmong.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              新增
            </button>
          </div>
        </form>
      )}

      {/* Expense list */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 text-primary-light">
          <Coins size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">還沒有共用支出</p>
          <p className="text-xs mt-1 opacity-70">點擊上方按鈕新增</p>
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {[...expenses].reverse().map(exp => (
            <div
              key={exp.id}
              className="bg-white border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">
                    {exp.item}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary-light">
                      {exp.paidBy} 先付
                    </span>
                    <span className="text-xs text-primary-light/50">|</span>
                    <span className="text-xs text-primary-light">
                      {exp.splitAmong?.length || members.length} 人分
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-dark">
                    NT${(exp.amountTWD || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-primary-light">
                    {symbol}{(exp.amountForeign || exp.amountKRW || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Delete */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-1 rounded-lg text-primary-light/30 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settlement */}
      {expenses.length > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSettlement(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-surface transition"
          >
            <span className="text-sm font-semibold text-primary-dark flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-primary" />
              結算
            </span>
            {showSettlement ? (
              <ChevronUp size={18} className="text-primary-light" />
            ) : (
              <ChevronDown size={18} className="text-primary-light" />
            )}
          </button>

          {showSettlement && (
            <div className="px-4 py-3 space-y-2.5 bg-white">
              {settlements.length === 0 ? (
                <p className="text-sm text-primary-light text-center py-4">
                  目前不需要結算
                </p>
              ) : (
                settlements.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-accent-light/40 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-primary-dark">
                      {s.from}
                    </span>
                    <ArrowRight size={16} className="text-accent shrink-0" />
                    <span className="text-sm font-semibold text-primary-dark">
                      {s.to}
                    </span>
                    <span className="ml-auto text-sm font-bold text-primary">
                      NT${s.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Personal expenses tab
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PersonalTab({ data, update, currentUser, symbol, currency, rate }) {
  const expenses = data.expenses?.personal?.[currentUser] || [];

  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState('');
  const [amountForeign, setAmountForeign] = useState('');
  const [category, setCategory] = useState('');

  const totalTWD = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amountTWD || 0), 0),
    [expenses]
  );

  const autoTWD = amountForeign ? foreignToTwd(parseInt(amountForeign, 10) || 0, rate) : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    const foreign = parseInt(amountForeign, 10);
    if (!item.trim() || !foreign) return;

    const twd = foreignToTwd(foreign, rate);

    update(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        personal: {
          ...prev.expenses.personal,
          [currentUser]: [
            ...(prev.expenses.personal[currentUser] || []),
            {
              id: uid(),
              item: item.trim(),
              amountForeign: foreign,
              amountTWD: twd,
              date: new Date().toISOString(),
              category: category.trim() || null,
            },
          ],
        },
      },
    }));

    setItem('');
    setAmountForeign('');
    setCategory('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    update(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        personal: {
          ...prev.expenses.personal,
          [currentUser]: (prev.expenses.personal[currentUser] || []).filter(
            e => e.id !== id
          ),
        },
      },
    }));
  };

  return (
    <>
      {/* Total card */}
      <div className="bg-primary-dark rounded-2xl px-5 py-4 mb-5 text-white">
        <p className="text-xs opacity-70 mb-1">{currentUser} 的個人花費</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">
            NT${totalTWD.toLocaleString()}
          </span>
        </div>
        <p className="text-xs opacity-50 mt-1">{expenses.length} 筆支出</p>
      </div>

      {/* Add toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium text-sm hover:border-primary hover:bg-surface transition mb-5"
        >
          <Plus size={18} />
          新增個人支出
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-border rounded-2xl p-4 mb-5 space-y-3"
        >
          {/* Item */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              品項名稱
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="例如：美妝、衣服"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              金額 ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={amountForeign}
                onChange={(e) => setAmountForeign(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm pr-24"
              />
              {autoTWD > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent font-medium">
                  ≈ NT${autoTWD.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">
              分類 (選填)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例如：美食、購物、交通"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-primary-light font-medium text-sm hover:bg-border transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!item.trim() || !amountForeign}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              新增
            </button>
          </div>
        </form>
      )}

      {/* Expense list */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 text-primary-light">
          <Coins size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">還沒有個人支出</p>
          <p className="text-xs mt-1 opacity-70">點擊上方按鈕開始記帳</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...expenses].reverse().map(exp => (
            <div
              key={exp.id}
              className="bg-white border border-border rounded-xl px-4 py-3 hover:border-primary/20 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">
                    {exp.item}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {exp.category && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-accent bg-accent-light/50 px-2 py-0.5 rounded-full">
                        <Tag size={10} />
                        {exp.category}
                      </span>
                    )}
                    <span className="text-xs text-primary-light/60">
                      {new Date(exp.date).toLocaleDateString('zh-TW', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-dark">
                    NT${(exp.amountTWD || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-primary-light">
                    {symbol}{(exp.amountForeign || exp.amountKRW || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-1 rounded-lg text-primary-light/30 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
