import { useState } from 'react';

export default function NicknameModal({ tripName, onSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-primary-dark tracking-wider mb-2">{tripName || 'Trip'}</h1>
        <div className="w-16 h-0.5 bg-primary mx-auto mb-3"></div>
        <p className="text-primary-light text-sm">輸入暱稱加入旅行</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <label className="block text-sm font-medium text-primary-dark mb-2">
          請輸入你的暱稱
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：小明"
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-primary-dark placeholder:text-primary-light/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          autoFocus
        />
        <button
          type="submit"
          className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
        >
          加入旅行
        </button>
      </form>
    </div>
  );
}
