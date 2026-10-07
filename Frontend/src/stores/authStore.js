import { create } from 'zustand';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getAvailableRoles = (user, memberships = []) => {
  if (!user) return [];
  if (user.globalRole === 'platform_admin') {
    return ['platform_admin', 'organizer', 'staff', 'speaker', 'sponsor', 'attendee'];
  }

  return [
    'attendee',
    ...new Set(
      memberships
        .filter((membership) => membership.status === 'active')
        .map((membership) => membership.role)
        .filter((role) => ['organizer', 'staff', 'speaker', 'sponsor'].includes(role))
    ),
  ];
};

export const userHasRole = (user, memberships, role) =>
  getAvailableRoles(user, memberships).includes(role);

const getEventId = (event) =>
  typeof event === 'object' && event !== null ? event.id ?? event._id : event;

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('ef_token') || null,
  memberships: [],
  activeRole: localStorage.getItem('ef_role') || null,
  activeEventId: localStorage.getItem('ef_event') || null,
  isAuthenticated: !!localStorage.getItem('ef_token'),
  isLoading: true,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('ef_token', token);
      set({ accessToken: token, isAuthenticated: true });
    } else {
      localStorage.removeItem('ef_token');
      set({ accessToken: null, isAuthenticated: false });
    }
  },

  setActiveRole: (role) => {
    const { user, memberships } = get();
    if (role && userHasRole(user, memberships, role)) {
      localStorage.setItem('ef_role', role);
      set({ activeRole: role });
    } else if (!role) {
      localStorage.removeItem('ef_role');
      set({ activeRole: null });
    }
  },

  setActiveEventId: (eventId) => {
    if (eventId) {
      localStorage.setItem('ef_event', eventId);
      set({ activeEventId: eventId });
    } else {
      localStorage.removeItem('ef_event');
      set({ activeEventId: null });
    }
  },

  setAuthData: (user, accessToken, memberships = []) => {
    const availableRoles = getAvailableRoles(user, memberships);
    const defaultRole = ['platform_admin', 'organizer', 'staff', 'speaker', 'sponsor', 'attendee']
      .find((role) => availableRoles.includes(role));

    const firstEventId = memberships.length > 0 ? getEventId(memberships[0].event) : null;

    if (accessToken) {
      localStorage.setItem('ef_token', accessToken);
    }
    localStorage.setItem('ef_role', defaultRole);
    if (firstEventId) {
      localStorage.setItem('ef_event', firstEventId);
    }

    set({
      user,
      accessToken: accessToken || get().accessToken,
      memberships,
      activeRole: defaultRole,
      activeEventId: firstEventId,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await axios.post(
        `${API_BASE}/api/v1/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      const { user, accessToken } = res.data.data;
      
      // Fetch me to populate memberships
      const meRes = await axios.get(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const memberships = meRes.data.data?.memberships ?? meRes.data.data?.eventMemberships ?? [];
      get().setAuthData(user, accessToken, memberships);
      return { success: true, user, defaultRole: get().activeRole };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.error?.message || 'Login failed';
      throw new Error(message);
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await axios.post(
        `${API_BASE}/api/v1/auth/register`,
        { name, email, password },
        { withCredentials: true }
      );
      const { user, accessToken } = res.data.data;
      get().setAuthData(user, accessToken, []);
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.error?.message || 'Registration failed';
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, { withCredentials: true });
    } catch (_) {
      // Ignore logout request errors
    } finally {
      localStorage.removeItem('ef_token');
      localStorage.removeItem('ef_role');
      localStorage.removeItem('ef_event');
      set({
        user: null,
        accessToken: null,
        memberships: [],
        activeRole: null,
        activeEventId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    const token = get().accessToken;
    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const { user, memberships: responseMemberships, eventMemberships } = res.data.data ?? {};
      const memberships = responseMemberships ?? eventMemberships ?? [];

      const savedRole = get().activeRole;
      const availableRoles = getAvailableRoles(user, memberships);
      const currentRole = availableRoles.includes(savedRole)
        ? savedRole
        : ['platform_admin', 'organizer', 'staff', 'speaker', 'sponsor', 'attendee']
          .find((role) => availableRoles.includes(role));
      const currentEvent = get().activeEventId || (memberships?.[0] ? getEventId(memberships[0].event) : null);
      localStorage.setItem('ef_role', currentRole);

      set({
        user,
        memberships: memberships || [],
        activeRole: currentRole,
        activeEventId: currentEvent,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // Try refresh
      try {
        const refreshRes = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = refreshRes.data?.data?.accessToken;
        if (newAccessToken) {
          get().setAccessToken(newAccessToken);
          const retryMe = await axios.get(`${API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            withCredentials: true,
          });
          const { user, memberships: responseMemberships, eventMemberships } = retryMe.data.data ?? {};
          const memberships = responseMemberships ?? eventMemberships ?? [];
          get().setAuthData(user, newAccessToken, memberships);
          return;
        }
      } catch (_) {
        // Refresh also failed
      }

      localStorage.removeItem('ef_token');
      set({
        user: null,
        accessToken: null,
        memberships: [],
        activeRole: null,
        activeEventId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
