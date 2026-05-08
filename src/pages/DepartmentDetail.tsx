import { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getDepartmentProfile } from '../lib/departments';
import { Page } from '../types';

interface DepartmentDetailProps {
  slug: string | null;
  navigate: (page: Page, id?: string) => void;
}

export default function DepartmentDetail({ slug, navigate }: DepartmentDetailProps) {
  const profile = getDepartmentProfile(slug);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  if (!profile) {
    return (
      <div className="p-8 lg:p-12">
        <section className="glass-card bg-bg-surface/30 text-center space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-text-muted">Department / Missing</p>
          <h1 className="ui-nowrap text-3xl font-black tracking-tight">未找到该部门页面</h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            当前访问的部门标识不存在。你可以返回首页，从职能支撑矩阵重新进入对应部门。
          </p>
          <button
            onClick={() => navigate('dashboard')}
            className="mx-auto inline-flex items-center gap-3 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-[0_20px_40px_rgba(59,130,246,0.28)] transition-all hover:-translate-y-1 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </section>
      </div>
    );
  }

  const HeroIcon = profile.icon;

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <section className={`relative overflow-hidden rounded-[40px] border border-white/15 bg-bg-surface/20 backdrop-blur-3xl ${profile.glow}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${profile.gradient}`} />
        <div className="absolute inset-0 tech-grid opacity-15" />

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-6 max-w-3xl">
              <button
                onClick={() => navigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-text-secondary transition-all hover:border-brand-primary/40 hover:text-text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </button>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  <HeroIcon className="w-4 h-4 text-brand-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary">{profile.heroTag}</span>
                </div>
                <div className="space-y-4">
                  <p className="ui-nowrap text-[11px] font-bold uppercase tracking-[0.35em] text-text-muted">
                    {profile.shortName} / Department Profile
                  </p>
                  <h1 className="max-w-4xl text-3xl font-black tracking-tight text-text-primary text-balance lg:text-5xl lg:leading-[0.95]">
                    {profile.heroTitle}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-text-secondary lg:text-lg">
                    {profile.heroSummary}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="grid min-w-[320px] gap-3 sm:grid-cols-3 xl:max-w-xl"
            >
              {profile.metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
                >
                  <div className="ui-nowrap text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">0{index + 1}</div>
                  <div className="ui-nowrap mt-5 text-3xl font-black tracking-tight text-text-primary">{metric.value}</div>
                  <div className="ui-nowrap mt-2 text-sm font-semibold text-text-primary">{metric.label}</div>
                  <p className="ui-nowrap mt-2 text-xs leading-6 text-text-secondary">{metric.hint}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="glass-card bg-bg-surface/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Department Mission</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">核心职责模块</h2>
            </div>
              <div className="ui-nowrap hidden rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary md:block">
                {profile.name}
              </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {profile.capabilities.map((capability, index) => (
              <motion.article
                key={capability.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-[28px] border border-white/10 bg-bg-base/50 p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/30 hover:bg-bg-base/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <capability.icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="ui-nowrap mt-6 text-lg font-bold text-text-primary">{capability.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{capability.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="glass-card bg-bg-surface/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Route Note</p>
          <h2 className="ui-nowrap mt-3 text-2xl font-black tracking-tight">适用范围</h2>
          <p className="mt-4 text-sm leading-7 text-text-secondary">{profile.routeNote}</p>

          <div className="mt-8 space-y-4">
            {profile.scenarios.map((scenario, index) => (
              <div
                key={scenario.title}
                className="rounded-[24px] border border-white/10 bg-bg-base/45 p-5"
              >
                <div className="ui-nowrap text-[10px] font-bold uppercase tracking-[0.24em] text-brand-primary">场景 0{index + 1}</div>
                <h3 className="ui-nowrap mt-3 text-base font-bold text-text-primary">{scenario.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{scenario.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-card bg-bg-surface/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Workflow Insight</p>
            <h2 className="ui-nowrap mt-3 text-2xl font-black tracking-tight">进入该部门后的处理节奏</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500">
            <Sparkles className="w-4 h-4" />
            与当前工单流转规则保持一致
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {profile.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08 }}
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-bg-base/50 p-6"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-primary/70 to-transparent" />
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-sm font-black text-brand-primary">
                {index + 1}
              </div>
              <h3 className="ui-nowrap mt-6 text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-bg-base/45 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="ui-nowrap text-lg font-bold text-text-primary">二级页面已接入首页入口</h3>
            </div>
          </div>
            <button
              onClick={() => navigate('tickets')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-text-primary transition-all hover:border-brand-primary/30 hover:text-brand-primary"
            >
              查看我的工单
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
