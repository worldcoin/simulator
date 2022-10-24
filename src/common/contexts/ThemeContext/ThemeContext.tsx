import type { ReactNode } from "react";
import { useCallback } from "react";

import { createContext, memo, useEffect, useMemo, useState } from "react";

export type SystemThemes = "dark" | "light";

type ContextValue = {
  systemTheme: SystemThemes | null;
};

export const ThemeContext = createContext<ContextValue>({
  systemTheme: null,
});

export const ThemeProvider = memo(function ThemeProvider(props: {
  children: ReactNode;
}) {
  const [systemTheme, setSystemTheme] = useState<SystemThemes | null>(null);

  const changeTheme = useCallback(
    (media: MediaQueryList | MediaQueryListEvent) => {
      setSystemTheme(media.matches ? "dark" : "light");
      document.documentElement.dataset["theme"] = media.matches
        ? "dark"
        : "light";
    },
    [],
  );

  // @NOTE: listen system scheme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    changeTheme(mediaQuery);

    const handleChangeSystemScheme = (event: MediaQueryListEvent) => {
      changeTheme(event);
    };

    mediaQuery.addEventListener("change", handleChangeSystemScheme);

    return () => {
      mediaQuery.removeEventListener("change", handleChangeSystemScheme);
    };
  }, [changeTheme]);

  const value = useMemo(
    () => ({
      systemTheme,
    }),
    [systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
});
