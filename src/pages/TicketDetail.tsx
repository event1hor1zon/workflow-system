import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Clock,
  Check,
  History,
  Zap,
  User as UserIcon,
  ShieldAlert,
  Building2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
} from 'lucide-react';
import { departmentsApi } from '../api/department';
import { ordersApi } from '../api/order';
import { mapOrderToTicket, toBackendPriority } from '../lib/workflow';
import { Page, ReferenceData, Ticket, User } from '../types';

interface TicketDetailProps {
  id: string | null;
  navigate: (page: Page, id?: string) => void;
  user: User | null;
  refs: ReferenceData;
  onChanged?: () => void;
}

export default function TicketDetail({ id, navigate, user, refs, onChanged }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [selectedCountyDeptIds, setSelectedCountyDeptIds] = useState<number[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<'normal' | 'urgent' | 'major' | ''>('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id || !user) return;

      setLoading(true);
      setError('');

      try {
        const [detail, transferDepartments] = await Promise.all([
          ordersApi.getById(id),
          departmentsApi.getThreeDepartments(),
        ]);

        if (cancelled) return;
        setTicket(mapOrderToTicket(detail, refs));
        setDepartments(Array.isArray(transferDepartments) ? transferDepartments : []);
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || '工单详情加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, user, refs]);

  const refresh = async () => {
    if (!id) return;
    const detail = await ordersApi.getById(id);
    setTicket(mapOrderToTicket(detail, refs));
    onChanged?.();
  };

  useEffect(() => {
    if (ticket?.status === 'pending_city') {
      setSelectedPriority('');
      setSelectedDeptIds((ticket.assignedDepartmentIds || []).filter((departmentId) => departmentId !== user?.departmentId));
      setProofFiles([]);
    }
  }, [ticket?.backendId, ticket?.status, ticket?.assignedDepartmentIds, user?.departmentId]);

  const issueAttachments = useMemo(
    () => (ticket?.attachments || []).filter((attachment) => attachment.kind === 'issue'),
    [ticket?.attachments],
  );

  const proofAttachments = useMemo(
    () => (ticket?.attachments || []).filter((attachment) => attachment.kind === 'proof'),
    [ticket?.attachments],
  );

  const departmentTasks = useMemo(
    () => ticket?.departmentTasks || [],
    [ticket?.departmentTasks],
  );

  const assignedCityDepartmentIds = useMemo(
    () => ticket?.assignedDepartmentIds || [],
    [ticket?.assignedDepartmentIds],
  );

  const assignedCityDepartments = useMemo(
    () => departments.filter((department) => assignedCityDepartmentIds.includes(department.id)),
    [departments, assignedCityDepartmentIds],
  );

  const processingTitle = useMemo(() => {
    if (departmentTasks.length === 1) {
      return `${departmentTasks[0]?.departmentName || '市级部门'}处理`;
    }

    if (departmentTasks.length > 1) {
      return '跨部门业务协同处理';
    }

    return '市级部门处理';
  }, [departmentTasks]);

  const processingDescription = useMemo(() => {
    if (departmentTasks.length === 1) {
      return `${departmentTasks[0]?.departmentName || '当前部门'}完成处理后返回发起人确认`;
    }

    if (departmentTasks.length > 1) {
      return '协同部门执行任务，全部完成后返回发起人确认';
    }

    return '等待市级负责人完成定级后开始处理';
  }, [departmentTasks]);

  const processingStatusLabel = departmentTasks.length > 1 ? '协同处理中' : '正在处理';
  const visibleSeverity =
    !ticket || ticket.status === 'pending_county' || ticket.status === 'pending_city'
      ? undefined
      : ticket.severity;

  const rejectionEntry = useMemo(
    () => [...(ticket?.history || [])].reverse().find((entry) => entry.status.includes('驳回')) || null,
    [ticket?.history],
  );

  const currentCityDepartment = useMemo(
    () => departments.find((department) => department.id === ticket?.currentDepartmentId),
    [departments, ticket?.currentDepartmentId],
  );

  const collaborativeDepartments = useMemo(
    () => departments.filter((department) => department.id !== ticket?.currentDepartmentId),
    [departments, ticket?.currentDepartmentId],
  );

  const countySelectedDepartments = useMemo(
    () => departments.filter((department) => selectedCountyDeptIds.includes(department.id)),
    [departments, selectedCountyDeptIds],
  );

  const selectedCollaborativeDepartmentNames = useMemo(
    () => departments
      .filter((department) => selectedDeptIds.includes(department.id))
      .map((department) => department.name),
    [departments, selectedDeptIds],
  );

  const hasCountyPresetCollaboration = assignedCityDepartmentIds.length > 1;

  if (!ticket || !user) {
    return loading ? (
      <div className="p-10 max-w-6xl mx-auto">
        <div className="glass-card p-10 text-center text-text-secondary">工单详情加载中...</div>
      </div>
    ) : (
      <div className="p-10 max-w-6xl mx-auto">
        <div className="glass-card p-10 text-center text-brand-danger">{error || '未找到工单'}</div>
      </div>
    );
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  };

  const getFileIcon = (file: Pick<File, 'type'>) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const openProofPicker = () => {
    proofInputRef.current?.click();
  };

  const handleProofChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;

    setProofFiles((current) => [...current, ...nextFiles]);
    event.target.value = '';
  };

  const removeProofFile = (index: number) => {
    setProofFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const uploadProofAttachments = async () => {
    if (!ticket || proofFiles.length === 0) return 0;

    const uploadResults = await Promise.allSettled(
      proofFiles.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('kind', 'proof');
        return ordersApi.uploadAttachment(ticket.backendId, formData);
      }),
    );

    const failedCount = uploadResults.filter((item) => item.status === 'rejected').length;
    if (failedCount === 0) {
      setProofFiles([]);
    } else {
      window.alert(`有 ${failedCount} 个证明附件上传失败，你可以稍后继续补传。`);
    }

    return failedCount;
  };

  const handleCityDispatch = async () => {
    if (!ticket || !selectedPriority) return;

    const selectedDepartmentNames = departments
      .filter((department) => selectedDeptIds.includes(department.id))
      .map((department) => department.name);

    await ordersApi.process(ticket.backendId, {
      priority: toBackendPriority(selectedPriority),
      departmentIds: selectedDeptIds,
      comment: selectedDepartmentNames.length > 0
        ? `工单等级设定为：${selectedPriority === 'normal' ? '普通' : selectedPriority === 'urgent' ? '紧急' : '重大'}，协同部门：${selectedDepartmentNames.join('、')}`
        : `工单等级设定为：${selectedPriority === 'normal' ? '普通' : selectedPriority === 'urgent' ? '紧急' : '重大'}，单部门处理`,
    });

    await refresh();
  };

  const handleDepartmentComplete = async () => {
    if (!ticket || !canDepartmentComplete) return;

    if (proofFiles.length > 0) {
      const failedCount = await uploadProofAttachments();
      if (failedCount > 0) {
        return;
      }
    }

    await ordersApi.complete(ticket.backendId, {
      comment: `${user.name}已完成处理`,
    });

    await refresh();
  };

  const isCreator = user.backendId === ticket.creator.backendId;
  const isCountyHead = ticket.permissions.canAssign || (ticket.permissions.canReject && ticket.status === 'pending_county');
  const canCityDispatch =
    ticket.status === 'pending_city' &&
    user.role === 'city_head' &&
    (ticket.permissions.canProcess ||
      assignedCityDepartmentIds.includes(user.departmentId || -1) ||
      ticket.currentDepartmentId === user.departmentId);
  const canDepartmentComplete =
    ticket.status === 'in_progress' &&
    user.role === 'city_head' &&
    (ticket.permissions.canComplete || departmentTasks.some((task) => task.departmentId === user.departmentId && !task.completed));
  const isTopLeader = user.role === 'top_leader';

  const toggleDepartment = (departmentId: number) => {
    setSelectedDeptIds((current) => (
      current.includes(departmentId)
        ? current.filter((item) => item !== departmentId)
        : [...current, departmentId]
    ));
  };

  const toggleCountyDepartment = (departmentId: number) => {
    setSelectedCountyDeptIds((current) => (
      current.includes(departmentId)
        ? current.filter((item) => item !== departmentId)
        : [...current, departmentId]
    ));
  };

  const handleCountyApprove = async () => {
    if (!ticket || selectedCountyDeptIds.length === 0) return;

    const selectedDepartments = countySelectedDepartments;
    if (selectedDepartments.length === 0) return;

    await ordersApi.assign(ticket.backendId, {
      departmentId: selectedDepartments[0].id,
      departmentIds: selectedDepartments.map((department) => department.id),
      comment: selectedDepartments.length > 1
        ? `已同时提交至${selectedDepartments.map((department) => department.name).join('、')}，等待其中一位负责人完成定级后进入协作处理`
        : `已提交至${selectedDepartments[0].name}，等待负责人完成定级`,
    });

    await refresh();
  };

  const handleReject = async () => {
    if (!ticket) return;
    setRejectDialogOpen(true);
    setRejectReason('');
    setRejectError('');
  };

  const submitReject = async () => {
    if (!ticket || !rejectReason.trim()) return;

    setRejectSubmitting(true);
    try {
      await ordersApi.reject(ticket.backendId, { reason: rejectReason.trim() });
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectError('');
      await refresh();
    } catch (error: any) {
      setRejectError(error?.message || '驳回失败，请稍后重试');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!ticket) return;
    await ordersApi.confirm(ticket.backendId, {});
    await refresh();
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 pb-40">
      <header className="flex justify-between items-center">
        <button
          onClick={() => navigate('tickets')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回工单列表</span>
        </button>
        <div className="flex items-center gap-4">
          <p className="ui-nowrap text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-elevated px-4 py-2 rounded-xl">
            当前身份: {user.name} ({user.role === 'employee' ? '基层员工' : user.role === 'county_head' ? '县公司管理' : user.role === 'city_head' ? '市公司管理' : user.role === 'admin' ? '系统管理员' : '最高权限领导'})
          </p>
          <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {ticket.status === 'rejected' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-brand-danger/20 bg-brand-danger/5 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-danger/20 bg-brand-danger/10 text-brand-danger">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-brand-danger">工单已驳回</p>
                  <p className="text-sm text-text-muted">发起人可以查看原因并重新编辑后提交。</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/70 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">驳回原因</p>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {rejectionEntry?.desc || '暂无驳回原因'}
                </p>
              </div>
            </div>

            {isCreator && (
              <button
                onClick={() => navigate('create-ticket', String(ticket.backendId))}
                className="h-14 px-8 rounded-2xl bg-brand-primary text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                重新编辑并提交
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {isCountyHead && ticket.status === 'pending_county' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-brand-primary/20 p-8 bg-brand-primary/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-brand-primary">
              <Building2 className="w-6 h-6" />
              县级审批中枢
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-dashed border-brand-primary/20 bg-white/55 px-5 py-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-muted tracking-widest">转发至支撑中心</p>
                  <p className="text-sm text-text-muted/80">可单选，也可多选。核准后会提交给选中的市级部门，再由其中任意一位负责人完成工单定级。</p>
                </div>
                <span className="rounded-full border border-brand-primary/20 bg-brand-primary/6 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                  {selectedCountyDeptIds.length > 0 ? `已选 ${selectedCountyDeptIds.length} 个` : '待选择'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departments.map((department) => {
                  const active = selectedCountyDeptIds.includes(department.id);
                  return (
                    <button
                      key={department.id}
                      onClick={() => toggleCountyDepartment(department.id)}
                      className={`group rounded-3xl border p-5 text-left transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 ${
                        active
                          ? 'border-brand-primary/40 bg-brand-primary/10 ring-1 ring-brand-primary/10 shadow-[0_12px_28px_rgba(59,130,246,0.14)]'
                          : 'border-slate-200/80 bg-white/75 ring-1 ring-slate-200/70 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-brand-primary/30 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-base font-bold text-text-primary">{department.name}</p>
                          <p className="text-[10px] text-text-muted">{active ? '已加入协作' : '点击加入协作'}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                          active
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white border-slate-200/80 text-text-muted'
                        }`}>
                          {active ? <Check className="w-5 h-5" /> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <p className="text-sm text-text-muted/80">
                  单选就提交给对应市级负责人定级，多选则在定级完成后自动进入协作处理。
                </p>
                <div className="flex gap-4">
                  <button onClick={handleReject} className="h-14 px-8 border border-brand-danger/30 text-brand-danger font-bold rounded-2xl hover:bg-brand-danger/5 transition-all">拒绝请求</button>
                  <button
                    onClick={handleCountyApprove}
                    disabled={selectedCountyDeptIds.length === 0}
                    className="h-14 px-8 bg-brand-primary text-white font-bold rounded-2xl shadow-lg glow-blue disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {selectedCountyDeptIds.length > 1 ? '通过核准并提交市级定级' : '通过核准并提交市级'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {canCityDispatch && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-brand-warning/30 p-8 bg-brand-warning/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-brand-warning">
              <ShieldAlert className="w-6 h-6" />
              市级定级与协同派单
            </h3>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-text-muted tracking-widest">工单等级</p>
                    <p className="text-sm text-text-muted/80 mt-1">先完成工单等级设定，再进入正式处理。</p>
                  </div>
                  <span className="ui-nowrap text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {selectedPriority ? `已选 ${selectedPriority === 'normal' ? '普通' : selectedPriority === 'urgent' ? '紧急' : '重大'}` : '请选择等级'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'normal', title: '普通', desc: '常规处理，发起人确认结束' },
                    { value: 'urgent', title: '紧急', desc: '优先处置，仍由发起人确认' },
                    { value: 'major', title: '重大', desc: '发起人和最高领导双确认' },
                  ].map((option) => {
                    const active = selectedPriority === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedPriority(option.value as 'normal' | 'urgent' | 'major')}
                        className={`p-6 rounded-3xl text-left border transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 ${
                          active
                            ? 'bg-white/85 border-brand-primary/40 ring-1 ring-brand-primary/10 shadow-[0_14px_30px_rgba(59,130,246,0.14)]'
                            : 'bg-white/75 border-slate-200/80 ring-1 ring-slate-200/70 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-brand-primary/30 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <p className={`text-2xl font-black tracking-tight ${active ? 'text-brand-primary' : 'text-text-primary'}`}>
                            {option.title}
                          </p>
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                            active
                              ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary'
                              : 'border-slate-200/80 bg-white text-transparent'
                          }`}>
                            {active ? <Check className="w-5 h-5" /> : null}
                          </div>
                        </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasCountyPresetCollaboration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-text-muted tracking-widest">县级已圈定协同部门</p>
                      <p className="text-sm text-text-muted/80 mt-1">
                        这张单子已经由县级同时提交给多个市级部门。当前只需要其中任意一位负责人完成等级设定，定级后会自动进入协作处理。
                      </p>
                    </div>
                    <span className="ui-nowrap text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      已圈定 {assignedCityDepartments.length} 个
                    </span>
                  </div>

                  <div className="rounded-3xl border border-dashed border-brand-primary/20 bg-white/55 px-5 py-4">
                    <div className="flex flex-wrap gap-3">
                      {assignedCityDepartments.map((department) => (
                        <span
                          key={department.id}
                          className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/8 px-4 py-2 text-xs font-bold text-brand-primary"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {department.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-text-muted tracking-widest">协同部门</p>
                      <p className="text-sm text-text-muted/80 mt-1">
                        主处理部门为 {currentCityDepartment?.name || '当前部门'}。勾选一个或多个协同部门后，会同时分配给选中的部门并进入协作处理。
                      </p>
                    </div>
                    <span className="ui-nowrap text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {selectedDeptIds.length > 0 ? `已选 ${selectedDeptIds.length} 个` : '未选协同部门'}
                    </span>
                  </div>

                  <div className="rounded-3xl border border-dashed border-brand-primary/20 bg-white/55 px-5 py-4">
                    <p className="text-[10px] font-bold text-text-muted tracking-widest">当前协作模式</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-brand-primary/20 bg-brand-primary/8 px-3 py-1 text-xs font-bold text-brand-primary">
                        {selectedDeptIds.length > 0 ? '多选即协作' : '单部门处理'}
                      </span>
                      <span className="text-sm text-text-muted/80">
                        {selectedDeptIds.length > 0
                          ? `已选择 ${selectedCollaborativeDepartmentNames.join('、')}`
                          : '不勾选协同部门时，仅由主处理部门独立处理。'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {collaborativeDepartments.map((department) => {
                      const active = selectedDeptIds.includes(department.id);
                      return (
                        <button
                          key={department.id}
                          onClick={() => toggleDepartment(department.id)}
                          className={`p-5 rounded-3xl text-left border transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 ${
                            active
                              ? 'bg-brand-primary/10 border-brand-primary/40 ring-1 ring-brand-primary/10 shadow-[0_12px_24px_rgba(59,130,246,0.10)]'
                              : 'bg-white/75 border-slate-200/80 ring-1 ring-slate-200/70 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-brand-primary/30 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="ui-nowrap text-base font-bold text-text-primary">{department.name}</p>
                              <p className="text-[10px] text-text-muted">{active ? '已加入协同' : '点击加入协同'}</p>
                            </div>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                              active
                                ? 'bg-brand-primary text-white border-brand-primary'
                                : 'bg-white border-slate-200/80 text-text-muted'
                            }`}>
                              {active ? <Check className="w-5 h-5" /> : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <button
                  onClick={handleCityDispatch}
                  disabled={!selectedPriority}
                  className="h-14 px-8 bg-brand-warning text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {hasCountyPresetCollaboration
                    ? '确定等级并启动协作'
                    : selectedDeptIds.length > 0
                      ? '下发协同处理'
                      : '下发单部门处理'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {ticket.status === 'in_progress' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-brand-primary/25 p-8 bg-brand-primary/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-brand-primary">
              <CheckCircle2 className="w-6 h-6" />
              {departmentTasks.length > 1
                ? '协同部门处理'
                : `${departmentTasks[0]?.departmentName || '市级部门'}处理`}
            </h3>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentTasks.length > 0 ? departmentTasks.map((task) => {
                  return (
                    <div
                      key={task.departmentId}
                      className={`p-6 rounded-3xl border transition-all ${
                        task.completed
                          ? 'bg-brand-secondary/15 border-brand-secondary/25'
                          : 'bg-bg-surface/40 backdrop-blur border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="ui-nowrap text-base font-bold text-text-primary">{task.departmentName}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                            {task.completed ? '已完成' : '等待处理'}
                          </p>
                        </div>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                          task.completed
                            ? 'bg-brand-secondary text-white border-brand-secondary'
                            : 'bg-white/50 text-text-muted border-white/10'
                        }`}>
                          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                      </div>

                      {task.completed ? (
                        <div className="mt-4 space-y-1 text-sm text-text-secondary">
                          <p>处理人：{task.completedByName || '未知'}</p>
                          <p>完成时间：{task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '未知'}</p>
                          <p className="text-text-muted">处理备注：{task.comment || '无'}</p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-text-secondary">等待该部门完成处理并上传证明材料。</p>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="md:col-span-2 rounded-3xl border border-dashed border-brand-secondary/20 bg-bg-surface/30 p-6 text-sm text-text-muted">
                    当前单子还没有派发协同部门。
                  </div>
                )}
              </div>

              {canDepartmentComplete && (
                <div className="space-y-4 rounded-[28px] border border-white/10 bg-bg-surface/35 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-text-muted tracking-widest">处理结果证明</p>
                      <p className="text-sm text-text-muted/80 mt-1">先选择附件，点击“处理完成”时会统一上传到当前工单。</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                      {proofFiles.length > 0 ? `${proofFiles.length} 个待上传` : '未选择附件'}
                    </span>
                  </div>

                  <button
                    onClick={openProofPicker}
                    className="group flex w-full items-center justify-between gap-6 rounded-[28px] border border-dashed border-brand-primary/20 bg-white/55 px-6 py-5 text-left transition-all hover:border-brand-primary/35 hover:bg-brand-primary/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-transform group-hover:scale-105">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-text-primary">
                          {proofFiles.length > 0 ? '继续添加证明附件' : '选择证明附件'}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          支持图片、PDF、Word、Excel 等格式，处理完成时自动上传。
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-brand-primary/20 bg-brand-primary/6 px-4 py-2 text-xs font-bold text-brand-primary">
                      {proofFiles.length > 0 ? '继续选择' : '点击选择'}
                    </div>
                  </button>
                  <input
                    ref={proofInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={handleProofChange}
                  />

                  {proofFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">已选附件</p>
                      <div className="flex flex-wrap gap-3">
                      {proofFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-bold text-text-primary">{file.name}</p>
                            <p className="text-[10px] text-text-muted">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeProofFile(index)}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-black/5 hover:text-brand-danger"
                            aria-label="移除证明附件"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleDepartmentComplete}
                      className="inline-flex h-12 items-center gap-2 rounded-2xl border border-brand-primary/25 bg-brand-primary/10 px-5 font-bold text-brand-primary transition-all hover:bg-brand-primary/15 active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {proofFiles.length > 0 ? '处理完成并上传证明' : '处理完成'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {ticket.status === 'waiting_confirm' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-brand-secondary/30 p-8 bg-brand-secondary/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-brand-secondary">
              <CheckCircle2 className="w-6 h-6" />
              工单生命周期结项确认组
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-2xl border transition-all ${ticket.creatorConfirmed ? 'bg-brand-secondary/20 border-brand-secondary shadow-inner' : 'bg-bg-surface/40 backdrop-blur border-white/10'}`}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">第一环节：发起人闭环确认</p>
                {isCreator && !ticket.creatorConfirmed ? (
                  <button onClick={handleConfirm} className="w-full h-14 bg-brand-secondary text-white font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">签署并确认处理完成</button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ticket.creatorConfirmed ? 'bg-brand-secondary text-white' : 'bg-black/10 text-text-muted'}`}>
                      {ticket.creatorConfirmed ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <p className="text-sm font-bold tracking-tight">{ticket.creatorConfirmed ? '发起方已签署确认' : '等待发起方核对现场'}</p>
                  </div>
                )}
              </div>

              {ticket.severity === 'major' && (
                <div className={`p-8 rounded-2xl border transition-all ${ticket.topLeaderConfirmed ? 'bg-brand-secondary/20 border-brand-secondary shadow-inner' : 'bg-bg-surface/40 backdrop-blur border-white/10'}`}>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">第二环节：最高权限审计终审</p>
                  {isTopLeader && !ticket.topLeaderConfirmed ? (
                    <button onClick={handleConfirm} className="w-full h-14 bg-text-primary text-bg-base font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all tracking-wider">最高权限领导特准结项</button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ticket.topLeaderConfirmed ? 'bg-brand-secondary text-white' : 'bg-black/10 text-text-muted'}`}>
                        {ticket.topLeaderConfirmed ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 text-brand-danger" />}
                      </div>
                      <p className="text-sm font-bold tracking-tight">{ticket.topLeaderConfirmed ? '总中心最高领导已签署' : '正在等待高级管理层审计'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8">
        <section className="min-w-0 glass-card p-10 space-y-10 bg-bg-surface/20">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {visibleSeverity && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    visibleSeverity === 'major'
                      ? 'border-brand-danger text-brand-danger'
                      : visibleSeverity === 'urgent'
                        ? 'border-brand-warning text-brand-warning'
                        : 'border-text-muted/25 bg-black/5 text-text-muted'
                  }`}>
                    {visibleSeverity === 'major' ? '重大' : visibleSeverity === 'urgent' ? '紧急' : '普通'}
                  </span>
                )}
                <span className="text-xs font-mono text-text-muted">工单编码: {ticket.id}</span>
              </div>
              <div className={`shrink-0 px-4 py-1.5 rounded-full flex items-center gap-2 border ${
                ticket.status === 'completed' || ticket.status === 'waiting_confirm'
                  ? 'border-brand-secondary text-brand-secondary'
                  : ticket.status === 'in_progress'
                    ? departmentTasks.length > 1
                      ? 'border-brand-secondary text-brand-secondary'
                      : 'border-brand-primary text-brand-primary bg-brand-primary/5'
                    : 'border-brand-warning text-brand-warning animate-pulse'
              }`}>
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {ticket.status === 'pending_county'
                    ? '县级待审'
                    : ticket.status === 'pending_city'
                      ? '市级待定级'
                      : ticket.status === 'in_progress'
                        ? processingStatusLabel
                        : ticket.status === 'waiting_confirm'
                          ? '待确认'
                          : ticket.status === 'rejected'
                            ? '已驳回'
                            : '已完成'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">工单主题</p>
              <h1 className="max-w-[42rem] text-[clamp(2rem,3vw,3.15rem)] font-black tracking-tight leading-[1.08] text-text-primary">
                {ticket.title}
              </h1>
            </div>
          </div>

          <div className="p-8 bg-black/5 dark:bg-white/5 border border-white/5 rounded-3xl">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">详情描述</p>
            <p className="text-sm text-text-secondary leading-relaxed">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 dark:bg-white/5 border border-white/10 rounded-3xl overflow-hidden glass-card p-0 shadow-none">
            <div className="p-6 bg-transparent space-y-1 border-r border-b border-white/5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">发起人</label>
              <div className="flex items-center gap-3">
                <UserIcon className="text-brand-primary w-4 h-4" />
                <span className="ui-nowrap text-xs font-bold">{ticket.creator.name}</span>
              </div>
            </div>
            <div className="p-6 bg-transparent space-y-1 border-b border-white/5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">所属分公司</label>
              <div className="flex items-center gap-3">
                <Building2 className="text-brand-primary w-4 h-4" />
                <span className="ui-nowrap text-xs font-bold">{ticket.creator.county}</span>
              </div>
            </div>
            <div className="p-6 bg-transparent space-y-1 border-r border-white/5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">当前处理环节</label>
              <span className="text-xs font-bold text-brand-warning">
                {ticket.status === 'pending_county'
                  ? '县级分公司审批中'
                  : ticket.status === 'pending_city'
                    ? assignedCityDepartments.length > 1
                      ? '市级多部门待定级'
                      : `${ticket.targetCityDept || '市级部门'}待定级`
                    : ticket.targetCityDept || '市级处理中'}
              </span>
            </div>
            <div className="p-6 bg-transparent space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">初始化日期</label>
              <span className="text-xs font-bold font-mono tracking-tighter">{ticket.createdAt}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-text-muted tracking-widest">附件</p>
                <p className="text-sm text-text-muted/80 mt-1">问题附件在提单时上传，处理证明在协同完成时补传。</p>
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                {issueAttachments.length + proofAttachments.length} 个文件
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl border border-white/10 bg-bg-surface/35 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary">问题附件</p>
                    <p className="text-[10px] text-text-muted mt-1">发起人上传的图片或文档</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                    {issueAttachments.length} 个
                  </span>
                </div>
                {issueAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {issueAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                          {attachment.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate text-sm font-bold text-text-primary">{attachment.originalName}</p>
                          <p className="text-[10px] text-text-muted">{formatFileSize(attachment.size)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">暂无问题附件</p>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-bg-surface/35 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary">处理证明</p>
                    <p className="text-[10px] text-text-muted mt-1">部门负责人上传的结果证明</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">
                    {proofAttachments.length} 个
                  </span>
                </div>
                {proofAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {proofAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary/10 text-brand-secondary">
                          {attachment.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate text-sm font-bold text-text-primary">{attachment.originalName}</p>
                          <p className="text-[10px] text-text-muted">{formatFileSize(attachment.size)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">暂无处理证明</p>
                )}
              </div>
            </div>

            {departmentTasks.length > 1 && (
              <div className="rounded-3xl border border-white/10 bg-bg-surface/35 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary">协同进度</p>
                    <p className="text-[10px] text-text-muted mt-1">下面记录了当前单子的协同部门和完成状态。</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                    {departmentTasks.length} 个部门
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {departmentTasks.map((task) => (
                    <span
                      key={task.departmentId}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${
                        task.completed
                          ? 'border-brand-secondary/20 bg-brand-secondary/5 text-brand-secondary'
                          : 'border-brand-primary/20 bg-brand-primary/5 text-brand-primary'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${task.completed ? 'bg-brand-secondary' : 'bg-brand-primary'}`} />
                      {task.departmentName}{task.completed ? ' · 已完成' : ' · 处理中'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 glass-card p-10 flex flex-col bg-bg-surface/20">
          <h3 className="text-xl font-bold mb-10 flex items-center gap-3 text-brand-primary">
            <History className="w-6 h-6" />
            全生命周期异构审计链
          </h3>

          <div className="space-y-12 relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {[
              {
                id: 'init',
                title: '工单初始化申请',
                indicator: 'done',
                desc: '系统自动生成流水号，校验发起人身份权限',
              },
              {
                id: 'county',
                title: '县级核心网核准',
                indicator: ticket.status === 'pending_county' ? 'active' : (['pending_city', 'in_progress', 'waiting_confirm', 'completed'].includes(ticket.status) ? 'done' : 'pending'),
                desc: '县分公司维护主管进行初审，确定是否有必要上报市中心',
              },
              {
                id: 'city',
                title: '市级指挥中心分派',
                indicator: ticket.status === 'pending_city' ? 'active' : (['in_progress', 'waiting_confirm', 'completed'].includes(ticket.status) ? 'done' : 'pending'),
                desc: '市级负责人完成风险定级，并把任务派给协同部门',
              },
              {
                id: 'processing',
                title: processingTitle,
                indicator: ticket.status === 'in_progress' ? 'active' : (['waiting_confirm', 'completed'].includes(ticket.status) ? 'done' : 'pending'),
                desc: processingDescription,
              },
              {
                id: 'closed',
                title: '全链路审计结项',
                indicator: ticket.status === 'completed' ? 'done' : 'pending',
                desc: '最高权限审计通过，所有过程文档执行加密归档',
              },
            ].map((step) => {
              const historyMap: Record<string, string> = {
                init: '创建',
                county: '县级审批',
                city: '协同派发',
                processing: '部门处理完成',
                closed: '流程闭环',
              };
              const realEntry = ticket.history.slice().reverse().find((h) => h.status.includes(historyMap[step.id]));

              return (
                <div key={step.id} className="relative group">
                  <div className={`absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-4 border-bg-surface z-10 transition-all duration-500
                    ${step.indicator === 'active' ? 'bg-brand-secondary scale-125 shadow-[0_0_15px_#10B981] animate-pulse' :
                      step.indicator === 'done' ? 'bg-brand-primary/50' : 'bg-bg-elevated'}`}
                  />

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <h4 className={`text-sm font-black tracking-tight ${step.indicator === 'active' ? 'text-brand-secondary' : step.indicator === 'done' ? 'text-text-primary' : 'text-text-muted'}`}>
                        {step.title}
                      </h4>
                      {step.indicator === 'active' && <span className="px-2 py-0.5 bg-brand-secondary/10 rounded text-[8px] font-bold uppercase text-brand-secondary border border-brand-secondary/20">当前执行中</span>}
                      {step.indicator === 'done' && realEntry && <span className="text-[10px] font-mono text-text-muted opacity-50">{realEntry.time}</span>}
                    </div>

                    <div className={`glass-card p-6 border-white/10 shadow-none transition-all duration-500 ${step.indicator === 'pending' ? 'opacity-30' : 'bg-bg-surface/30'}`}>
                      {step.indicator === 'done' && realEntry ? (
                        <div className="space-y-4">
                          <p className="text-sm text-text-secondary leading-relaxed">{realEntry.desc}</p>
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                            操作存证: {realEntry.user}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic opacity-60 leading-relaxed">{step.desc}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {rejectDialogOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl rounded-[32px] border border-white/20 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-danger/10 text-brand-danger">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-primary">请输入驳回原因</h3>
                <p className="text-sm text-text-muted">发起人会看到这段说明，并可以重新编辑后提交。</p>
              </div>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写本次驳回的具体原因，便于发起人修改后重新提交。"
              className="mt-6 min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-brand-primary/40 focus:outline-none"
            />

            {rejectError && (
              <p className="mt-3 text-sm font-medium text-brand-danger">{rejectError}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <button
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason('');
                  setRejectError('');
                }}
                className="h-12 px-6 rounded-2xl border border-slate-200 text-text-secondary font-bold transition-all hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim() || rejectSubmitting}
                className="h-12 px-6 rounded-2xl bg-brand-danger text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {rejectSubmitting ? '提交中...' : '确认驳回'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
