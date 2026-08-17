// Which account type a user may create is driven by their profile job title.
// Centralized here so the onboarding profile step, the account-type step, and
// any dashboard entry point all agree on the same rules.
//
//   - Lead Buyer / Sales Manager  -> can create a Company
//   - Logistics Manager           -> can create a Transporter
//
// Every other job title skips organization creation and goes straight to the
// dashboard.

export const COMPANY_JOB_TITLES = ["lead buyer", "sales manager"];
export const TRANSPORTER_JOB_TITLES = ["logistics manager"];

const normalize = (jobTitle) => (jobTitle || "").toLowerCase().trim();

export const canCreateCompany = (jobTitle) =>
  COMPANY_JOB_TITLES.includes(normalize(jobTitle));

export const canCreateTransporter = (jobTitle) =>
  TRANSPORTER_JOB_TITLES.includes(normalize(jobTitle));

// True when the role can create either kind of organization — i.e. the
// account-type step is relevant for this user.
export const canCreateOrganization = (jobTitle) =>
  canCreateCompany(jobTitle) || canCreateTransporter(jobTitle);
