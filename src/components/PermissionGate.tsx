import React from 'react';
import { AppRole, hasMinimumRole } from '@/types/auth';
import { ModuleId } from '@/config/modules';
import { useTenant } from '@/contexts/TenantContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Lock, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PermissionGateProps {
  /** Required minimum role to access content */
  requiredRole?: AppRole;
  /** Required module in plan to access content */
  requiredModule?: ModuleId;
  /** What to render when access is denied */
  fallback?: 'hide' | 'disable' | 'lock-icon' | React.ReactNode;
  /** For 'disable' mode - what element type to disable */
  disabledWrapper?: 'button' | 'div';
  /** Custom message when access denied */
  deniedMessage?: string;
  /** Whether to only check frozen state (ignores role/module) */
  writesOnly?: boolean;
  /** Children to render when access granted */
  children: React.ReactNode;
}

export type DenialReason = 'role' | 'module' | 'frozen' | null;

export interface PermissionCheckResult {
  hasAccess: boolean;
  denialReason: DenialReason;
  isFrozen: boolean;
  message: string;
}

/**
 * Hook to check permissions without rendering
 */
export function usePermissionCheck(options: {
  requiredRole?: AppRole;
  requiredModule?: ModuleId;
  writesOnly?: boolean;
}): PermissionCheckResult {
  const { role, isFrozen, hasModule } = useTenant();
  const { requiredRole, requiredModule, writesOnly } = options;

  // If only checking frozen state for writes
  if (writesOnly) {
    return {
      hasAccess: !isFrozen,
      denialReason: isFrozen ? 'frozen' : null,
      isFrozen,
      message: isFrozen ? 'Account is frozen. Write operations are disabled.' : '',
    };
  }

  // Check role first
  if (requiredRole && !hasMinimumRole(role, requiredRole)) {
    return {
      hasAccess: false,
      denialReason: 'role',
      isFrozen,
      message: `Requires ${requiredRole.replace('_', ' ')} role or higher.`,
    };
  }

  // Check module access
  if (requiredModule && !hasModule(requiredModule)) {
    return {
      hasAccess: false,
      denialReason: 'module',
      isFrozen,
      message: `This feature requires upgrading your plan.`,
    };
  }

  // Check frozen state
  if (isFrozen) {
    return {
      hasAccess: false,
      denialReason: 'frozen',
      isFrozen,
      message: 'Account is frozen. Please update billing.',
    };
  }

  return {
    hasAccess: true,
    denialReason: null,
    isFrozen,
    message: '',
  };
}

/**
 * PermissionGate - Conditionally render or disable content based on permissions
 * 
 * SECURITY NOTE: This is for UI rendering only. All permission enforcement
 * happens server-side via RLS policies and database functions.
 */
export function PermissionGate({
  requiredRole,
  requiredModule,
  fallback = 'hide',
  disabledWrapper = 'div',
  deniedMessage,
  writesOnly = false,
  children,
}: PermissionGateProps) {
  const { hasAccess, denialReason, message } = usePermissionCheck({
    requiredRole,
    requiredModule,
    writesOnly,
  });

  const displayMessage = deniedMessage || message;

  // Access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different fallback modes
  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'disable') {
    const DisabledWrapper = disabledWrapper === 'button' ? 'button' : 'div';
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DisabledWrapper
            className="opacity-50 cursor-not-allowed pointer-events-none"
            aria-disabled="true"
          >
            {children}
          </DisabledWrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (fallback === 'lock-icon') {
    const Icon = denialReason === 'module' ? Crown : Lock;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
            {children}
            <Icon className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Custom fallback component
  return <>{fallback}</>;
}

/**
 * WriteGate - Shorthand for protecting write operations when frozen
 */
export function WriteGate({ children, fallback = 'disable' }: {
  children: React.ReactNode;
  fallback?: PermissionGateProps['fallback'];
}) {
  return (
    <PermissionGate writesOnly fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * RoleGate - Shorthand for role-based access
 */
export function RoleGate({ 
  role, 
  children, 
  fallback = 'hide' 
}: {
  role: AppRole;
  children: React.ReactNode;
  fallback?: PermissionGateProps['fallback'];
}) {
  return (
    <PermissionGate requiredRole={role} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * ModuleGate - Shorthand for module-based access
 */
export function ModuleGate({ 
  module, 
  children, 
  fallback = 'hide' 
}: {
  module: ModuleId;
  children: React.ReactNode;
  fallback?: PermissionGateProps['fallback'];
}) {
  return (
    <PermissionGate requiredModule={module} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export default PermissionGate;
