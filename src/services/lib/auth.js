// Session storage helpers.
//
// This backend authenticates with HttpOnly cookies (that's why it uses CSRF),
// so there is normally NO bearer token in the login response — just the user's
// identity. The presence of a stored user is therefore what marks an active
// session. Access/refresh tokens are still handled if a deployment does return
// them, so the client works with both cookie- and bearer-based backends.

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_EMAIL_KEY = "user_email";
const PROFILE_ID_KEY = "profile_id";
const USER_ID_KEY = "user_id";

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUserEmail: () => localStorage.getItem(USER_EMAIL_KEY),
  getProfileId: () => localStorage.getItem(PROFILE_ID_KEY),
  getUserId: () => localStorage.getItem(USER_ID_KEY),

  // Auth rides on the HttpOnly cookie; a stored user means we have a session.
  isAuthenticated: () => Boolean(localStorage.getItem(USER_EMAIL_KEY)),

  setAccessToken: (token) => {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  setSession: ({ access, refresh, userEmail, profileId, userId } = {}) => {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    if (userEmail != null) localStorage.setItem(USER_EMAIL_KEY, userEmail);
    if (profileId != null) localStorage.setItem(PROFILE_ID_KEY, profileId);
    if (userId != null) localStorage.setItem(USER_ID_KEY, userId);
  },

  clear: () => {
    [
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_EMAIL_KEY,
      PROFILE_ID_KEY,
      USER_ID_KEY,
    ].forEach((k) => localStorage.removeItem(k));
  },
};
