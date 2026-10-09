// Shared SMS helpers: recipient parsing, segment counting and the platform's
// default messages (sign-up footer on bulk SMS, invitation text).

// Accept numbers separated by commas, spaces, semicolons or new lines and
// normalise Ghanaian numbers to the international 233XXXXXXXXX form the API
// expects. Duplicates are dropped.
export const parseRecipients = (raw) => {
  const seen = new Set();
  String(raw || "")
    .split(/[\s,;]+/)
    .forEach((tok) => {
      let d = tok.replace(/\D/g, "");
      if (!d) return;
      if (d.startsWith("00")) d = d.slice(2);
      if (d.length === 10 && d.startsWith("0")) d = `233${d.slice(1)}`;
      if (d.length === 9) d = `233${d}`;
      if (d.length >= 11 && d.length <= 15) seen.add(d);
    });
  return Array.from(seen);
};

// A standard GSM-7 SMS segment is 160 characters.
export const SEGMENT = 160;
export const segmentsFor = (text) =>
  text.length ? Math.ceil(text.length / SEGMENT) : 0;

export const PLATFORM_URL = "https://www.isourceplus.com";

// Appended to every bulk SMS the user sends.
export const SIGNUP_FOOTER = `Sign-up Now! To Ghana's No.1 Biggest & Most Reliable Sourcing Platform ${PLATFORM_URL}`;

export const withSignupFooter = (message) => {
  const body = String(message || "").trim();
  return body ? `${body}\n\n${SIGNUP_FOOTER}` : "";
};

// The default sign-up invitation, sent on behalf of the user's organisation.
export const invitationMessage = (orgName) =>
  `${orgName ? `${orgName} invites` : "We invite"} you to sign-up on www.isourceplus.com, Ghana's No.1 Biggest & Reliable Sourcing Platform for us to do business efficiently and effectively.\n\nConnect.Source.Pay\n\nThank you!`;
