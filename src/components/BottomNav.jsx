import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Plane, Map, ShoppingBag, Receipt } from 'lucide-react';

const tabs = [
  { path: 'luggage', label: '行李', icon: Briefcase },
  { path: 'info', label: '資訊', icon: Plane },
  { path: 'itinerary', label: '行程', icon: Map },
  { path: 'must-buy', label: '必買', icon: ShoppingBag },
  { path: 'split', label: '分帳', icon: Receipt },
];

export default function BottomNav({ tripId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = `/trip/${tripId}/`;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border flex z-50">
      {tabs.map(tab => {
        const active = location.pathname.includes(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(basePath + tab.path)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              active ? 'text-primary' : 'text-primary-light hover:text-primary'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
