// 5 theme color palettes — white background with contrasting accent pairs
export const themes = {
  espresso: {
    id: 'espresso',
    name: 'Espresso',
    nameZh: '濃縮咖啡',
    primary: '#33251B',
    primaryDark: '#231810',
    primaryLight: '#7A6555',
    accent: '#41140E',
    accentLight: '#F5E8E6',
    surface: '#FAF7F5',
    border: '#EDE5DF',
  },
  sky: {
    id: 'sky',
    name: 'Sky',
    nameZh: '晴空',
    primary: '#3C3C3C',
    primaryDark: '#2A2A2A',
    primaryLight: '#8A8A8A',
    accent: '#A0D2FF',
    accentLight: '#E0EEFF',
    surface: '#F5F9FF',
    border: '#E5E5E5',
  },
  blossom: {
    id: 'blossom',
    name: 'Blossom',
    nameZh: '花漾',
    primary: '#3C3C3C',
    primaryDark: '#2A2A2A',
    primaryLight: '#8A8A8A',
    accent: '#FFC8DC',
    accentLight: '#FFF0F5',
    surface: '#FFFAFC',
    border: '#E5E5E5',
  },
  coldBrew: {
    id: 'coldBrew',
    name: 'Cold Brew',
    nameZh: '冷萃',
    primary: '#634035',
    primaryDark: '#4A2F26',
    primaryLight: '#9B8178',
    accent: '#FDE2E4',
    accentLight: '#FFF2F3',
    surface: '#FFFAFA',
    border: '#EDE0DD',
  },
  cocoaBlue: {
    id: 'cocoaBlue',
    name: 'Cocoa Blue',
    nameZh: '可可藍',
    primary: '#583722',
    primaryDark: '#3D2517',
    primaryLight: '#8B7265',
    accent: '#BDD7DE',
    accentLight: '#DDE9ED',
    surface: '#F5F9FB',
    border: '#E4DFDB',
  },
};

export const themeList = Object.values(themes);

// Apply theme CSS variables to an element or document
export function applyTheme(themeId) {
  const t = themes[themeId] || themes.cocoaBlue;
  const root = document.documentElement;
  root.style.setProperty('--t-primary', t.primary);
  root.style.setProperty('--t-primary-dark', t.primaryDark);
  root.style.setProperty('--t-primary-light', t.primaryLight);
  root.style.setProperty('--t-accent', t.accent);
  root.style.setProperty('--t-accent-light', t.accentLight);
  root.style.setProperty('--t-surface', t.surface);
  root.style.setProperty('--t-border', t.border);
}
