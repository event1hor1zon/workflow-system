import {
  Activity,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Hammer,
  Headphones,
  Layers,
  LucideIcon,
  Network,
  Radio,
  Route,
  ShieldCheck,
  Signal,
  Siren,
  Users,
} from 'lucide-react';
import { DepartmentSlug } from '../types';

export interface DepartmentMetric {
  label: string;
  value: string;
  hint: string;
}

export interface DepartmentCapability {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface DepartmentScenario {
  title: string;
  summary: string;
}

export interface DepartmentStep {
  title: string;
  description: string;
}

export interface DepartmentCardTheme {
  card: string;
  orb: string;
  icon: string;
  chip: string;
  strip: string;
  arrow: string;
}

export interface DepartmentCard {
  slug: DepartmentSlug;
  name: string;
  tag: string;
  desc: string;
  icon: LucideIcon;
  theme: DepartmentCardTheme;
}

const unifiedCardThemeBase = {
  card: 'bg-gradient-to-br from-sky-50 via-white to-cyan-50 border-sky-200/70 shadow-[0_22px_60px_rgba(59,130,246,0.12)] dark:from-sky-500/10 dark:via-bg-surface/90 dark:to-cyan-500/10 dark:border-sky-500/20',
  orb: 'bg-sky-300/30 dark:bg-sky-400/20',
  icon: 'border-sky-200/80 bg-sky-500/10 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300',
  chip: 'border-sky-200/60 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200',
  strip: 'from-sky-400 via-blue-500 to-cyan-400',
  arrow: 'bg-sky-500 text-white shadow-[0_14px_30px_rgba(59,130,246,0.25)]',
} satisfies DepartmentCardTheme;

export interface DepartmentProfile {
  slug: DepartmentSlug;
  name: string;
  shortName: string;
  heroTag: string;
  heroTitle: string;
  heroSummary: string;
  routeNote: string;
  gradient: string;
  glow: string;
  icon: LucideIcon;
  metrics: DepartmentMetric[];
  capabilities: DepartmentCapability[];
  scenarios: DepartmentScenario[];
  steps: DepartmentStep[];
}

export const departmentProfiles: Record<DepartmentSlug, DepartmentProfile> = {
  network: {
    slug: 'network',
    name: '网络部',
    shortName: 'NET',
    heroTag: '基础网络 / 核心调度',
    heroTitle: '网络部负责全市网络能力支撑与故障统筹',
    heroSummary:
      '承接县公司网络部负责人上送的网络类工单，完成网络侧定位、资源协调、跨系统联调与恢复闭环，是全链路协同的核心枢纽。',
    routeNote: '适用于网络故障、链路波动、设备告警、容量瓶颈和跨域资源协调类问题。',
    gradient: 'from-sky-500/20 via-brand-primary/15 to-cyan-400/20',
    glow: 'shadow-[0_30px_120px_rgba(59,130,246,0.18)]',
    icon: Network,
    metrics: [
      { label: '核心链路可视化', value: '24x7', hint: '实时监测骨干、接入与传输链路' },
      { label: '跨域联调窗口', value: '3级', hint: '县公司、市公司、外部厂家协同通道' },
      { label: '平均定位速度', value: '<15m', hint: '重大网络异常优先进入快处流程' },
    ],
    capabilities: [
      { title: '网络故障定位', description: '聚合告警、链路状态和设备视图，快速缩小故障范围。', icon: Signal },
      { title: '资源与容量调度', description: '对接核心资源池，处理扩容、割接、链路迁转和资源协调。', icon: Activity },
      { title: '跨团队联动', description: '当问题涉及工程、客户侧或第三方时，发起跨部门协同闭环。', icon: ArrowRightLeft },
      { title: '风险处置与通报', description: '重大事件形成分级响应与领导视图，保障全局可控。', icon: ShieldCheck },
    ],
    scenarios: [
      { title: '专线中断', summary: '识别中断范围、影响客户、回切方案与恢复时间。' },
      { title: '无线回传异常', summary: '排查承载链路、节点告警与带宽抖动根因。' },
      { title: '网络容量告急', summary: '评估热点区域和资源调度窗口，形成扩容动作。' },
    ],
    steps: [
      { title: '接单判定', description: '网络部负责人确认工单归属，判断是否需要转交工程建设部或客户响应中心。' },
      { title: '分级处理', description: '按普通、紧急、重大定义优先级，并补充技术处理意见。' },
      { title: '协同闭环', description: '处理完成后进入发起人确认，重大工单同步进入最高领导确认。' },
    ],
  },
  engineering: {
    slug: 'engineering',
    name: '工程建设部',
    shortName: 'ENG',
    heroTag: '建设交付 / 项目推进',
    heroTitle: '工程建设部负责建设类任务落地与施工交付',
    heroSummary:
      '承接资源建设、施工改造、工程扩容与交付类工单，统筹现场计划、供应链配合和项目风险，是建设实施与交付验收的责任中心。',
    routeNote: '适用于新建站点、线路改造、施工配套、扩容建设、设备上架与工程验收类需求。',
    gradient: 'from-amber-400/20 via-orange-400/15 to-rose-400/20',
    glow: 'shadow-[0_30px_120px_rgba(251,146,60,0.2)]',
    icon: Layers,
    metrics: [
      { label: '工程排产视窗', value: '7d', hint: '按周滚动安排施工资源与现场窗口' },
      { label: '交付节点控制', value: '12项', hint: '覆盖立项、勘察、施工、验收全过程' },
      { label: '建设风险预警', value: '实时', hint: '站点、线路、材料、审批状态同步监控' },
    ],
    capabilities: [
      { title: '施工计划统筹', description: '统一管理现场资源、排产计划与建设窗口，降低延误风险。', icon: Hammer },
      { title: '资源建设落地', description: '承接扩容、新建、改造类工单，输出可执行施工方案。', icon: Building2 },
      { title: '交付验收闭环', description: '跟踪施工结果、验收节点与上线条件，保证可交付。', icon: ClipboardCheck },
      { title: '多方协调推进', description: '对接县公司、供应商与外部单位，推进工程节点准时达成。', icon: Users },
    ],
    scenarios: [
      { title: '新增覆盖建设', summary: '面向盲区补点、站址接入、勘察设计与施工推进。' },
      { title: '传输线路改造', summary: '处理迁改、扩容、割接和现场资源冲突问题。' },
      { title: '设备安装上架', summary: '统筹物料到货、现场条件与联调验收计划。' },
    ],
    steps: [
      { title: '建设可行性判断', description: '识别需求是否属于工程交付范围，并评估资源与时间窗口。' },
      { title: '施工执行推进', description: '组织现场施工、节点跟催、问题回传和阶段汇报。' },
      { title: '验收回单', description: '提交交付结论与说明，进入发起人或领导确认。' },
    ],
  },
  maintenance: {
    slug: 'maintenance',
    name: '客户响应中心',
    shortName: 'CSR',
    heroTag: '客户感知 / 服务修复',
    heroTitle: '客户响应中心负责客户侧感知问题接诉即办',
    heroSummary:
      '承接客户投诉、服务感知、故障反馈与体验修复类工单，强调时效、反馈和服务闭环，是连接客户感知与内部处置的第一窗口。',
    routeNote: '适用于投诉升级、体验异常、业务中断反馈、重点客户响应和服务恢复确认类场景。',
    gradient: 'from-emerald-400/20 via-brand-secondary/15 to-teal-400/20',
    glow: 'shadow-[0_30px_120px_rgba(16,185,129,0.18)]',
    icon: Radio,
    metrics: [
      { label: '客户响应 SLA', value: '5m', hint: '重点工单快速建立客户回执与跟进动作' },
      { label: '闭环回访覆盖', value: '100%', hint: '每张单都有结果反馈与满意度触点' },
      { label: '高敏事件通道', value: '1键', hint: '重大感知问题可快速升级至领导视图' },
    ],
    capabilities: [
      { title: '投诉接入与研判', description: '识别客户影响范围、业务中断等级与紧急程度。', icon: Headphones },
      { title: '服务恢复联动', description: '推动网络、工程等部门协同处理，缩短客户无感恢复时间。', icon: Route },
      { title: '回访与解释沟通', description: '统一输出处理进展、恢复说明和回访反馈记录。', icon: Users },
      { title: '重大舆情预警', description: '客户感知类重大事件触发升级机制和领导确认链路。', icon: Siren },
    ],
    scenarios: [
      { title: '重点客户投诉', summary: '快速建立处置人、响应口径与跟进回执。' },
      { title: '业务体验下降', summary: '定位是否网络、工程或服务侧原因并推动恢复。' },
      { title: '批量用户感知异常', summary: '识别影响范围并同步升级到重大事件处理链路。' },
    ],
    steps: [
      { title: '受理建联', description: '确认客户影响与紧急程度，建立快速反馈通道。' },
      { title: '协同修复', description: '联动相关责任部门处置，持续同步处理进展。' },
      { title: '结果回访', description: '完成恢复说明与满意度确认，推动工单闭环。' },
    ],
  },
};

export const departmentCards: DepartmentCard[] = [
  {
    slug: 'network',
    name: '网络部',
    tag: '基础支撑',
    desc: '负责市级网络支撑、能力调度、网络问题定位与资源协调。',
    icon: Network,
    theme: unifiedCardThemeBase,
  },
  {
    slug: 'engineering',
    name: '工程建设部',
    tag: '基建交付',
    desc: '负责建设类需求落地、施工推进、工程交付与资源建设协同。',
    icon: Layers,
    theme: unifiedCardThemeBase,
  },
  {
    slug: 'maintenance',
    name: '客户响应中心',
    tag: '服务感知',
    desc: '负责客户响应、交付收口和服务感知类工单的处理闭环。',
    icon: Radio,
    theme: unifiedCardThemeBase,
  },
];

export const getDepartmentProfile = (slug?: string | null) => {
  if (!slug) return null;
  return departmentProfiles[slug as DepartmentSlug] ?? null;
};
