import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/hooks/useEmployees';

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  manager_id: string | null;
  manager?: { id: string; first_name: string; last_name: string } | null;
}

interface OrgChartProps {
  employees: Employee[];
  departments: Department[];
  onEmployeeClick?: (employee: Employee) => void;
}

interface DepartmentNode {
  department: Department;
  children: DepartmentNode[];
  employees: Employee[];
}

interface EmployeeCardProps {
  employee: Employee;
  isManager?: boolean;
  onClick?: () => void;
}

function EmployeeCard({ employee, isManager, onClick }: EmployeeCardProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors",
        isManager && "border-primary/50 bg-primary/5"
      )}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className={cn(isManager && "bg-primary text-primary-foreground")}>
          {employee.first_name[0]}{employee.last_name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {employee.first_name} {employee.last_name}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {employee.job_title || 'No title'}
        </div>
      </div>
      {isManager && (
        <Badge variant="secondary" className="shrink-0">Manager</Badge>
      )}
    </div>
  );
}

interface DepartmentCardProps {
  node: DepartmentNode;
  allEmployees: Employee[];
  level: number;
  onEmployeeClick?: (employee: Employee) => void;
}

function DepartmentCard({ node, allEmployees, level, onEmployeeClick }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const manager = node.department.manager_id 
    ? allEmployees.find(e => e.id === node.department.manager_id)
    : null;

  const hasContent = node.employees.length > 0 || node.children.length > 0;

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border-2 bg-card",
          level === 0 ? "border-primary" : "border-muted"
        )}
      >
        {hasContent && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{node.department.name}</div>
          <div className="text-sm text-muted-foreground">
            {node.employees.length} employee{node.employees.length !== 1 ? 's' : ''}
          </div>
        </div>
        {manager && (
          <div className="flex items-center gap-2 shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {manager.first_name[0]}{manager.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{manager.first_name} {manager.last_name}</div>
              <div className="text-muted-foreground text-xs">Manager</div>
            </div>
          </div>
        )}
      </div>

      {isExpanded && hasContent && (
        <div className="ml-6 pl-4 border-l-2 border-muted space-y-3">
          {/* Show employees in this department */}
          {node.employees.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {node.employees
                .filter(e => e.id !== node.department.manager_id)
                .map(employee => (
                  <EmployeeCard 
                    key={employee.id} 
                    employee={employee}
                    onClick={() => onEmployeeClick?.(employee)}
                  />
                ))}
            </div>
          )}

          {/* Show child departments */}
          {node.children.map(child => (
            <DepartmentCard 
              key={child.department.id}
              node={child}
              allEmployees={allEmployees}
              level={level + 1}
              onEmployeeClick={onEmployeeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChart({ employees, departments, onEmployeeClick }: OrgChartProps) {
  const orgTree = useMemo(() => {
    // Build department tree
    const deptMap = new Map<string, DepartmentNode>();
    
    // Create nodes for all departments
    departments.forEach(dept => {
      deptMap.set(dept.id, {
        department: dept,
        children: [],
        employees: employees.filter(e => e.department_id === dept.id),
      });
    });

    // Build parent-child relationships
    const rootDepartments: DepartmentNode[] = [];
    departments.forEach(dept => {
      const node = deptMap.get(dept.id)!;
      if (dept.parent_id && deptMap.has(dept.parent_id)) {
        deptMap.get(dept.parent_id)!.children.push(node);
      } else {
        rootDepartments.push(node);
      }
    });

    // Sort by name
    const sortNodes = (nodes: DepartmentNode[]) => {
      nodes.sort((a, b) => a.department.name.localeCompare(b.department.name));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(rootDepartments);

    return rootDepartments;
  }, [employees, departments]);

  // Employees without department
  const unassignedEmployees = employees.filter(e => !e.department_id);

  if (departments.length === 0 && employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No departments or employees to display.</p>
        <p className="text-sm">Add departments and employees to see the org chart.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department hierarchy */}
      {orgTree.map(node => (
        <DepartmentCard 
          key={node.department.id}
          node={node}
          allEmployees={employees}
          level={0}
          onEmployeeClick={onEmployeeClick}
        />
      ))}

      {/* Unassigned employees */}
      {unassignedEmployees.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted bg-muted/30">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-semibold text-muted-foreground">Unassigned</div>
              <div className="text-sm text-muted-foreground">
                {unassignedEmployees.length} employee{unassignedEmployees.length !== 1 ? 's' : ''} without department
              </div>
            </div>
          </div>
          <div className="ml-6 pl-4 border-l-2 border-dashed border-muted">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedEmployees.map(employee => (
                <EmployeeCard 
                  key={employee.id} 
                  employee={employee}
                  onClick={() => onEmployeeClick?.(employee)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}