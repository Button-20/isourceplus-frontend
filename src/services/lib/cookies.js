// Small cookie helpers. Canonical home for what used to live in
// src/utility/getCookie.js (that file now re-exports from here).

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift() || null;
  return null;
}

export function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=-99999999; path=/`;
}
