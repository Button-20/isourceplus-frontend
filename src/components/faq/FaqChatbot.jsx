// Floating FAQ assistant: answers typed questions from the FAQ (src/data/faq.js)
// with utils/faq-search — no backend, nothing leaves the browser. Confident
// matches show the FAQ answer plus related questions; otherwise it offers
// near misses ("did you mean…") and the support contacts.
//
// Motion (framer-motion springs; reduced to fades when the OS asks for less
// motion): the launcher morphs between pill and close button, the panel grows
// from it, and each message, chip and the typing dots ease in.
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bot,
  LifeBuoy,
  Mail,
  MessageCircleQuestion,
  RotateCcw,
  SendHorizontal,
  X,
} from "lucide-react";

import FaqAnswer from "@/components/faq/FaqAnswer";
import { searchFaq, smallTalk } from "@/utils/faq-search";

const SUPPORT_EMAIL = "support@isourceplus.net";

const STARTERS = [
  "What is iSourcePlus?",
  "How do I start using iSourcePlus?",
  "How is iSourcePlus priced?",
  "What is a UTID?",
];

const SMALL_TALK = {
  greeting:
    "Hi there! Ask me anything about buying, supplying or transporting on iSourcePlus.",
  thanks: "You're welcome! Anything else you'd like to know?",
  bye: "Goodbye! Come back any time you have a question.",
};

const WELCOME = {
  id: "welcome",
  from: "bot",
  kind: "text",
  text: "Hi! I answer questions from our FAQs. Type a question, or pick one below.",
  suggestions: STARTERS,
};

// Shared springs: snappy for small things, softer for the panel.
const SPRING = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };
const PANEL_SPRING = { type: "spring", stiffness: 340, damping: 30, mass: 0.9 };

// Typed question → the bot's reply message (minus id).
function replyTo(text) {
  const talk = smallTalk(text);
  if (talk) return { from: "bot", kind: "text", text: SMALL_TALK[talk] };
  const { best, related } = searchFaq(text);
  if (best) return { from: "bot", kind: "answer", hit: best, related };
  return { from: "bot", kind: "fallback", related };
}

const chipList = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};
const chipItem = {
  hidden: { opacity: 0, y: 6, scale: 0.96 },
  shown: { opacity: 1, y: 0, scale: 1, transition: SPRING },
};

function Chips({ items, onPick }) {
  return (
    <motion.div
      variants={chipList}
      initial="hidden"
      animate="shown"
      className="mt-3 flex flex-wrap gap-1.5"
    >
      {items.map((q) => (
        <motion.button
          key={q}
          type="button"
          variants={chipItem}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onPick(q)}
          className="rounded-full border border-brand/25 bg-card px-3 py-1 text-left text-xs font-medium text-brand transition-colors hover:border-brand/50 hover:bg-brand/5"
        >
          {q}
        </motion.button>
      ))}
    </motion.div>
  );
}

function BotMessage({ msg, onPick, onNavigate, onShowInFaq }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Bot className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-muted/70 px-3.5 py-2.5">
        {msg.kind === "text" && (
          <p className="text-sm text-foreground">{msg.text}</p>
        )}

        {msg.kind === "answer" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {msg.hit.sectionTitle}
            </p>
            <p className="mt-1 font-medium text-foreground">{msg.hit.q}</p>
            <div className="mt-2">
              <FaqAnswer blocks={msg.hit.a} compact onNavigate={onNavigate} />
            </div>
            {onShowInFaq && (
              <button
                type="button"
                onClick={() => onShowInFaq(msg.hit)}
                className="group mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                See it on the FAQ page
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            )}
            {msg.related.length > 0 && (
              <>
                <p className="mt-3 text-xs text-muted-foreground">
                  Related questions
                </p>
                <Chips items={msg.related.map((r) => r.q)} onPick={onPick} />
              </>
            )}
          </>
        )}

        {msg.kind === "fallback" && (
          <>
            <p className="text-sm text-foreground">
              {msg.related.length
                ? "I'm not sure I understood. Did you mean one of these?"
                : "I couldn't find that in our FAQs. Try rephrasing, or reach our support team."}
            </p>
            {msg.related.length > 0 && (
              <Chips items={msg.related.map((r) => r.q)} onPick={onPick} />
            )}
            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}
              </a>
              <Link
                to="/dashboard/support"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
              >
                <LifeBuoy className="h-3.5 w-3.5" /> File a support ticket
              </Link>
            </div>
          </>
        )}

        {msg.suggestions && <Chips items={msg.suggestions} onPick={onPick} />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={SPRING}
      className="flex items-center gap-2"
      aria-label="Typing"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Bot className="h-4 w-4" />
      </span>
      <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-muted/70 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          />
        ))}
      </span>
    </motion.div>
  );
}

// `onShowInFaq(hit)` (optional): reveal the answer on the host page — the FAQ
// page opens and scrolls to it. hit = { key, sectionId, q, a, … }.
export default function FaqChatbot({ onShowInFaq }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  // Bumped on "start over" so the fresh conversation animates in.
  const [conversation, setConversation] = useState(0);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const timer = useRef(null);
  const justOpened = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    justOpened.current = true;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the newest message in view: a glide for new messages, a jump when
  // the panel first opens.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: justOpened.current ? "auto" : "smooth",
    });
    justOpened.current = false;
  }, [messages, typing, open]);

  const ask = (text) => {
    const question = text.trim();
    if (!question || typing) return;
    setDraft("");
    setMessages((m) => [
      ...m,
      { id: nextId.current++, from: "user", text: question },
    ]);
    setTyping(true);
    // A short pause so the answer reads as a reply, not a page swap.
    timer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: nextId.current++, ...replyTo(question) },
      ]);
      setTyping(false);
    }, 550);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setTyping(false);
    setMessages([WELCOME]);
    setConversation((c) => c + 1);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            role="dialog"
            aria-label="FAQ assistant"
            // Lenis (app-wide smooth scroll) eats wheel events; let the
            // message list scroll natively.
            data-lenis-prevent=""
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 16,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }}
            transition={PANEL_SPRING}
            style={{ transformOrigin: "bottom right" }}
            className="fixed inset-x-4 bottom-20 z-50 flex h-[min(560px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-background font-montserrat shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-brand-gradient px-4 py-3 text-brand-foreground">
              <motion.span
                initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ ...SPRING, delay: 0.08 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
              >
                <MessageCircleQuestion className="h-5 w-5" />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">
                  iSourcePlus assistant
                </p>
                <p className="text-xs text-white/80">Answers from our FAQs</p>
              </div>
              <motion.button
                type="button"
                onClick={reset}
                aria-label="Start over"
                whileHover={{ rotate: -60 }}
                whileTap={{ scale: 0.85, rotate: -180 }}
                transition={SPRING}
                className="rounded-full p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                whileTap={{ scale: 0.85 }}
                className="rounded-full p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div
              key={conversation}
              ref={listRef}
              aria-live="polite"
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{
                    opacity: 0,
                    y: 12,
                    x: msg.from === "user" ? 12 : -6,
                    scale: 0.97,
                  }}
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  transition={{
                    ...SPRING,
                    delay: msg.id === "welcome" ? 0.12 : 0,
                  }}
                  style={{
                    transformOrigin: msg.from === "user" ? "right" : "left",
                  }}
                >
                  {msg.from === "user" ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2 text-sm text-brand-foreground">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <BotMessage
                      msg={msg}
                      onPick={ask}
                      onNavigate={() => setOpen(false)}
                      onShowInFaq={
                        onShowInFaq &&
                        ((hit) => {
                          setOpen(false);
                          onShowInFaq(hit);
                        })
                      }
                    />
                  )}
                </motion.div>
              ))}
              <AnimatePresence>
                {typing && <TypingDots key="typing" />}
              </AnimatePresence>
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
              className="flex items-center gap-2 border-t border-border/70 bg-card px-3 py-3"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question…"
                aria-label="Your question"
                maxLength={300}
                className="h-10 min-w-0 flex-1 rounded-full border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              />
              <motion.button
                type="submit"
                disabled={!draft.trim() || typing}
                aria-label="Send"
                animate={{ scale: draft.trim() ? 1 : 0.92 }}
                whileHover={draft.trim() ? { scale: 1.06 } : undefined}
                whileTap={{ scale: 0.88 }}
                transition={SPRING}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-opacity disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher: a pill that morphs into a round close button. */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close assistant" : "Ask a question"}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1, width: open ? 48 : "auto" }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={SPRING}
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-brand-gradient px-3.5 font-montserrat text-sm font-semibold text-brand-foreground shadow-lg sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={SPRING}
              className="flex"
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="ask"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING}
              className="flex items-center gap-2"
            >
              <MessageCircleQuestion className="h-5 w-5 shrink-0" />
              <span>Ask a question</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </MotionConfig>
  );
}
