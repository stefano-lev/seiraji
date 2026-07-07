import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type TourStep = {
  id: string;
  title: string;
  body: string;

  /**
   * Used for tooltip positioning.
   */
  target?: string;

  /**
   * Used for the spotlight rectangle.
   * Falls back to target when omitted.
   */
  spotlightTarget?: string;

  placement?: 'top' | 'bottom' | 'center';
  spotlightPadding?: number;

  onEnter?: () => void;
};

type GuidedTourOverlayProps = {
  open: boolean;
  steps: TourStep[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  onClose: () => void;
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const FADE_MS = 180;
const MEASURE_DELAY_MS = 180;

export function GuidedTourOverlay({
  open,
  steps,
  stepIndex,
  onStepIndexChange,
  onClose,
}: GuidedTourOverlayProps) {
  const [anchorRect, setAnchorRect] = useState<TargetRect | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<TargetRect | null>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);

  const step = steps[stepIndex];

  const stepRef = useRef<TourStep | undefined>(step);
  const stepChangeTimerRef = useRef<number | null>(null);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    return () => {
      if (stepChangeTimerRef.current !== null) {
        window.clearTimeout(stepChangeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const currentStep = stepRef.current;
    if (!currentStep) return;

    let cancelled = false;
    const timers: number[] = [];

    function schedule(callback: () => void, delay: number) {
      const id = window.setTimeout(() => {
        if (!cancelled) callback();
      }, delay);

      timers.push(id);
    }

    currentStep.onEnter?.();

    schedule(() => {
      updateRects();
    }, MEASURE_DELAY_MS);

    function updateRects(attempt = 0) {
      const activeStep = stepRef.current;

      if (!activeStep) return;

      const anchorSelector = activeStep.target;
      const spotlightSelector = activeStep.spotlightTarget ?? activeStep.target;

      if (!anchorSelector && !spotlightSelector) {
        setAnchorRect(null);
        setSpotlightRect(null);
        setSpotlightVisible(true);
        return;
      }

      const anchorElement = anchorSelector
        ? (document.querySelector(
            `[data-tour="${anchorSelector}"]`
          ) as HTMLElement | null)
        : null;

      const spotlightElement = spotlightSelector
        ? (document.querySelector(
            `[data-tour="${spotlightSelector}"]`
          ) as HTMLElement | null)
        : null;

      const scrollElement = anchorElement ?? spotlightElement;

      if (!scrollElement || !spotlightElement) {
        if (attempt < 6) {
          schedule(() => updateRects(attempt + 1), 120);
          return;
        }

        setAnchorRect(null);
        setSpotlightRect(null);
        setSpotlightVisible(true);
        return;
      }

      scrollElement.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center',
      });

      schedule(() => {
        const nextAnchorRect = anchorElement
          ? getRect(anchorElement)
          : getRect(spotlightElement);

        const nextSpotlightRect = getRect(spotlightElement);

        setAnchorRect(nextAnchorRect);
        setSpotlightRect(nextSpotlightRect);

        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setSpotlightVisible(true);
          }
        });
      }, 40);
    }

    function handleViewportChange() {
      updateRects();
    }

    window.addEventListener('resize', handleViewportChange, {
      passive: true,
    });

    return () => {
      cancelled = true;

      timers.forEach(window.clearTimeout);

      window.removeEventListener('resize', handleViewportChange);
    };
  }, [open, stepIndex]);

  const tooltipStyle = useMemo(() => {
    const rect = anchorRect ?? spotlightRect;

    if (!rect || step?.placement === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const tooltipWidth = Math.min(360, window.innerWidth - 32);

    const left = clamp(
      rect.left + rect.width / 2 - tooltipWidth / 2,
      16,
      window.innerWidth - tooltipWidth - 16
    );

    const belowTop = rect.top + rect.height + 18;
    const aboveTop = rect.top - 18;

    const shouldPlaceAbove =
      step?.placement === 'top' || belowTop + 220 > window.innerHeight;

    return {
      width: tooltipWidth,
      left,
      top: shouldPlaceAbove ? aboveTop : belowTop,
      transform: shouldPlaceAbove ? 'translateY(-100%)' : undefined,
    };
  }, [anchorRect, spotlightRect, step]);

  if (!open || !step) return null;

  function changeStep(nextIndex: number) {
    if (nextIndex === stepIndex) return;

    if (stepChangeTimerRef.current !== null) {
      window.clearTimeout(stepChangeTimerRef.current);
    }

    setSpotlightVisible(false);

    stepChangeTimerRef.current = window.setTimeout(() => {
      onStepIndexChange(nextIndex);
      stepChangeTimerRef.current = null;
    }, FADE_MS);
  }

  function goNext() {
    if (isLast) {
      onClose();
      return;
    }

    changeStep(stepIndex + 1);
  }

  function goBack() {
    if (isFirst) return;

    changeStep(stepIndex - 1);
  }

  const padding = step.spotlightPadding ?? 8;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-auto">
      {/* Click blocker */}
      <div className="absolute inset-0 bg-transparent" />

      {spotlightRect ? (
        <div
          className="
            pointer-events-none
            fixed
            z-[91]
            rounded-2xl
            border-2
            border-primary
            transition-opacity
            duration-200
            ease-out
          "
          style={{
            opacity: spotlightVisible ? 1 : 0,
            top: Math.max(8, spotlightRect.top - padding),
            left: Math.max(8, spotlightRect.left - padding),
            width: spotlightRect.width + padding * 2,
            height: spotlightRect.height + padding * 2,
            boxShadow:
              '0 0 0 9999px rgba(0, 0, 0, 0.68), 0 0 0 4px rgba(255, 255, 255, 0.08)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      <div
        className="
          fixed
          z-[92]
          w-[calc(100vw-2rem)]
          max-w-sm
          rounded-2xl
          border
          border-border/60
          bg-background
          p-4
          shadow-2xl
          transition-opacity
          duration-200
          ease-out
        "
        style={{
          ...tooltipStyle,
          opacity: spotlightVisible ? 1 : 0,
        }}
      >
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </div>

        <h2 className="text-lg font-semibold text-muted-foreground">
          {step.title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 text-muted-foreground">
          <Button variant="destructive" onClick={onClose}>
            End tour
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" disabled={isFirst} onClick={goBack}>
              Back
            </Button>

            <Button onClick={goNext}>{isLast ? 'Finish' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRect(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
