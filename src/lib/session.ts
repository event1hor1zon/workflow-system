export const APP_USER_KEY = 'workflow_react_user';
export const TOKEN_KEY = 'token';

export const persistUser = (user: unknown) => {
  localStorage.setItem(APP_USER_KEY, JSON.stringify(user));
};

export const readPersistedUser = <T,>(): T | null => {
  try {
    const raw = localStorage.getItem(APP_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(APP_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('user');
};
