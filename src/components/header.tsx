"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import Image from "next/image";
import { AiChatButton } from "./ai-chat-button";

interface HeaderContextValue {
  setActions: (actions: ReactNode) => void;
  resetActions: () => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function useHeaderActions() {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error("useHeaderActions must be used within HeaderProvider");
  }
  return ctx;
}

function DefaultHeaderActions() {
  return <AiChatButton />;
}

interface HeaderProviderProps {
  children: ReactNode;
  mobileMenu?: ReactNode;
}

export function HeaderProvider({ children, mobileMenu }: HeaderProviderProps) {
  const [actions, setActions] = useState<ReactNode>(<DefaultHeaderActions />);

  const resetActions = useCallback(
    () => setActions(<DefaultHeaderActions />),
    []
  );

  const contextValue = useMemo(
    () => ({ setActions, resetActions }),
    [resetActions]
  );

  return (
    <HeaderContext.Provider value={contextValue}>
      <header className="flex h-14 shrink-0 items-center justify-between bg-white px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-2">
          {mobileMenu}
          <Image
            src="/images/logo-scholarly-full.png"
            alt="Scholarly"
            width={115}
            height={37}
            className="h-auto w-[90px] md:w-[115px]"
          />
        </div>
        {actions}
      </header>
      {children}
    </HeaderContext.Provider>
  );
}

export function useSetHeaderActions(actions: ReactNode) {
  const { setActions, resetActions } = useHeaderActions();

  useEffect(() => {
    setActions(actions);
    return () => resetActions();
  }, [actions, setActions, resetActions]);
}
