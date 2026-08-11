import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { hasCompletedOnboarding, markOnboardingComplete } from '../lib/onboarding';

export type TourStep = 'newScorecard' | 'newPreset' | 'editScorecard' | 'finishScorecard';

const STEPS: TourStep[] = ['newScorecard', 'newPreset', 'editScorecard', 'finishScorecard'];

type TourContextValue = {
  active: boolean;
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  skip: () => void;
};

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      if (!done) setActive(true);
    });
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    markOnboardingComplete();
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      const nextIndex = i + 1;
      if (nextIndex >= STEPS.length) {
        finish();
        return i;
      }
      return nextIndex;
    });
  }, [finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const value: TourContextValue = {
    active,
    step: active ? STEPS[stepIndex] : null,
    stepIndex,
    totalSteps: STEPS.length,
    start,
    next,
    skip,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}