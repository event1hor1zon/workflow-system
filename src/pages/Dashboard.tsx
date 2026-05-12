import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Globe,
  Clock,
  Zap,
  Network,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { ordersApi } from '../api/order';
import { Page } from '../types';
import { departmentCards } from '../lib/departments';

interface DashboardProps {
  navigate: (page: Page, id?: string) => void;
}

export default function Dashboard({ navigate }: DashboardProps) {
  const [todayActiveCount, setTodayActiveCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTodayActiveCount = async () => {
      try {
        const response = await ordersApi.getList();
        if (cancelled) return;

        const today = new Date();
        const isSameDay = (value?: string | Date | null) => {
          if (!value) return false;
          const date = new Date(value);
          return date.getFullYear() === today.getFullYear()
            && date.getMonth() === today.getMonth()
            && date.getDate() === today.getDate();
        };

        const activeCount = (response.orders || []).filter((order: any) => {
          const isActiveStatus = !['completed', 'rejected'].includes(order.status);
          return isActiveStatus && (isSameDay(order.createTime) || isSameDay(order.updateTime));
        }).length;

        setTodayActiveCount(activeCount);
      } catch (error) {
        if (!cancelled) {
          setTodayActiveCount(0);
        }
      }
    };

    loadTodayActiveCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8 lg:p-12 space-y-16">
      <section className="relative overflow-hidden group rounded-[48px] bg-bg-surface/20 backdrop-blur-3xl border border-white/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-brand-primary/10 to-transparent opacity-50 blur-3xl" />
        <div className="absolute inset-0 tech-grid opacity-20" />

        <div className="relative flex flex-col lg:flex-row items-center gap-16 p-12 lg:p-20 min-h-[500px]">
          <div className="flex-1 space-y-12 z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em]">次世代指挥中心</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none text-text-primary">
                <span className="block">构建未来</span>
                <span className="block mt-3 lg:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-500 to-brand-secondary">
                  协作生态
                </span>
              </h1>
              <p className="text-text-secondary max-w-sm text-lg leading-relaxed opacity-60">
                登录后按工号自动识别所属公司和权限，新建工单仅需填写详情描述，系统自动流转到对应公司网络部负责人。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => navigate('create-ticket')}
                className="group relative flex items-center justify-between pl-8 pr-4 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-[40px] shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all hover:translate-y-[-4px] active:scale-95 min-w-[280px]"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black italic tracking-widest leading-none">启动核心任务</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                  <Plus className="w-8 h-8" />
                </div>
                <div className="absolute inset-[-4px] rounded-[44px] border border-brand-primary/30 animate-pulse" />
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="flex-1 relative perspective-[2000px] hidden lg:block"
          >
            <div className="relative w-full h-[450px] flex items-center justify-center">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0,transparent_70%)] [transform:rotateX(60deg)] opacity-30" />

              <div className="absolute inset-0 flex justify-around items-end px-12 opacity-20 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [20, 100 + Math.random() * 200, 20],
                      opacity: [0, 0.4, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 4,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-1 bg-gradient-to-t from-brand-primary via-purple-500 to-transparent rounded-full"
                  />
                ))}
              </div>

              <div className="relative h-full w-full flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    className="w-[380px] h-[380px] border border-dashed border-brand-primary/10 rounded-full"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-[320px] h-[320px] border border-brand-primary/20 rounded-full border-t-brand-primary/40 border-t-2"
                  />
                  <motion.div
                    animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute w-[260px] h-[260px] border border-white/5 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0,transparent_70%)]"
                  />
                </div>

                <motion.div
                  animate={{ y: [-15, 15, -15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-20"
                >
                  <div className="w-56 h-56 glass-card bg-bg-surface/20 flex items-center justify-center relative overflow-hidden group border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-purple-500/10" />
                    <Network className="w-24 h-24 text-brand-primary animate-pulse" />
                    <div className="absolute inset-2 border border-brand-primary/10 rounded-[28px]" />
                  </div>
                </motion.div>

                <div className="absolute inset-x-10 inset-y-10 pointer-events-none">
                  <div className="absolute top-0 left-0 space-y-2">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-brand-primary/30 rounded-tl-lg" />
                    <div className="text-[8px] font-mono text-brand-primary/40 font-bold tracking-widest px-2">SYNERGY_AI.V4</div>
                  </div>
                  <div className="absolute bottom-0 right-0 text-right space-y-2 flex flex-col items-end">
                    <div className="text-[8px] font-mono text-white/30 font-bold tracking-[0.3em] bg-white/5 px-3 py-1 rounded">DEPT: NODE_ALPHA</div>
                    <div className="w-8 h-8 border-b-2 border-r-2 border-purple-500/30 rounded-br-lg" />
                  </div>
                </div>

                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -40, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      delay: i * 1.5,
                    }}
                    className="absolute text-[9px] font-mono text-brand-secondary/60 font-bold"
                    style={{
                      left: `${20 + i * 20}%`,
                      top: `${30 + i * 10}%`,
                    }}
                  >
                    0x{Math.random().toString(16).slice(2, 6).toUpperCase()}..OK
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">职能支撑矩阵</h2>
          </div>
          <div className="h-px flex-1 bg-bg-elevated mx-8 hidden md:block" />
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">领域矩阵 / 协同单元</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentCards.map((dept, i) => (
            <motion.button
              key={dept.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, scale: 1.01 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, type: 'spring', stiffness: 220, damping: 20 }}
              onClick={() => navigate('department-detail', dept.slug)}
              className={`group relative overflow-hidden rounded-[34px] border p-8 text-left cursor-pointer backdrop-blur-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 ${dept.theme.card}`}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], x: [0, 8, 0], y: [0, -6, 0] }}
                transition={{ duration: 10 + i, repeat: Infinity, ease: 'easeInOut' }}
                className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full ${dept.theme.orb} blur-3xl opacity-70`}
              />
              <motion.div
                animate={{ opacity: [0.55, 0.95, 0.55] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${dept.theme.strip}`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.03)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)]" />

              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{ y: [0, -4, 0], rotate: [0, -3, 0] }}
                    transition={{ duration: 5.5 + i, repeat: Infinity, ease: 'easeInOut' }}
                    className={`flex h-16 w-16 items-center justify-center rounded-[28px] border shadow-[0_14px_32px_rgba(15,23,42,0.08)] ${dept.theme.icon}`}
                  >
                    <dept.icon className="w-8 h-8" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase ${dept.theme.chip}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {dept.tag}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-text-primary">{dept.name}</h3>
                  <p className="text-sm leading-7 text-text-secondary opacity-85">{dept.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/40 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-muted transition-colors group-hover:text-text-primary">查看部门详情</span>
                  <motion.div
                    whileHover={{ x: 6, rotate: 12, scale: 1.04 }}
                    transition={{ duration: 0.25 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${dept.theme.arrow}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <section className="glass-card p-8 flex flex-row items-center gap-6 border-none shadow-sm bg-bg-surface/20">
          <div className="p-3 rounded-2xl bg-brand-primary/10">
            <Zap className="text-brand-primary w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono">99.98%</div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">系统可靠性</p>
          </div>
        </section>
        <section className="glass-card p-8 flex flex-row items-center gap-6 border-none shadow-sm bg-bg-surface/20">
          <div className="p-3 rounded-2xl bg-brand-secondary/10">
            <Activity className="text-brand-secondary w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{todayActiveCount === null ? '--' : todayActiveCount.toLocaleString('zh-CN')}</div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">今日可见活跃工单</p>
          </div>
        </section>
        <section className="glass-card p-8 flex flex-row items-center gap-6 border-none shadow-sm bg-bg-surface/20">
          <div className="p-3 rounded-2xl bg-text-primary/5">
            <Clock className="text-text-primary w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono tracking-tighter">04:12:44</div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">系统持续运行时长</p>
          </div>
        </section>
      </div>
    </div>
  );
}
