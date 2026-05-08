import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  Mic,
  User as UserIcon,
  Building2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ordersApi } from '../api/order';
import { Page, User } from '../types';

interface CreateTicketProps {
  navigate: (page: Page, id?: string) => void;
  user: User | null;
  editTicketId?: string | null;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function CreateTicket({ navigate, user, editTicketId }: CreateTicketProps) {
  const [description, setDescription] = useState('');
  const [issueFiles, setIssueFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const loadSourceTicket = async () => {
      if (!editTicketId) {
        setSourceTitle('');
        setSourceLoading(false);
        return;
      }

      setSourceLoading(true);

      try {
        const detail = await ordersApi.getById(editTicketId);
        if (cancelled) return;
        setDescription(detail.description || '');
        setSourceTitle(detail.title || `WT-${String(detail.id || editTicketId).padStart(4, '0')}`);
      } catch (error) {
        if (!cancelled) {
          setSourceTitle('');
        }
      } finally {
        if (!cancelled) {
          setSourceLoading(false);
        }
      }
    };

    loadSourceTicket();

    return () => {
      cancelled = true;
    };
  }, [editTicketId]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let nextText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          nextText += transcript;
        }
      }

      if (nextText) {
        setDescription((current) => `${current}${nextText}`);
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop?.();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || 0;
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY < 12) {
        setShowTitle(true);
      } else if (delta > 6) {
        setShowTitle(false);
      } else if (delta < -6) {
        setShowTitle(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY || 0;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    recognition.start();
    setIsRecording(true);
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;

    setIssueFiles((current) => [...current, ...nextFiles]);
    event.target.value = '';
  };

  const removeIssueFile = (index: number) => {
    setIssueFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setSubmitting(true);

    try {
      const nextOrder = editTicketId
        ? await ordersApi.resubmit(editTicketId, { description })
        : await ordersApi.create({ description });

      if (issueFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          issueFiles.map((file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('kind', 'issue');
            return ordersApi.uploadAttachment(nextOrder.id, formData);
          }),
        );

        const failedCount = uploadResults.filter((item) => item.status === 'rejected').length;
        if (failedCount > 0) {
          window.alert(`工单已创建，但有 ${failedCount} 个附件上传失败。你可以在详情页继续补传。`);
        }
      }

      navigate('ticket-detail', String(nextOrder.id));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/4 h-[360px] w-[360px] rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-[420px] w-[420px] rounded-full bg-brand-secondary/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-slate-200/60 blur-3xl dark:bg-slate-700/20" />
        <div className="absolute inset-0 tech-grid opacity-[0.04]" />
      </div>

      <header className="w-full max-w-2xl px-6 h-24 flex items-center justify-between sticky top-0 z-50 bg-transparent">
        <button
          onClick={() => navigate('dashboard')}
          className="p-4 text-text-secondary hover:text-text-primary bg-bg-surface/55 backdrop-blur-2xl rounded-full transition-all border border-white/20 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <motion.h1
          animate={{
            opacity: showTitle ? 1 : 0,
            y: showTitle ? 0 : -18,
            scale: showTitle ? 1 : 0.96,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-[28px] font-black tracking-tight text-text-primary origin-center"
        >
          {editTicketId ? '重新编辑' : '发起协同'}
        </motion.h1>
        <div className="w-12" />
      </header>

      <main className="w-full max-w-2xl px-6 pb-24 pt-8 flex flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-card p-8 bg-bg-surface/50 border-white/18 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >
          <p className="text-xs md:text-[13px] font-bold text-brand-primary mb-6">
            {editTicketId ? '驳回工单重新编辑' : '报障人身份核验'}
          </p>
          {editTicketId && (
            <div className="mb-6 rounded-3xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">当前编辑工单</p>
              <p className="mt-1 text-sm font-bold text-text-primary">
                {sourceLoading ? '正在读取原工单内容...' : sourceTitle || '原工单'}
              </p>
              <p className="mt-1 text-[10px] text-text-muted">
                驳回后可直接修改描述并重新提交，原有问题附件会继续保留。
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3.5 bg-brand-primary/8 rounded-2xl shrink-0">
                <UserIcon className="text-brand-primary w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-[13px] text-text-muted font-bold">姓名 / 员工号</p>
                <p className="ui-nowrap text-lg md:text-[22px] font-bold text-text-primary leading-tight">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3.5 bg-brand-primary/8 rounded-2xl shrink-0">
                <Building2 className="text-brand-primary w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-[13px] text-text-muted font-bold">所属归口单位</p>
                <p className="ui-nowrap text-lg md:text-[22px] font-bold text-text-primary leading-tight">{user?.city} - {user?.county}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-4"
        >
          <label className="text-xs md:text-[13px] font-bold text-text-muted ml-1">协同详情描述</label>
          <div className="glass-card bg-bg-surface/45 border-white/18 p-5 md:p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="relative group">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入详细的现场情况或协同诉求。指挥中心将根据描述进行自动分拣..."
                className="w-full min-h-[320px] bg-transparent border-0 p-0 text-[15px] md:text-base focus:outline-none resize-none leading-relaxed font-medium text-text-primary placeholder:text-text-muted/60"
              />
            </div>

            <div className="mt-5 border-t border-white/10 pt-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted tracking-widest">问题附件</p>
                  <p className="text-xs text-text-muted/80">支持图片、文档和补充说明文件，提交后会自动上传到当前工单。</p>
                </div>
                <button
                  onClick={handleFilePick}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/6 px-4 py-2 text-xs font-bold text-brand-primary transition-all hover:bg-brand-primary/10"
                >
                  <Paperclip className="w-4 h-4" />
                  添加附件
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {issueFiles.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {issueFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface/50 px-4 py-3 shadow-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                        {getFileIcon(file)}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-bold text-text-primary">{file.name}</p>
                        <p className="text-[10px] text-text-muted">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeIssueFile(index)}
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-black/5 hover:text-brand-danger"
                        aria-label="移除附件"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!description || submitting || sourceLoading}
                  className={`
                    flex-1 min-w-0 inline-flex items-center justify-center gap-3 h-14 md:h-16 px-8 md:px-10 rounded-full transition-all active:scale-[0.98] group whitespace-nowrap
                    ${description
                      ? 'bg-gradient-to-r from-sky-600 via-brand-primary to-teal-500 text-white shadow-[0_14px_30px_rgba(59,130,246,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(59,130,246,0.28)]'
                      : 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-500 cursor-not-allowed'}
                  `}
                >
                  <span className="text-sm md:text-lg font-bold">
                    {submitting ? (editTicketId ? '重新提交中...' : '提交中...') : (editTicketId ? '重新编辑并提交' : '立即提交工单')}
                  </span>
                  <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={toggleRecording}
                  aria-label="语音输入"
                  title="语音输入"
                  className={`shrink-0 h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center transition-all group backdrop-blur border border-white/18 active:scale-90 shadow-[0_10px_24px_rgba(15,23,42,0.06)] relative overflow-hidden ${
                    isRecording ? 'bg-brand-primary/16 ring-1 ring-brand-primary/30' : 'bg-bg-surface/70 hover:bg-brand-primary/10'
                  }`}
                >
                  {isRecording && (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-full border border-brand-primary/30"
                        animate={{ scale: [1, 1.25], opacity: [0.45, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.span
                        className="absolute inset-[6px] rounded-full border border-brand-primary/20"
                        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.75, 0.35] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                  <motion.div
                    animate={
                      isRecording
                        ? { scale: [1, 1.08, 1], rotate: [0, -6, 6, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 1.6, repeat: isRecording ? Infinity : 0, ease: 'easeInOut' }}
                    className="relative z-10"
                  >
                    <Mic className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${isRecording ? 'text-brand-primary' : 'text-text-muted group-hover:text-brand-primary'}`} />
                  </motion.div>
                </button>
              </div>

              <p className="ui-nowrap text-center text-xs md:text-sm text-text-muted leading-relaxed">
                您的申请将按系统流程提交至 <span className="text-brand-primary font-bold">{user?.county}枢纽中心</span>。
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
