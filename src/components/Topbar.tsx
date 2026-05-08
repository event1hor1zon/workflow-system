import { Search, Calendar, Sun, Moon, User as UserIcon } from 'lucide-react';
import { Page, User } from '../types';

interface TopbarProps {
  currentPage: Page;
  navigate: (page: Page, id?: string) => void;
  user: User | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Topbar({ currentPage, navigate, user, theme, toggleTheme }: TopbarProps) {
  const getPageTitle = (page: Page) => {
    switch (page) {
      case 'dashboard': return '系统全景图';
      case 'tickets': return '个人中心 / 任务台';
      case 'ticket-detail': return '工单详情 / 结项链路';
      case 'create-ticket': return '发起协同';
      case 'profile': return '账户中心';
      case 'department-detail': return '部门介绍 / 职能详情';
      default: return '协同云端';
    }
  };

  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-bg-surface/30 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between px-8 z-40">
      <div className="flex items-center gap-6">
        <h2 className="ui-nowrap text-sm font-bold tracking-tight">{getPageTitle(currentPage)}</h2>
        <div className="w-px h-4 bg-white/10" />
        <div className="ui-nowrap flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <Calendar className="w-3 h-3" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-bg-elevated pr-6">
          <button
            onClick={toggleTheme}
            className="p-2 bg-bg-surface border border-bg-elevated rounded-xl text-text-secondary hover:text-brand-primary transition-all shadow-sm active:scale-90"
            title={theme === 'light' ? '切换至深色模式' : '切换至浅色模式'}
          >
            {theme === 'light'
              ? <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500/10" />
              : <Sun className="w-4 h-4 text-orange-400 fill-orange-400/10" />}
          </button>
        </div>

        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-primary transition-colors" />
          <input
            type="text"
            placeholder="搜索流水号/功能..."
            className="bg-bg-surface border border-bg-elevated rounded-full py-1.5 pl-10 pr-4 text-[10px] w-64 focus:outline-none focus:border-brand-primary/30 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-bg-elevated">
          <div className="text-right">
            <p className="ui-nowrap text-[10px] font-bold text-text-primary uppercase tracking-widest leading-none">{user?.name}</p>
            <p className="ui-nowrap text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-1">
              {user?.role === 'employee'
                ? '基层员工'
                : user?.role === 'county_head'
                  ? '县级主管'
                  : user?.role === 'city_head'
                    ? '市级主管'
                    : user?.role === 'admin'
                      ? '系统管理员'
                      : '最高权限'}
            </p>
          </div>
          <div
            onClick={() => navigate('profile')}
            className="w-10 h-10 rounded-xl bg-bg-elevated border border-white/5 overflow-hidden cursor-pointer hover:border-brand-primary transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="text-text-muted w-5 h-5" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
