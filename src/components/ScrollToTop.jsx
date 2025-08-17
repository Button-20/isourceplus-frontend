import { useEffect } from "react";

const ScrollToTop = () => {
  useEffect(() => {
   window.scrollTo({
      top: 0,
      behavior: "smooth", // smooth scroll effect
    });
  }, []); // runs once when the component mounts

  return null; // this component doesn't render anything
};

export default ScrollToTop;
