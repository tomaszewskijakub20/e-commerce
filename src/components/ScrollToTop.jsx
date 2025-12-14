import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Przewiń do góry (0, 0) przy każdej zmianie ścieżki
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}