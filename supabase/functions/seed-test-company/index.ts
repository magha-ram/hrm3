import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedTestCompanyRequest {
  company_name: string;
  employee_count: number;
  plan_name: 'Basic' | 'Pro' | 'Enterprise';
  subdomain: string;
  admin_email: string;
  admin_first_name?: string;
  admin_last_name?: string;
  real_email_users: { role: string; email: string; first_name: string; last_name: string }[];
}

const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jessica', 'William', 'Ashley', 
  'James', 'Amanda', 'Joseph', 'Megan', 'Daniel', 'Rachel', 'Matthew', 'Lauren', 'Andrew', 'Jennifer',
  'Christopher', 'Elizabeth', 'Anthony', 'Nicole', 'Mark', 'Stephanie', 'Steven', 'Rebecca', 'Paul', 'Christina'];
  
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const JOB_TITLES = ['Software Engineer', 'Product Manager', 'UX Designer', 'Data Analyst', 'Marketing Manager',
  'Sales Representative', 'Customer Support', 'HR Coordinator', 'Finance Analyst', 'Operations Manager',
  'Project Manager', 'Business Analyst', 'Quality Assurance', 'Technical Writer', 'DevOps Engineer',
  'System Administrator', 'Account Executive', 'Content Writer', 'Graphic Designer', 'Legal Counsel'];

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG' },
  { name: 'Product', code: 'PROD' },
  { name: 'Design', code: 'DSN' },
  { name: 'Marketing', code: 'MKT' },
  { name: 'Sales', code: 'SLS' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Operations', code: 'OPS' },
  { name: 'Customer Support', code: 'CS' },
  { name: 'Legal', code: 'LEG' },
];

const LEAVE_TYPES = [
  { name: 'Annual Leave', code: 'AL', days_per_year: 21, is_paid: true },
  { name: 'Sick Leave', code: 'SL', days_per_year: 12, is_paid: true },
  { name: 'Maternity Leave', code: 'ML', days_per_year: 90, is_paid: true },
  { name: 'Paternity Leave', code: 'PL', days_per_year: 10, is_paid: true },
  { name: 'Unpaid Leave', code: 'UL', days_per_year: 30, is_paid: false },
  { name: 'Bereavement Leave', code: 'BL', days_per_year: 5, is_paid: true },
];

const DOCUMENT_TYPES = [
  { name: 'National ID', code: 'NID', has_expiry: true, is_required: true },
  { name: 'Passport', code: 'PASSPORT', has_expiry: true, is_required: false },
  { name: 'Resume/CV', code: 'RESUME', has_expiry: false, is_required: true },
  { name: 'Offer Letter', code: 'OFFER', has_expiry: false, is_required: true },
  { name: 'Employment Contract', code: 'CONTRACT', has_expiry: true, is_required: true },
  { name: 'Degree Certificate', code: 'DEGREE', has_expiry: false, is_required: false },
];

function generateSecurePassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSalary(): number {
  // Generate salary between 30000 and 150000
  return Math.floor(30000 + Math.random() * 120000);
}

serve(async (req: Request): Promise<Response> => {
  console.log("[seed-test-company] Request received:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("[seed-test-company] Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("[seed-test-company] No authorization header");
      return new Response(
        JSON.stringify({ error: "Session expired", message: "Please log in again" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    console.log("[seed-test-company] User auth result:", user?.id ? "valid" : "invalid", authError?.message);
    
    if (authError || !user) {
      console.error("[seed-test-company] Auth validation failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Session expired", message: "Your session has expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is platform admin
    const { data: platformAdmin } = await supabaseAdmin
      .from("platform_admins")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    console.log("[seed-test-company] Platform admin check:", platformAdmin ? "is admin" : "not admin");

    if (!platformAdmin) {
      console.error("[seed-test-company] User is not a platform admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Only platform admins can seed test data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SeedTestCompanyRequest = await req.json();
    console.log("[seed-test-company] Seeding company:", body.company_name);
    console.log("Seeding test company:", body.company_name);

    // Get plan ID
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("name", body.plan_name)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found", message: `Plan ${body.plan_name} not found` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate slug
    const slug = body.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if company already exists
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .or(`slug.eq.${slug},name.eq.${body.company_name}`)
      .maybeSingle();

    if (existingCompany) {
      return new Response(
        JSON.stringify({ error: "Company already exists", message: "A company with this name or slug already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin user
    const adminPassword = generateSecurePassword();
    let adminUserId: string;

    const { data: existingAdmin } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdminUser = existingAdmin?.users?.find(u => u.email === body.admin_email.toLowerCase());

    if (existingAdminUser) {
      adminUserId = existingAdminUser.id;
    } else {
      const { data: newAdmin, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: body.admin_email.toLowerCase(),
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: body.admin_first_name || 'Admin',
          last_name: body.admin_last_name || '',
        },
      });

      if (adminError) {
        console.error("Error creating admin user:", adminError);
        return new Response(
          JSON.stringify({ error: "User Creation Failed", message: adminError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      adminUserId = newAdmin.user.id;

      // Create profile with force password change
      await supabaseAdmin.from("profiles").upsert({
        id: adminUserId,
        email: body.admin_email.toLowerCase(),
        first_name: body.admin_first_name || 'Admin',
        last_name: body.admin_last_name || '',
        force_password_change: true,
        is_first_login: true,
      });
    }

    // Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: body.company_name,
        slug,
        is_active: true,
        is_test_company: true,
        industry: 'Technology',
        size_range: body.employee_count <= 50 ? '11-50' : body.employee_count <= 100 ? '51-100' : '101-500',
      })
      .select()
      .single();

    if (companyError) {
      console.error("Error creating company:", companyError);
      return new Response(
        JSON.stringify({ error: "Company Creation Failed", message: companyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Created company:", company.id);

    // Add admin as company_admin
    await supabaseAdmin.from("company_users").insert({
      company_id: company.id,
      user_id: adminUserId,
      role: "company_admin",
      is_primary: true,
      is_active: true,
      joined_at: new Date().toISOString(),
    });

    // Create subscription
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await supabaseAdmin.from("company_subscriptions").insert({
      company_id: company.id,
      plan_id: plan.id,
      status: "active",
      billing_interval: "yearly",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    // Create domain
    await supabaseAdmin.from("company_domains").insert({
      company_id: company.id,
      subdomain: slug,
      is_primary: true,
      is_verified: true,
      is_active: true,
      verified_at: new Date().toISOString(),
    });

    // Create departments
    const { data: departments } = await supabaseAdmin
      .from("departments")
      .insert(
        DEPARTMENTS.map(dept => ({
          company_id: company.id,
          name: dept.name,
          code: dept.code,
          is_active: true,
        }))
      )
      .select();

    console.log("Created departments:", departments?.length);

    // Create leave types
    await supabaseAdmin.from("leave_types").insert(
      LEAVE_TYPES.map(lt => ({
        company_id: company.id,
        name: lt.name,
        code: lt.code,
        days_per_year: lt.days_per_year,
        is_paid: lt.is_paid,
        is_active: true,
        requires_approval: true,
      }))
    );

    // Create document types
    await supabaseAdmin.from("document_types").insert(
      DOCUMENT_TYPES.map(dt => ({
        company_id: company.id,
        name: dt.name,
        code: dt.code,
        has_expiry: dt.has_expiry,
        is_required: dt.is_required,
        is_active: true,
      }))
    );

    // Create shifts
    const { data: shifts } = await supabaseAdmin
      .from("shifts")
      .insert([
        { company_id: company.id, name: 'Day Shift', start_time: '09:00', end_time: '18:00', is_default: true, is_active: true },
        { company_id: company.id, name: 'Night Shift', start_time: '20:00', end_time: '05:00', is_default: false, is_active: true },
        { company_id: company.id, name: 'Flexible', start_time: '08:00', end_time: '17:00', is_default: false, is_active: true },
      ])
      .select();

    // Create employees
    const employeesToCreate: any[] = [];
    const realEmailMap = new Map<string, any>();

    // Map real email users
    for (const realUser of body.real_email_users) {
      realEmailMap.set(realUser.email.toLowerCase(), realUser);
    }

    // Admin employee
    employeesToCreate.push({
      company_id: company.id,
      user_id: adminUserId,
      employee_number: 'EMP001',
      first_name: body.admin_first_name || 'Admin',
      last_name: body.admin_last_name || 'User',
      email: body.admin_email,
      employment_type: 'full_time',
      employment_status: 'active',
      hire_date: randomDate(2020, 2022),
      job_title: 'CEO',
      department_id: departments?.[0]?.id,
      salary: 150000,
      salary_currency: 'USD',
    });

    // Create remaining employees
    for (let i = 2; i <= body.employee_count; i++) {
      const empNumber = `EMP${String(i).padStart(3, '0')}`;
      const firstName = randomFromArray(FIRST_NAMES);
      const lastName = randomFromArray(LAST_NAMES);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@${slug}.test`;
      const hireDate = randomDate(2020, 2025);

      employeesToCreate.push({
        company_id: company.id,
        employee_number: empNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        employment_type: Math.random() > 0.1 ? 'full_time' : 'part_time',
        employment_status: Math.random() > 0.05 ? 'active' : 'on_leave',
        hire_date: hireDate,
        job_title: randomFromArray(JOB_TITLES),
        department_id: randomFromArray(departments || [])?.id,
        salary: generateSalary(),
        salary_currency: 'USD',
      });
    }

    const { data: employees, error: empError } = await supabaseAdmin
      .from("employees")
      .insert(employeesToCreate)
      .select();

    if (empError) {
      console.error("Error creating employees:", empError);
    }

    console.log("Created employees:", employees?.length);

    // Set managers - first 10% of employees become managers
    const managerCount = Math.max(1, Math.floor((employees?.length || 0) * 0.1));
    const managers = employees?.slice(0, managerCount) || [];

    for (const emp of employees?.slice(managerCount) || []) {
      const manager = randomFromArray(managers);
      if (manager) {
        await supabaseAdmin
          .from("employees")
          .update({ manager_id: manager.id })
          .eq("id", emp.id);
      }
    }

    // Create real email users with proper roles
    const createdUsers: { email: string; role: string; password?: string }[] = [
      { email: body.admin_email, role: 'company_admin', password: adminPassword }
    ];

    for (const realUser of body.real_email_users) {
      if (realUser.email.toLowerCase() === body.admin_email.toLowerCase()) continue;

      const userPassword = generateSecurePassword();
      
      try {
        const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: realUser.email.toLowerCase(),
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            first_name: realUser.first_name,
            last_name: realUser.last_name,
          },
        });

        if (userError) {
          console.error("Error creating user:", realUser.email, userError);
          continue;
        }

        // Create profile
        await supabaseAdmin.from("profiles").upsert({
          id: newUser.user.id,
          email: realUser.email.toLowerCase(),
          first_name: realUser.first_name,
          last_name: realUser.last_name,
          force_password_change: true,
          is_first_login: true,
        });

        // Add to company
        await supabaseAdmin.from("company_users").insert({
          company_id: company.id,
          user_id: newUser.user.id,
          role: realUser.role as any,
          is_primary: true,
          is_active: true,
          joined_at: new Date().toISOString(),
        });

        // Find an unlinked employee and link
        const { data: unlinkedEmp } = await supabaseAdmin
          .from("employees")
          .select("id")
          .eq("company_id", company.id)
          .is("user_id", null)
          .limit(1)
          .single();

        if (unlinkedEmp) {
          await supabaseAdmin
            .from("employees")
            .update({
              user_id: newUser.user.id,
              first_name: realUser.first_name,
              last_name: realUser.last_name,
              email: realUser.email,
            })
            .eq("id", unlinkedEmp.id);
        }

        createdUsers.push({ email: realUser.email, role: realUser.role, password: userPassword });

        // Send credentials email
        try {
          await supabaseAdmin.functions.invoke('send-email', {
            body: {
              to: realUser.email,
              template: 'company_onboarding',
              data: {
                company_name: body.company_name,
                admin_name: realUser.first_name,
                email: realUser.email,
                temporary_password: userPassword,
                login_url: `https://${slug}.local/auth`,
              },
            },
          });
        } catch (emailError) {
          console.error("Failed to send email to:", realUser.email, emailError);
        }
      } catch (e) {
        console.error("Error processing real user:", realUser.email, e);
      }
    }

    // Generate historical data
    const now = new Date();
    const allEmployees = employees || [];

    // Salary history (1-3 increments per employee over years)
    const salaryHistoryRecords: any[] = [];
    for (const emp of allEmployees) {
      const hireDate = new Date(emp.hire_date);
      const yearsEmployed = Math.floor((now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      let currentSalary = emp.salary * 0.7; // Start at 70% of current
      for (let y = 0; y <= Math.min(yearsEmployed, 3); y++) {
        const effectiveDate = new Date(hireDate);
        effectiveDate.setFullYear(effectiveDate.getFullYear() + y);
        
        salaryHistoryRecords.push({
          company_id: company.id,
          employee_id: emp.id,
          effective_date: effectiveDate.toISOString().split('T')[0],
          salary: Math.round(currentSalary),
          currency: 'USD',
          reason: y === 0 ? 'Initial salary' : 'Annual increment',
        });
        
        currentSalary *= 1.1; // 10% increase per year
      }
    }

    if (salaryHistoryRecords.length > 0) {
      await supabaseAdmin.from("salary_history").insert(salaryHistoryRecords);
    }

    // Attendance summaries (last 6 months)
    const attendanceRecords: any[] = [];
    for (const emp of allEmployees) {
      for (let m = 0; m < 6; m++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
        
        const workingDays = 22;
        const daysPresent = workingDays - Math.floor(Math.random() * 4);
        
        attendanceRecords.push({
          company_id: company.id,
          employee_id: emp.id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          total_working_days: workingDays,
          days_present: daysPresent,
          days_late: Math.floor(Math.random() * 3),
          half_day_absents: Math.floor(Math.random() * 2),
          full_day_absents: workingDays - daysPresent,
          overtime_hours: Math.floor(Math.random() * 20),
          total_working_hours: daysPresent * 8,
        });
      }
    }

    if (attendanceRecords.length > 0) {
      await supabaseAdmin.from("attendance_summaries").insert(attendanceRecords);
    }

    // Leave requests
    const leaveRequests: any[] = [];
    const { data: leaveTypes } = await supabaseAdmin
      .from("leave_types")
      .select("id, code")
      .eq("company_id", company.id);

    for (const emp of allEmployees.slice(0, Math.floor(allEmployees.length * 0.4))) {
      const leaveType = randomFromArray(leaveTypes || []);
      const startDate = randomDate(2024, 2025);
      const days = Math.floor(Math.random() * 5) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      leaveRequests.push({
        company_id: company.id,
        employee_id: emp.id,
        leave_type_id: leaveType?.id,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        days_requested: days,
        status: randomFromArray(['approved', 'approved', 'approved', 'pending', 'rejected']),
        reason: 'Personal time off',
      });
    }

    if (leaveRequests.length > 0) {
      await supabaseAdmin.from("leave_requests").insert(leaveRequests);
    }

    // Payroll runs (last 6 months)
    for (let m = 1; m <= 6; m++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      const runDate = new Date(periodEnd);
      runDate.setDate(runDate.getDate() + 5);

      const { data: payrollRun } = await supabaseAdmin
        .from("payroll_runs")
        .insert({
          company_id: company.id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          run_date: runDate.toISOString().split('T')[0],
          status: 'completed',
          total_gross: allEmployees.reduce((sum, e) => sum + (e.salary / 12), 0),
          total_deductions: allEmployees.reduce((sum, e) => sum + (e.salary / 12 * 0.2), 0),
          total_net: allEmployees.reduce((sum, e) => sum + (e.salary / 12 * 0.8), 0),
          processed_count: allEmployees.length,
        })
        .select()
        .single();

      if (payrollRun) {
        const entries = allEmployees.map(emp => ({
          payroll_run_id: payrollRun.id,
          employee_id: emp.id,
          company_id: company.id,
          basic_salary: emp.salary / 12,
          gross_salary: emp.salary / 12,
          total_deductions: (emp.salary / 12) * 0.2,
          net_salary: (emp.salary / 12) * 0.8,
          status: 'processed',
        }));

        await supabaseAdmin.from("payroll_entries").insert(entries);
      }
    }

    // Initialize permissions
    await supabaseAdmin.rpc('initialize_company_permissions', { _company_id: company.id });

    // Log creation
    await supabaseAdmin.from("audit_logs").insert({
      company_id: company.id,
      user_id: user.id,
      action: "create",
      table_name: "companies",
      record_id: company.id,
      actor_role: "platform_admin",
      target_type: "test_company",
      severity: "info",
      metadata: {
        is_test_company: true,
        employee_count: body.employee_count,
        plan: body.plan_name,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          is_test_company: true,
        },
        stats: {
          employees_created: employees?.length || 0,
          departments_created: departments?.length || 0,
          users_created: createdUsers.length,
        },
        users: createdUsers.map(u => ({
          email: u.email.replace(/^(.{3}).*(@.*)$/, '$1***$2'),
          role: u.role,
          credentials_sent: true,
        })),
        message: "Test company seeded successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding test company:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
