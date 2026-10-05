import { Link, useLocation } from "react-router-dom";

// Link to a landing-page section ("#features") that works from any public page.
// On the landing page it stays a plain in-page anchor (SmoothScroll animates
// it); elsewhere it routes to "/#features" and the landing page's
// useHashScroll() brings the section into view.
export default function SectionLink({ hash, children, ...rest }) {
  const { pathname } = useLocation();
  const target = hash.startsWith("#") ? hash : `#${hash}`;
  if (pathname === "/") {
    return (
      <a href={target} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={`/${target}`} {...rest}>
      {children}
    </Link>
  );
}
