import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Profile from './pages/Profile';
import DepartmentDetail from './pages/DepartmentDetail';
import { authApi } from './api/auth';
import { Page, ReferenceData, User } from './types';
import { clearSession, persistUser, readPersistedUser } from './lib/session';
import { hydrateUser, loadReferenceData } from './lib/workflow';

const getLocationState = () => {
  const path = window.location.pathname;

  if (path === '/login') return { page: 'login' as Page, ticketId: null };
  if (path === '/create-ticket') return { page: 'create-ticket' as Page, ticketId: null };
  if (path.startsWith('/create-ticket/')) return { page: 'create-ticket' as Page, ticketId: path.split('/')[2] || null };
  if (path === '/profile') return { page: 'profile' as Page, ticketId: null };
  if (path.startsWith('/departments/')) return { page: 'department-detail' as Page, ticketId: path.split('/')[2] || null };
  if (path.startsWith('/tickets/')) return { page: 'ticket-detail' as Page, ticketId: path.split('/')[2] || null };
  if (path === '/me' || path === '/tickets') return { page: 'tickets' as Page, ticketId: null };
  return { page: 'dashboard' as Page, ticketId: null };
};

const getPathForPage = (page: Page, id?: string) => {
  switch (page) {
    case 'login': return '/login';
    case 'dashboard': return '/';
    case 'tickets': return '/me';
    case 'ticket-detail': return `/tickets/${id || ''}`;
    case 'create-ticket': return id ? `/create-ticket/${id}` : '/create-ticket';
    case 'profile': return '/profile';
    case 'department-detail': return `/departments/${id || ''}`;
    default: return '/';
  }
};

export default function App() {
  const locationState = useMemo(() => getLocationState(), []);
  const [currentPage, setCurrentPage] = useState<Page>(locationState.page);
  const [currentUser, setCurrentUser] = useState<User | null>(() => readPersistedUser<User>());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(locationState.ticketId);
  const [refs, setRefs] = useState<ReferenceData>({ counties: [], departments: [] });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      const next = getLocationState();
      setCurrentPage(next.page);
      setSelectedTicketId(next.ticketId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!currentUser && currentPage !== 'login') {
      window.history.replaceState({}, '', '/login');
      setCurrentPage('login');
    }
  }, [currentUser, currentPage]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapRefs = async () => {
      if (!currentUser) return;
      try {
        const nextRefs = await loadReferenceData();
        if (!cancelled) {
          setRefs(nextRefs);

          const refreshedUser = hydrateUser(
            {
              id: currentUser.backendId,
              username: currentUser.username,
              name: currentUser.name,
              role: currentUser.rawRole,
              countyId: currentUser.countyId,
              departmentId: currentUser.departmentId,
            },
            nextRefs,
          );

          setCurrentUser(refreshedUser);
          persistUser(refreshedUser);
        }
      } catch (error) {
        // Keep the current session available even if reference data is temporarily unavailable.
      }
    };

    bootstrapRefs();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.backendId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navigate = (page: Page, id?: string) => {
    const nextPath = getPathForPage(page, id);
    window.history.pushState({}, '', nextPath);
    setCurrentPage(page);
    setSelectedTicketId(id || null);
  };

  const handleLogin = async (username: string, password: string) => {
    const response = await authApi.login(username.trim(), password);
    localStorage.setItem('token', response.access_token);

    let nextRefs = { counties: [], departments: [] };
    try {
      nextRefs = await loadReferenceData();
    } catch (error) {
      // Allow login to complete first; reference data can be hydrated after the session is established.
    }

    const nextUser = hydrateUser(response.user, nextRefs);
    setRefs(nextRefs);
    setCurrentUser(nextUser);
    persistUser(nextUser);
    navigate('dashboard');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // ignore logout network errors
    }

    clearSession();
    setCurrentUser(null);
    setSelectedTicketId(null);
    navigate('login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'tickets':
        return <TicketList navigate={navigate} user={currentUser} refs={refs} />;
      case 'ticket-detail':
        return <TicketDetail id={selectedTicketId} navigate={navigate} user={currentUser} refs={refs} />;
      case 'create-ticket':
        return <CreateTicket navigate={navigate} user={currentUser} editTicketId={selectedTicketId} />;
      case 'profile':
        return <Profile navigate={navigate} user={currentUser} />;
      case 'department-detail':
        return <DepartmentDetail slug={selectedTicketId} navigate={navigate} />;
      default:
        return <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
    }
  };

  const isFullPage = currentPage === 'login' || currentPage === 'create-ticket';

  return (
    <div className={`${theme} min-h-screen bg-bg-base text-text-primary selection:bg-brand-primary/30 transition-colors duration-500 relative`}>
      <div className="liquid-bg pointer-events-none">
        <div className="blob w-[600px] h-[600px] bg-brand-primary/15 -top-20 -left-20" />
        <div className="blob w-[500px] h-[500px] bg-purple-500/15 top-1/3 right-0" style={{ animationDelay: '-5s' }} />
        <div className="blob w-[450px] h-[450px] bg-brand-secondary/10 bottom-0 left-1/4" style={{ animationDelay: '-10s' }} />
      </div>

      {!isFullPage && currentUser && (
        <>
          <Topbar
            currentPage={currentPage}
            navigate={navigate}
            user={currentUser}
            theme={theme}
            toggleTheme={toggleTheme}
          />
          <Sidebar currentPage={currentPage} navigate={navigate} onLogout={handleLogout} />
        </>
      )}

      <main className={`${!isFullPage && currentUser ? 'pl-64 pt-16' : ''} min-h-screen relative z-10`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${selectedTicketId || ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
