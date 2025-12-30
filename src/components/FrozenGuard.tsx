import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface FrozenGuardProps {
  children: React.ReactNode;
  /** What to render when frozen - defaults to disabled version of children */
  fallback?: React.ReactNode;
  /** Whether to show a toast when blocked */
  showToast?: boolean;
  /** Custom message for the toast */
  toastMessage?: string;
}

/**
 * Wrapper component that disables interactive elements when company is frozen.
 * Use this to wrap buttons, forms, and other interactive elements that should
 * be read-only when the company account is frozen.
 * 
 * SECURITY NOTE: This is UI-only. Server-side RLS policies enforce the actual restriction.
 */
export function FrozenGuard({
  children,
  fallback,
  showToast = true,
  toastMessage = 'Your account is frozen. Please update billing to make changes.',
}: FrozenGuardProps) {
  const { isFrozen } = useTenant();

  if (!isFrozen) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Wrap children with a click handler that shows a toast and prevents default
  const handleFrozenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showToast) {
      toast.error(toastMessage);
    }
  };

  return (
    <div 
      onClick={handleFrozenClick}
      className="cursor-not-allowed opacity-50"
      role="presentation"
    >
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
}

/**
 * Hook version for more granular control
 */
export function useFrozenAction() {
  const { isFrozen } = useTenant();

  const guardAction = <T extends (...args: unknown[]) => unknown>(
    action: T,
    message = 'Your account is frozen. Please update billing to make changes.'
  ): T => {
    if (!isFrozen) return action;

    return ((...args: Parameters<T>) => {
      toast.error(message);
      return undefined;
    }) as T;
  };

  return {
    isFrozen,
    guardAction,
    showFrozenToast: () => {
      if (isFrozen) {
        toast.error('Your account is frozen. Please update billing to make changes.');
      }
      return isFrozen;
    },
  };
}
