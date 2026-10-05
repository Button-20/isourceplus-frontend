// Holds the app's single Lenis instance (created by SmoothScroll) so other code
// can scroll *through* Lenis. A native window.scrollTo / scrollIntoView can be
// overridden by Lenis' own scroll state, so programmatic jumps should prefer
// getLenis()?.scrollTo(...) when it exists.
let instance = null;

export const setLenis = (lenis) => {
  instance = lenis;
};

export const getLenis = () => instance;
