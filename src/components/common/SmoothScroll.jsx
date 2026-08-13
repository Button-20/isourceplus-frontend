import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Clears the sticky landing nav (h-16 = 64px) with a little breathing room.
const NAV_OFFSET = 80;
const DURATION_MS = 900;
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// App-wide smooth scrolling via Lenis. Wheel/trackpad scrolling is eased, and
// in-page anchor links (e.g. the landing nav's #features) glide to their
// section instead of jumping. Internal scroll containers (sidebar, dialogs)
// keep their native scrolling.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Exact Lenis config from the recibia website.
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Self-contained animation used when Lenis isn't actively smoothing (e.g.
    // when the OS has "reduce motion" on, which makes Lenis's own scrollTo jump).
    // Safe here because in that mode Lenis passes scroll through to the browser
    // rather than hijacking it, so animating native scroll doesn't fight it.
    let animFrame;
    const animateTo = (targetY) => {
      cancelAnimationFrame(animFrame);
      const startY = window.scrollY;
      const distance = targetY - startY;
      if (!distance) return;
      let start;
      const step = (ts) => {
        if (start === undefined) start = ts;
        const t = Math.min((ts - start) / DURATION_MS, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(t));
        if (t < 1) animFrame = requestAnimationFrame(step);
      };
      animFrame = requestAnimationFrame(step);
    };

    const scrollToTarget = (target) => {
      const isSmoothing =
        document.documentElement.classList.contains("lenis-smooth");
      if (isSmoothing) {
        // Lenis honors the target's scroll-margin-top (scroll-mt-20).
        lenis.scrollTo(target, {
          duration: 1.2,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          force: true,
        });
      } else {
        const top =
          window.scrollY + target.getBoundingClientRect().top - NAV_OFFSET;
        animateTo(Math.max(0, top));
      }
    };

    // Smooth-scroll same-page anchor links (<a href="#section">).
    const handleAnchorClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = event.target.closest?.('a[href*="#"]');
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      // Only handle links that stay on the current page.
      const path = href.slice(0, hashIndex);
      if (path && path !== window.location.pathname) return;

      const id = href.slice(hashIndex + 1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);
      window.history.replaceState(null, "", `#${id}`);
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(animFrame);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return children;
}
