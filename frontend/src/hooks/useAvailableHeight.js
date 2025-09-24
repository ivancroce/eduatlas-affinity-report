import { useEffect } from "react";

export const useAvailableHeight = () => {
  useEffect(() => {
    const calculateHeight = () => {
      const navbar = document.querySelector("nav.navbar");
      const footer = document.querySelector("footer");

      const navbarHeight = navbar?.offsetHeight ?? 0;
      const footerHeight = footer?.offsetHeight ?? 0;

      document.documentElement.style.setProperty("--available-height", `calc(100vh - ${navbarHeight + footerHeight}px)`);
    };

    requestAnimationFrame(calculateHeight);

    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);
};
