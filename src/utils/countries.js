export const countries = [
  { code: 'KR', name: '韓國', flag: '\ud83c\uddf0\ud83c\uddf7', currency: 'KRW', symbol: '\u20a9', defaultRate: 0.0235 },
  { code: 'JP', name: '日本', flag: '\ud83c\uddef\ud83c\uddf5', currency: 'JPY', symbol: '\u00a5', defaultRate: 0.21 },
  { code: 'TH', name: '泰國', flag: '\ud83c\uddf9\ud83c\udded', currency: 'THB', symbol: '\u0e3f', defaultRate: 0.92 },
  { code: 'US', name: '美國', flag: '\ud83c\uddfa\ud83c\uddf8', currency: 'USD', symbol: '$', defaultRate: 32.5 },
  { code: 'GB', name: '英國', flag: '\ud83c\uddec\ud83c\udde7', currency: 'GBP', symbol: '\u00a3', defaultRate: 41.0 },
  { code: 'EU', name: '歐洲', flag: '\ud83c\uddea\ud83c\uddfa', currency: 'EUR', symbol: '\u20ac', defaultRate: 35.5 },
  { code: 'CN', name: '中國', flag: '\ud83c\udde8\ud83c\uddf3', currency: 'CNY', symbol: '\u00a5', defaultRate: 4.5 },
];

export function getCountry(code) {
  return countries.find(c => c.code === code) || countries[0];
}
