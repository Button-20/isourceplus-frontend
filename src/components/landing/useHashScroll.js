import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { getLenis } from "@/components/common/lenis-store";

// On a public page, honour the URL hash on arrival (e.g. /terms#prohibited-conduct
// or /#pricing from another page): bring that element into view once it has
// rendered, otherwise start at the top. Targets should carry `scroll-mt-*` to
// clear the sticky nav — the offset is read from it.
//
// Scrolls through Lenis when it's running (a native jump can be overridden by
// Lenis' own scroll state) and polls with timers rather than animation frames,
// which browsers pause in background tabs.
const jumpTo = (target) => {
  const lenis = getLenis();
  if (typeof target === "number") {
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo({ top: target });
    return;
  }
  const marginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  if (lenis) {
    lenis.scrollTo(target, {
      offset: -marginTop,
      immediate: true,
      force: true,
    });
  } else {
    target.scrollIntoView({ block: "start" });
  }
};

export default function useHashScroll({ topWhenNoHash = true } = {}) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = decodeURIComponent((hash || "").replace(/^#/, ""));
    if (!id) {
      if (topWhenNoHash) jumpTo(0);
      return undefined;
    }
    let tries = 0;
    let timer;
    const seek = () => {
      const el = document.getElementById(id);
      if (el) {
        jumpTo(el);
      } else if (tries < 40) {
        tries += 1;
        timer = setTimeout(seek, 50);
      }
    };
    timer = setTimeout(seek, 0);
    return () => clearTimeout(timer);
  }, [pathname, hash, topWhenNoHash]);
}
