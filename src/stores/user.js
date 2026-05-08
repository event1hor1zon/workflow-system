// 用户状态管理
import { reactive, computed } from 'vue';

const STORAGE_KEY = 'user';
const TOKEN_KEY = 'token';

// 从 localStorage 恢复状态
const storedUser = localStorage.getItem(STORAGE_KEY);
const storedToken = localStorage.getItem(TOKEN_KEY);

const state = reactive({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isLoggedIn: !!storedToken,
});

// 角色常量
export const ROLES = {
  USER: 'user',                    // 普通员工
  COUNTY_HANDLER: 'county_handler', // 县级经办人
  DEPARTMENT_HEAD: 'department_head', // 部门负责人
  TOP_LEADER: 'top_leader',       // 最高权限人
  ADMIN: 'admin',                 // 管理员
};

// 角色显示名称
export const ROLE_NAMES = {
  [ROLES.USER]: '公司员工',
  [ROLES.COUNTY_HANDLER]: '公司网络部负责人',
  [ROLES.DEPARTMENT_HEAD]: '市级部门负责人',
  [ROLES.TOP_LEADER]: '最高领导',
  [ROLES.ADMIN]: '管理员',
};

// 计算属性
export const userStore = {
  state,

  // 用户信息
  user: computed(() => state.user),
  token: computed(() => state.token),
  isLoggedIn: computed(() => state.isLoggedIn),

  // 角色判断
  isAdmin: computed(() => state.user?.role === ROLES.ADMIN),
  isTopLeader: computed(() => state.user?.role === ROLES.TOP_LEADER),
  isDepartmentHead: computed(() => state.user?.role === ROLES.DEPARTMENT_HEAD),
  isCountyHandler: computed(() => state.user?.role === ROLES.COUNTY_HANDLER),
  isUser: computed(() => state.user?.role === ROLES.USER),

  // 综合权限判断
  canViewAllOrders: computed(() =>
    state.user?.role === ROLES.ADMIN ||
    state.user?.role === ROLES.TOP_LEADER
  ),

  canTransferOrders: computed(() =>
    state.user?.role === ROLES.COUNTY_HANDLER ||
    state.user?.role === ROLES.ADMIN
  ),

  canCreateOrders: computed(() =>
    state.isLoggedIn
  ),

  canProcessOrders: computed(() =>
    state.user?.role === ROLES.DEPARTMENT_HEAD ||
    state.user?.role === ROLES.ADMIN
  ),

  canConfirmOrders: computed(() =>
    state.user?.role === ROLES.USER ||
    state.user?.role === ROLES.TOP_LEADER ||
    state.user?.role === ROLES.ADMIN
  ),

  canApproveCritical: computed(() =>
    state.user?.role === ROLES.TOP_LEADER ||
    state.user?.role === ROLES.ADMIN
  ),

  // 登录
  login(userData, token) {
    state.user = userData;
    state.token = token;
    state.isLoggedIn = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, token);
  },

  // 登出
  logout() {
    state.user = null;
    state.token = null;
    state.isLoggedIn = false;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  // 更新用户信息
  updateUser(userData) {
    state.user = { ...state.user, ...userData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
  },
};

export default userStore;
