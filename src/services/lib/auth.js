// Session storage helpers.
//
// This backend authenticates with HttpOnly cookies (that's why it uses CSRF),
// so there is normally NO bearer token in the login response — just the user's
// identity. The presence of a stored user is therefore what marks an active
// session. Access/refresh tokens are still handled if a deployment does return
// them, so the client works with both cookie- and bearer-based backends.
//
// Built on the core `storage` module so all persistence goes through one place.

import { getCookie } from "./cookies";
import { storage } from "./storage";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_EMAIL_KEY = "user_email";
const PROFILE_ID_KEY = "profile_id";
const USER_ID_KEY = "user_id";

export const authStorage = {
  getAccessToken: () => storage.get(ACCESS_TOKEN_KEY),
  // Falls back to the refresh-token cookie when it's JS-readable (dev, where the
  // Vite proxy strips HttpOnly). In production the cookie stays HttpOnly and the
  // server.js proxy injects the token into the logout body instead.
  getRefreshToken: () =>
    storage.get(REFRESH_TOKEN_KEY) || getCookie("isource-plus-refresh-token"),
  getUserEmail: () => storage.get(USER_EMAIL_KEY),
  getProfileId: () => storage.get(PROFILE_ID_KEY),
  getUserId: () => storage.get(USER_ID_KEY),

  // Auth rides on the HttpOnly cookie; a stored user means we have a session.
  isAuthenticated: () => Boolean(storage.get(USER_EMAIL_KEY)),

  setAccessToken: (token) => {
    if (token) storage.set(ACCESS_TOKEN_KEY, token);
  },

  setSession: ({ access, refresh, userEmail, profileId, userId } = {}) => {
    if (access) storage.set(ACCESS_TOKEN_KEY, access);
    if (refresh) storage.set(REFRESH_TOKEN_KEY, refresh);
    if (userEmail != null) storage.set(USER_EMAIL_KEY, String(userEmail));
    if (profileId != null) storage.set(PROFILE_ID_KEY, String(profileId));
    if (userId != null) storage.set(USER_ID_KEY, String(userId));
  },

  clear: () => {
    [
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_EMAIL_KEY,
      PROFILE_ID_KEY,
      USER_ID_KEY,
    ].forEach((k) => storage.remove(k));
  },
};
