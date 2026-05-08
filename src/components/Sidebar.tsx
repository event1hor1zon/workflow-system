import {
  Home,
  Layers,
  PlusCircle,
  Network,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  navigate: (page: Page, id?: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, navigate, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: '首页控制台' },
    { id: 'tickets', icon: Layers, label: '个人中心 / 工单' },
    { id: 'profile', icon: UserIcon, label: '账户属性' },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-bg-surface/40 backdrop-blur-3xl border-r border-white/10 z-[60] flex flex-col pt-8">
      <div className="px-8 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shrink-0 shadow-xl">
          <Network className="text-white w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h2 className="ui-nowrap font-bold text-lg leading-tight">协同核心网</h2>
          <div className="ui-nowrap flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse" />
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">系统全面就绪</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id === 'profile' ? 'profile' : item.id as Page)}
            className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group
              ${currentPage === item.id || (currentPage === 'department-detail' && item.id === 'dashboard')
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="ui-nowrap text-sm font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        <button
          onClick={() => navigate('create-ticket')}
          className="w-full h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-blue hover:scale-105 active:scale-95 transition-all text-sm font-bold"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="ui-nowrap">新建申报单</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full h-12 flex items-center justify-center gap-2 text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-all font-bold text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span className="ui-nowrap">退出系统</span>
        </button>
      </div>
    </aside>
  );
}
