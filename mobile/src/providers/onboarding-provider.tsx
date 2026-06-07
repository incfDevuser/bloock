import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  buildGeneratedBlocks,
  defaultDraft,
  GeneratedBlock,
  OnboardingDraft,
} from "@/lib/onboarding";

const draftKey = "block:onboarding:draft";
const completedKey = "block:onboarding:completed";

type OnboardingContextValue = {
  hydrated: boolean;
  completed: boolean;
  draft: OnboardingDraft;
  blocks: GeneratedBlock[];
  patchDraft: (updater: (current: OnboardingDraft) => OnboardingDraft) => void;
  resetOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [[, savedDraft], [, savedCompleted]] = await AsyncStorage.multiGet([
        draftKey,
        completedKey,
      ]);

      if (!alive) {
        return;
      }

      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft) as Partial<OnboardingDraft>;
          setDraft({ ...defaultDraft, ...parsedDraft, password: "" });
        } catch {
          setDraft(defaultDraft);
        }
      }

      setCompleted(savedCompleted === "true");
      setHydrated(true);
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const { password: _password, ...persistedDraft } = draft;

    void AsyncStorage.multiSet([
      [draftKey, JSON.stringify(persistedDraft)],
      [completedKey, completed ? "true" : "false"],
    ]);
  }, [completed, draft, hydrated]);

  const blocks = useMemo(() => buildGeneratedBlocks(draft), [draft]);

  const patchDraft = useCallback((updater: (current: OnboardingDraft) => OnboardingDraft) => {
    setDraft((current) => updater(current));
  }, []);

  const resetOnboarding = useCallback(async () => {
    setDraft(defaultDraft);
    setCompleted(false);
    await AsyncStorage.multiRemove([draftKey, completedKey]);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setCompleted(true);
    await AsyncStorage.setItem(completedKey, "true");
  }, []);

  const value = useMemo(
    () => ({ hydrated, completed, draft, blocks, patchDraft, resetOnboarding, completeOnboarding }),
    [blocks, completeOnboarding, completed, draft, hydrated, patchDraft, resetOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return context;
}
