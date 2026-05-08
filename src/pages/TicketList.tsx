import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Clock,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { ordersApi } from '../api/order';
import { mapOrderToTicket } from '../lib/workflow';
import { Page, Ticket, User, ReferenceData } from '../types';

interface TicketListProps {
  navigate: (page: Page, id?: string) => void;
  user: User | null;
  refs: ReferenceData;
}

export default function TicketList({ navigate, user, refs }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGroup, setActiveGroup] = useState<'ongoing' | 'rejected' | 'completed'>('ongoing');

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await ordersApi.getList();
        if (cancelled) return;
        const nextTickets = (response.orders || []).map((item: any) => mapOrderToTicket(item, refs));
        setTickets(nextTickets);
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || '工单加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadTickets();
    }

    return () => {
      cancelled = true;
    };
  }, [user, refs]);

  const visibleTickets = useMemo(() => {
    if (!user) return [];

    return tickets.filter((ticket) => {
      if (user.role === 'top_leader' || user.role === 'admin') return true;
      if (user.role === 'county_head') return ticket.creator.county === user.county;
      if (user.role === 'city_head') {
        return ticket.currentDepartmentId === user.departmentId ||
          (ticket.departmentTasks || []).some((task) => task.departmentId === user.departmentId) ||
          (ticket.assignedDepartmentIds || []).includes(user.departmentId || -1);
      }
      return ticket.creator.backendId === user.backendId;
    });
  }, [tickets, user]);

  const getTicketGroup = (ticket: Ticket) => {
    if (ticket.status === 'rejected') return 'rejected';
    if (ticket.status === 'completed') return 'completed';
    return 'ongoing';
  };

  const groupedTickets = useMemo(() => ({
    ongoing: visibleTickets.filter((ticket) => getTicketGroup(ticket) === 'ongoing'),
    rejected: visibleTickets.filter((ticket) => getTicketGroup(ticket) === 'rejected'),
    completed: visibleTickets.filter((ticket) => getTicketGroup(ticket) === 'completed'),
  }), [visibleTickets]);

  const activeTickets = groupedTickets[activeGroup];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending_county': return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20';
      case 'pending_city': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'waiting_confirm': return 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20';
      case 'completed': return 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20';
      default: return 'bg-bg-elevated text-text-secondary border-bg-elevated';
    }
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case 'major': return { label: '重大', color: 'text-brand-danger' };
      case 'urgent': return { label: '紧急', color: 'text-brand-warning' };
      case 'normal': return { label: '普通', color: 'text-text-muted' };
      default: return null;
    }
  };

  const getProcessingLabel = (ticket: Ticket) => (
    (ticket.departmentTasks || []).length > 1 ? '协同处理中' : '正在处理'
  );

  if (!user) return null;

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10">
      <header className="flex justify-between items-end pb-8 border-b border-bg-elevated">
        <div className="space-y-1">
          <h1 className="ui-nowrap text-4xl font-bold tracking-tight">个人工作台</h1>
        </div>
        <button
          onClick={() => navigate('create-ticket')}
          className="bg-brand-primary hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>新建协同工单</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 flex items-center gap-6 bg-bg-surface/20">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
            <Activity className="text-brand-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">待处理任务</p>
            <p className="text-2xl font-bold font-mono">{groupedTickets.ongoing.length}</p>
          </div>
        </div>
        <div className="glass-card p-8 flex items-center gap-6 bg-bg-surface/20">
          <div className="w-12 h-12 bg-brand-warning/10 rounded-2xl flex items-center justify-center">
            <Clock className="text-brand-warning" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">流程平均耗时</p>
            <p className="text-2xl font-bold font-mono">1.2h</p>
          </div>
        </div>
        <div className="glass-card p-8 flex items-center gap-6 bg-bg-surface/20">
          <div className="w-12 h-12 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="text-brand-secondary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">本月已归档</p>
            <p className="text-2xl font-bold font-mono">{groupedTickets.completed.length}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 md:p-5 bg-bg-surface/20">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: 'ongoing', label: '正在进行', count: groupedTickets.ongoing.length },
              { key: 'rejected', label: '驳回', count: groupedTickets.rejected.length },
              { key: 'completed', label: '已完成', count: groupedTickets.completed.length },
            ].map((group) => {
              const active = activeGroup === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key as typeof activeGroup)}
                  className={`inline-flex h-14 w-full items-center justify-between gap-4 rounded-[22px] border px-5 text-sm font-bold transition-all ${
                    active
                      ? 'border-brand-primary bg-brand-primary text-white shadow-[0_14px_28px_rgba(59,130,246,0.18)]'
                      : 'border-bg-elevated bg-white/80 text-text-secondary hover:border-brand-primary/30 hover:text-brand-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                  }`}
                >
                  <span className="text-[15px] leading-none tracking-tight">{group.label}</span>
                  <span className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[11px] font-black ${active ? 'bg-white/20 text-white' : 'bg-bg-base text-text-muted'}`}>
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
      </div>

      {loading && (
        <div className="glass-card p-10 text-center text-text-secondary">工单加载中...</div>
      )}

      {!loading && error && (
        <div className="glass-card p-10 text-center text-brand-danger">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6">
          {activeTickets.map((ticket, i) => {
            const visibleSeverity =
              ticket.status === 'pending_county' || ticket.status === 'pending_city'
                ? undefined
                : ticket.severity;
            const sev = getSeverityLabel(visibleSeverity);
            return (
              <motion.article
                key={ticket.backendId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate('ticket-detail', String(ticket.backendId))}
                className="glass-card group flex flex-col md:flex-row gap-8 items-start md:items-center hover:border-brand-primary/40 cursor-pointer bg-bg-surface/30 p-8"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusStyle(ticket.status)}`}>
                      {ticket.status === 'pending_county'
                        ? '待县审核'
                        : ticket.status === 'pending_city'
                          ? '待市定级'
                          : ticket.status === 'in_progress'
                            ? getProcessingLabel(ticket)
                            : ticket.status === 'waiting_confirm'
                              ? '待确认'
                            : ticket.status === 'rejected'
                              ? '已驳回'
                              : '已归档'}
                    </span>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{ticket.id}</p>
                  </div>
                  <h2 className="ui-nowrap text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">{ticket.title}</h2>
                  <p className="text-sm text-text-secondary line-clamp-1">{ticket.description}</p>
                  {(ticket.departmentTasks || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(ticket.departmentTasks || []).map((task) => (
                        <span
                          key={task.departmentId}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                            task.completed
                              ? 'border-brand-secondary/20 text-brand-secondary bg-brand-secondary/5'
                              : 'border-brand-primary/20 text-brand-primary bg-brand-primary/5'
                          }`}
                        >
                          {task.departmentName}{task.completed ? ' · 已完成' : ' · 待处理'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-8 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-bg-elevated">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-base border border-bg-elevated overflow-hidden">
                      <img src={ticket.creator.avatar} alt={ticket.creator.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="ui-nowrap text-xs font-bold">{ticket.creator.name}</p>
                      <p className="ui-nowrap text-[10px] text-text-muted uppercase tracking-wider">{ticket.creator.county}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    {sev && (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${sev.color}`}>
                        等级: {sev.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-text-muted font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
          {activeTickets.length === 0 && (
            <div className="glass-card p-10 text-center text-text-muted">
              当前分类下没有工单
            </div>
          )}
        </div>
      )}
    </div>
  );
}
