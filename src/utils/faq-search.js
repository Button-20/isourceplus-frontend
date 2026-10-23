// Answers free-text questions from the FAQ (src/data/faq.js) — no backend:
// BM25 ranking over each question, its section title and its answer text,
// after stop-word removal, light stemming and a small synonym map, so
// "how much does it cost?" finds "How is iSourcePlus priced?".
import { FAQ_SECTIONS } from "@/data/faq";

const STOP_WORDS = new Set(
  `a an and are as at be been being but by can could do does did doing for
  from had has have how i if in into is it its me my of on or our so than
  that the their them then there these they this to too up us was we were
  what when where which while whom why will with would you your yours
  am any about also just get got please tell know want need like
  isourceplus isource platform`.split(/\s+/),
);

// Irregular forms and synonyms → one canonical term (applied after stemming).
const SYNONYMS = {
  po: ["purchase", "order"],
  pos: ["purchase", "order"],
  lpo: ["purchase", "order"],
  rfq: ["quotation"],
  rfx: ["quotation"],
  rfp: ["quotation"],
  quote: ["quotation"],
  bid: ["quotation"],
  tender: ["quotation"],
  grn: ["grn", "goods", "receiv"],
  paid: ["pay"],
  payment: ["pay"],
  invoic: ["invoice"],
  bill: ["invoice"],
  cost: ["price"],
  pric: ["price"],
  fee: ["price"],
  subscription: ["price"],
  plan: ["price"],
  charge: ["price"],
  expensive: ["price"],
  vendor: ["supplier"],
  seller: ["supplier"],
  purchaser: ["buyer"],
  carrier: ["transporter"],
  transport: ["transporter"],
  logistic: ["transporter"],
  haulage: ["transporter"],
  driver: ["transporter"],
  truck: ["transporter"],
  help: ["support"],
  assistance: ["support"],
  contact: ["support"],
  ticket: ["support"],
  complaint: ["support", "problem"],
  issue: ["problem"],
  bug: ["problem"],
  error: ["problem"],
  phone: ["mobile"],
  app: ["mobile"],
  smartphone: ["mobile"],
  offline: ["connectivity"],
  internet: ["connectivity"],
  "2fa": ["mfa"],
  otp: ["mfa"],
  secure: ["security"],
  safe: ["security"],
  password: ["security", "access"],
  demonstration: ["demo"],
  begin: ["start"],
  sign: ["start"],
  signup: ["start"],
  register: ["start"],
  registration: ["start"],
  onboard: ["start"],
  join: ["start"],
  ship: ["delivery"],
  shipment: ["delivery"],
  deliver: ["delivery"],
  approval: ["approv"],
  approve: ["approv"],
  vat: ["tax"],
  gra: ["tax"],
  stock: ["inventory"],
  warehouse: ["inventory"],
  small: ["size"],
  big: ["size"],
  large: ["size"],
  company: ["organisation"],
  business: ["organisation"],
  firm: ["organisation"],
  enterprise: ["organisation"],
  using: ["use"],
  sme: ["size"],
  amend: ["amend", "change"],
  edit: ["amend"],
  modify: ["amend"],
  department: ["department", "unit"],
  branch: ["unit"],
  share: ["share", "privacy"],
  private: ["privacy"],
  confidential: ["privacy"],
  data: ["data", "privacy"],
  role: ["permission"],
  permiss: ["permission"],
  audit: ["audit"],
  log: ["audit"],
  rate: ["evaluat"],
  review: ["evaluat"],
  rating: ["evaluat"],
  blacklist: ["restrict"],
  block: ["restrict"],
  ban: ["restrict"],
};

// Phrasings whose meaning lives in stop words, rewritten before tokenizing
// (apostrophes are already stripped, so "who's" arrives as "whos").
const PHRASES = [
  [
    /\bwho(?: is|s)? (?:it|this|isourceplus|the platform)(?: \w+)? for\b/g,
    "who designed",
  ],
  [/\b(?:edit|change|modify|update)\b.*\bafter\b/g, "amend transaction"],
];

const stem = (w) => {
  let t = w.replace(/iz(e|ed|es|ing|ation)$/, "is$1"); // organize → organise
  if (t.length > 4 && t.endsWith("ies")) t = `${t.slice(0, -3)}y`;
  else if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
  else if (/(ss|x|ch|sh)es$/.test(t)) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss"))
    t = t.slice(0, -1);
  if (t.length > 4 && t.endsWith("e")) t = t.slice(0, -1);
  return t;
};

// "Can buyers manage POs?" → ["buyer", "manag", "purchas", "order"]
export function tokenize(text) {
  const out = [];
  PHRASES.reduce(
    (t, [re, to]) => t.replace(re, to),
    String(text).toLowerCase().replace(/[’']/g, ""),
  )
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .forEach((w) => {
      const raw = SYNONYMS[w];
      const s = stem(w);
      (raw || SYNONYMS[s] || [s]).forEach((t) => out.push(stem(t)));
    });
  return out;
}

// An answer's blocks → plain text.
export const answerText = (blocks) =>
  blocks
    .map((b) =>
      typeof b === "string"
        ? b
        : b.list || b.flow || b.steps
          ? (b.list || b.flow || b.steps).join(" ")
          : `${b.text || ""} ${b.link?.label || ""}`,
    )
    .join(" ");

// Field weights: the question says what an entry is about; answers ramble.
const WEIGHTS = { q: 3, section: 1, a: 1 };
const K1 = 1.2;
const B = 0.75;

const DOCS = FAQ_SECTIONS.flatMap((section) =>
  section.items.map((item, index) => {
    const fields = {
      q: tokenize(item.q),
      section: tokenize(section.title),
      a: tokenize(answerText(item.a)),
    };
    const tf = new Map();
    let length = 0;
    Object.entries(fields).forEach(([field, terms]) => {
      terms.forEach((t) => {
        tf.set(t, (tf.get(t) || 0) + WEIGHTS[field]);
        length += WEIGHTS[field];
      });
    });
    return {
      key: `${section.id}:${index}`,
      sectionId: section.id,
      sectionTitle: section.title,
      item,
      tf,
      qTerms: new Set(fields.q),
      length,
    };
  }),
);

const AVG_LENGTH = DOCS.reduce((n, d) => n + d.length, 0) / DOCS.length;
const IDF = new Map();
DOCS.forEach((d) => d.tf.forEach((_, t) => IDF.set(t, (IDF.get(t) || 0) + 1)));
IDF.forEach((df, t) =>
  IDF.set(t, Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5))),
);

const scoreDoc = (doc, terms) => {
  let score = 0;
  let matched = 0;
  terms.forEach((t) => {
    const f = doc.tf.get(t);
    if (!f) return;
    matched += 1;
    const idf = IDF.get(t) || 0;
    score +=
      (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / AVG_LENGTH));
    if (doc.qTerms.has(t)) score += idf; // the question itself matches
  });
  return { score, coverage: terms.length ? matched / terms.length : 0 };
};

// Below these, the best match is a guess — say so instead of answering.
const MIN_SCORE = 2.5;
const MIN_COVERAGE = 0.4;

// → { best, related: [...], terms } — best is null when nothing fits well.
export function searchFaq(query, { limit = 3 } = {}) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return { best: null, related: [], terms };
  const ranked = DOCS.map((doc) => ({ doc, ...scoreDoc(doc, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const [top, ...rest] = ranked;
  const confident =
    top && top.score >= MIN_SCORE && top.coverage >= MIN_COVERAGE;
  const toHit = (r) => ({
    key: r.doc.key,
    sectionId: r.doc.sectionId,
    sectionTitle: r.doc.sectionTitle,
    q: r.doc.item.q,
    a: r.doc.item.a,
    score: r.score,
  });
  return {
    best: confident ? toHit(top) : null,
    // When unsure, the near misses become "did you mean…" suggestions.
    related: (confident ? rest : ranked)
      .filter((r) => r.score >= MIN_SCORE * 0.6)
      .slice(0, limit)
      .map(toHit),
    terms,
  };
}

const GREETING =
  /^(hi|hello|hey|hiya|good (morning|afternoon|evening)|greetings)\b/i;
const THANKS = /\b(thanks|thank you|thx|cheers|appreciated?)\b/i;
const BYE = /^(bye|goodbye|see you|later)\b/i;

// Small talk the FAQ doesn't cover → "greeting" | "thanks" | "bye" | null.
export function smallTalk(text) {
  const t = String(text).trim();
  if (THANKS.test(t) && tokenize(t).length <= 2) return "thanks";
  if (BYE.test(t)) return "bye";
  if (GREETING.test(t) && tokenize(t).length <= 2) return "greeting";
  return null;
}
