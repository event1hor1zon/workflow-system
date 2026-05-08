import { Activity, Building2, ShieldCheck, UserRound } from 'lucide-react';
import { Page, User } from '../types';

interface ProfileProps {
  user: User | null;
  navigate: (page: Page, id?: string) => void;
}

export default function Profile({ user, navigate }: ProfileProps) {
  if (!user) return null;

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="ui-nowrap text-4xl font-bold tracking-tight">账户中心</h1>
        <p className="ui-nowrap text-text-secondary">当前账户信息已按工号自动对齐，可在这里确认角色权限与归属单位。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 bg-bg-surface/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <UserRound className="text-brand-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">当前账号</p>
            <h2 className="ui-nowrap text-2xl font-bold mt-2">{user.name}</h2>
            <p className="ui-nowrap text-text-secondary mt-2">{user.id}</p>
          </div>
        </div>

        <div className="glass-card p-8 bg-bg-surface/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center">
            <Building2 className="text-brand-secondary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">所属单位</p>
            <h2 className="ui-nowrap text-2xl font-bold mt-2">{user.city}</h2>
            <p className="ui-nowrap text-text-secondary mt-2">{user.county} / {user.department || '自动识别角色部门'}</p>
          </div>
        </div>

        <div className="glass-card p-8 bg-bg-surface/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-warning/10 flex items-center justify-center">
            <ShieldCheck className="text-brand-warning" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">权限角色</p>
            <h2 className="ui-nowrap text-2xl font-bold mt-2">{user.role}</h2>
            <p className="ui-nowrap text-text-secondary mt-2">系统根据工号和员工档案自动匹配可见工单与可执行动作。</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-10 bg-bg-surface/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Activity className="text-brand-primary" />
          </div>
          <div>
            <h3 className="ui-nowrap text-xl font-bold">进入工单工作台</h3>
            <p className="ui-nowrap text-text-secondary">查看你当前可见的工单、办理进度和确认事项。</p>
          </div>
        </div>
        <button
          onClick={() => navigate('tickets')}
          className="bg-brand-primary hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-full shadow-lg transition-all active:scale-[0.98]"
        >
          查看工单
        </button>
      </div>
    </div>
  );
}
