import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ArrowRight, Network, Sun, Moon, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Login({ onLogin, theme, toggleTheme }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(username, password);
    } catch (loginError: any) {
      setError(loginError?.message || '用户名或密码错误，请确认后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob w-[800px] h-[800px] bg-brand-primary/10 -top-40 -left-40" />
        <div className="blob w-[600px] h-[600px] bg-purple-500/10 bottom-0 right-0" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-4 glass-card bg-bg-surface/30 backdrop-blur border-white/10 rounded-2xl text-text-secondary hover:text-brand-primary transition-all shadow-2xl active:scale-95"
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-orange-400" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-[440px] rounded-[40px] p-12 z-10 border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.1)] bg-bg-surface/20"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-brand-primary flex items-center justify-center mb-8 shadow-2xl skew-x-[-4deg]">
            <Network className="text-white w-10 h-10" />
          </div>
          <h1 className="ui-nowrap text-4xl font-black tracking-tighter mb-2 text-text-primary">协同核心网</h1>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">指挥调度系统 · 安全接入</p>
        </div>

        <form
          className="space-y-8"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">用户名</p>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="text"
                  placeholder="请输入用户名 / 工号"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  autoComplete="username"
                  className="w-full h-16 bg-bg-surface/40 backdrop-blur border border-white/5 rounded-2xl pl-14 pr-6 text-base font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-text-muted/40 text-text-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">密码</p>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                  className="w-full h-16 bg-bg-surface/40 backdrop-blur border border-white/5 rounded-2xl pl-14 pr-6 text-base font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-text-muted/40 text-text-primary"
                  required
                />
              </div>
            </div>

            <div className="relative group">
              {error && <p className="text-[10px] text-brand-danger font-black uppercase tracking-widest ml-1 mt-2 animate-bounce">{error}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={!username || !password || loading}
            className="w-full h-16 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.96] mt-10 text-base uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:translate-y-[-4px] disabled:opacity-60"
          >
            <span>{loading ? '登录中' : '登录系统'}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>

        <div className="flex items-center justify-center mt-12 pt-8 border-t border-white/5 text-center px-4">
          <p className="ui-nowrap text-[10px] font-bold text-text-muted tracking-[0.1em] leading-relaxed opacity-50">
            使用用户名和密码登录 · © 2026 协同工单系统
          </p>
        </div>
      </motion.div>
    </div>
  );
}
