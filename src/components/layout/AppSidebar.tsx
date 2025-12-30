import { useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { HR_MODULES, UTILITY_NAV, SETTINGS_NAV } from '@/config/modules';
import { hasMinimumRole } from '@/types/auth';
import { NavLink } from '@/components/NavLink';
import { Settings, ChevronDown, Lock, Crown, HelpCircle } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { role, isAdmin, planName, isTrialing } = useTenant();
  const { accessibleModules, moduleAccess, isFrozen } = useModuleAccess();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="py-2">
        {/* Main HR Modules */}
        <SidebarGroup>
          <SidebarGroupLabel>HR Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moduleAccess.map(({ module, hasAccess, reason }) => (
                <SidebarMenuItem key={module.id}>
                  <SidebarMenuButton
                    asChild={hasAccess}
                    isActive={isActive(module.path)}
                    tooltip={module.name}
                    className={cn(
                      !hasAccess && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {hasAccess ? (
                      <NavLink 
                        to={module.path} 
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <module.icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{module.name}</span>
                            {isFrozen && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </>
                        )}
                      </NavLink>
                    ) : (
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <module.icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{module.name}</span>
                            {reason === 'no_plan' && (
                              <Crown className="h-3 w-3 text-amber-500" />
                            )}
                            {reason === 'no_role' && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings (Admin Only) */}
        {isAdmin && (
          <SidebarGroup>
            <Collapsible defaultOpen={isSettingsActive}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <Settings className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">Settings</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </>
                    )}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SETTINGS_NAV.filter(item => hasMinimumRole(role, item.minRole)).map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.name}>
                          <NavLink 
                            to={item.path} 
                            className="flex items-center gap-2"
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.name}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Utility Links */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/app/help')} tooltip="Help & Support">
                  <NavLink 
                    to="/app/help" 
                    className="flex items-center gap-2"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {!collapsed && <span>Help & Support</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Plan Info */}
      <SidebarFooter className="border-t border-border/50 p-3">
        {!collapsed && planName && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{planName} Plan</span>
            {isTrialing && (
              <Badge variant="secondary" className="text-xs">Trial</Badge>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
