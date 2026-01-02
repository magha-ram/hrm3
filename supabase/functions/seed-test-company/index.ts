import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedTestCompanyRequest {
  company_name: string;
  employee_count: number; // 50, 85, or 170
  plan_name: 'Basic' | 'Pro' | 'Enterprise';
  subdomain: string;
  admin_email: string; // Must be real Gmail
  admin_first_name?: string;
  admin_last_name?: string;
}

// Fixed set of auth users per company (max 8)
const AUTH_USER_ROLES = [
  { role: 'company_admin', job_title: 'CEO', department_code: 'ENG' },
  { role: 'hr', job_title: 'HR Director', department_code: 'HR' },
  { role: 'manager', job_title: 'Engineering Manager', department_code: 'ENG' },
  { role: 'employee', job_title: 'Software Engineer', department_code: 'ENG' },
  { role: 'employee', job_title: 'Product Manager', department_code: 'PROD' },
  { role: 'employee', job_title: 'UX Designer', department_code: 'DSN' },
];

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

function generateSalary(isManager: boolean = false): number {
  const base = isManager ? 80000 : 40000;
  const range = isManager ? 70000 : 60000;
  return Math.floor(base + Math.random() * range);
}

function maskEmail(email: string): string {
  return email.replace(/^(.{3}).*(@.*)$/, '$1***$2');
}

function generateAuthUserEmail(slug: string, empNumber: string, baseEmail: string): string {
  // Format: nateshkumar2021+<company_slug>_<EMP_ID>@gmail.com
  const emailBase = baseEmail.split('@')[0];
  return `${emailBase}+${slug}_${empNumber}@gmail.com`;
}

serve(async (req: Request): Promise<Response> => {
  console.log("[seed-test-company] Request received:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTH VALIDATION ==========
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

    // Check platform admin
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

    // ========== PARSE REQUEST ==========
    const body: SeedTestCompanyRequest = await req.json();
    console.log("[seed-test-company] Request body:", { 
      company_name: body.company_name, 
      employee_count: body.employee_count, 
      plan: body.plan_name,
      subdomain: body.subdomain 
    });

    // Validate admin email is a real Gmail
    if (!body.admin_email.includes('@gmail.com')) {
      return new Response(
        JSON.stringify({ error: "Invalid email", message: "Admin email must be a real Gmail address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan
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

    const slug = body.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');

    // ========== CHECK EXISTING COMPANY ==========
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug")
      .or(`slug.eq.${slug},name.eq.${body.company_name}`)
      .maybeSingle();

    if (existingCompany) {
      console.log("[seed-test-company] Company exists, checking for missing data:", existingCompany.id);
      // Handle incremental seeding for existing company
      return await handleIncrementalSeed(supabaseAdmin, existingCompany, body, authHeader);
    }

    // ========== CREATE NEW COMPANY ==========
    console.log("[seed-test-company] Creating new company:", body.company_name);

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
      console.error("[seed-test-company] Error creating company:", companyError);
      return new Response(
        JSON.stringify({ error: "Company Creation Failed", message: companyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[seed-test-company] Company created:", company.id);

    // ========== CREATE SUBSCRIPTION ==========
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

    // ========== CREATE DOMAIN ==========
    await supabaseAdmin.from("company_domains").insert({
      company_id: company.id,
      subdomain: slug,
      is_primary: true,
      is_verified: true,
      is_active: true,
      verified_at: new Date().toISOString(),
    });

    // ========== CREATE DEPARTMENTS ==========
    const { data: departments } = await supabaseAdmin
      .from("departments")
      .insert(DEPARTMENTS.map(dept => ({
        company_id: company.id,
        name: dept.name,
        code: dept.code,
        is_active: true,
      })))
      .select();

    console.log("[seed-test-company] Created departments:", departments?.length);

    // ========== CREATE LEAVE TYPES ==========
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

    // ========== CREATE DOCUMENT TYPES ==========
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

    // ========== CREATE SHIFTS ==========
    await supabaseAdmin.from("shifts").insert([
      { company_id: company.id, name: 'Day Shift', start_time: '09:00', end_time: '18:00', is_default: true, is_active: true },
      { company_id: company.id, name: 'Night Shift', start_time: '20:00', end_time: '05:00', is_default: false, is_active: true },
      { company_id: company.id, name: 'Flexible', start_time: '08:00', end_time: '17:00', is_default: false, is_active: true },
    ]);

    // ========== SECTION A: CREATE BULK EMPLOYEES (NO AUTH) ==========
    console.log("[seed-test-company] Creating", body.employee_count, "employees (HR records only)...");

    const deptMap = new Map((departments || []).map(d => [d.code, d.id]));
    const employeesToCreate: any[] = [];
    const managerEmpNumbers: string[] = [];

    // Determine manager count (10% of employees, min 3)
    const managerCount = Math.max(3, Math.floor(body.employee_count * 0.1));

    for (let i = 1; i <= body.employee_count; i++) {
      const empNumber = `EMP${String(i).padStart(3, '0')}`;
      const firstName = randomFromArray(FIRST_NAMES);
      const lastName = randomFromArray(LAST_NAMES);
      const deptCode = randomFromArray(DEPARTMENTS).code;
      const isManager = i <= managerCount;

      if (isManager) {
        managerEmpNumbers.push(empNumber);
      }

      const hireYearsAgo = 1 + Math.floor(Math.random() * 4); // 1-4 years ago
      const hireDate = new Date();
      hireDate.setFullYear(hireDate.getFullYear() - hireYearsAgo);
      hireDate.setMonth(Math.floor(Math.random() * 12));
      hireDate.setDate(1 + Math.floor(Math.random() * 28));

      employeesToCreate.push({
        company_id: company.id,
        employee_number: empNumber,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@${slug}.internal`, // Internal email, no auth
        employment_type: Math.random() > 0.1 ? 'full_time' : 'part_time',
        employment_status: Math.random() > 0.05 ? 'active' : 'on_leave',
        hire_date: hireDate.toISOString().split('T')[0],
        job_title: isManager ? randomFromArray(['Director', 'Manager', 'Team Lead']) : randomFromArray(JOB_TITLES),
        department_id: deptMap.get(deptCode),
        salary: generateSalary(isManager),
        salary_currency: 'USD',
        user_id: null, // NO AUTH USER
      });
    }

    const { data: employees, error: empError } = await supabaseAdmin
      .from("employees")
      .insert(employeesToCreate)
      .select();

    if (empError) {
      console.error("[seed-test-company] Error creating employees:", empError);
      // Rollback company
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return new Response(
        JSON.stringify({ error: "Employee Creation Failed", message: empError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[seed-test-company] Created", employees?.length, "employees");

    // Set manager hierarchy
    const empMap = new Map((employees || []).map(e => [e.employee_number, e]));
    const managers = (employees || []).filter(e => managerEmpNumbers.includes(e.employee_number));

    for (const emp of employees || []) {
      if (!managerEmpNumbers.includes(emp.employee_number)) {
        const manager = randomFromArray(managers);
        if (manager && manager.id !== emp.id) {
          await supabaseAdmin
            .from("employees")
            .update({ manager_id: manager.id })
            .eq("id", emp.id);
        }
      }
    }

    // ========== SECTION B: CREATE LIMITED AUTH USERS (MAX 8) ==========
    console.log("[seed-test-company] Creating auth users (max 8)...");

    const createdUsers: { email: string; role: string; password: string; employee_number: string }[] = [];
    const emailsSent: string[] = [];
    const emailErrors: string[] = [];

    // Get first N employees to link with auth users
    const employeesForAuth = (employees || []).slice(0, AUTH_USER_ROLES.length);

    for (let i = 0; i < Math.min(AUTH_USER_ROLES.length, employeesForAuth.length); i++) {
      const roleConfig = AUTH_USER_ROLES[i];
      const targetEmployee = employeesForAuth[i];
      
      // Generate auth email: nateshkumar2021+<slug>_<EMP_ID>@gmail.com
      const authEmail = generateAuthUserEmail(slug, targetEmployee.employee_number, body.admin_email);
      const password = generateSecurePassword();

      console.log("[seed-test-company] Creating auth user:", maskEmail(authEmail), "role:", roleConfig.role);

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === authEmail.toLowerCase());

        let userId: string;

        if (existingUser) {
          console.log("[seed-test-company] User exists, skipping creation:", maskEmail(authEmail));
          userId = existingUser.id;
        } else {
          // Create auth user
          const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: authEmail.toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
              first_name: targetEmployee.first_name,
              last_name: targetEmployee.last_name,
            },
          });

          if (userError) {
            console.error("[seed-test-company] Failed to create user:", maskEmail(authEmail), userError.message);
            emailErrors.push(`Failed to create ${maskEmail(authEmail)}: ${userError.message}`);
            continue;
          }

          userId = newUser.user.id;

          // Create profile with force_password_change
          await supabaseAdmin.from("profiles").upsert({
            id: userId,
            email: authEmail.toLowerCase(),
            first_name: targetEmployee.first_name,
            last_name: targetEmployee.last_name,
            force_password_change: true,
            is_first_login: true,
          });
        }

        // Create company_users entry
        const { error: cuError } = await supabaseAdmin.from("company_users").upsert({
          company_id: company.id,
          user_id: userId,
          role: roleConfig.role as any,
          is_primary: roleConfig.role === 'company_admin',
          is_active: true,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'company_id,user_id' });

        if (cuError) {
          console.error("[seed-test-company] Failed to add user to company:", cuError);
        }

        // Link auth user to employee record
        await supabaseAdmin
          .from("employees")
          .update({ 
            user_id: userId,
            email: authEmail, // Update employee email to match auth email
          })
          .eq("id", targetEmployee.id);

        // ========== SECTION C: SEND CREDENTIAL EMAIL (MANDATORY) ==========
        console.log("[seed-test-company] Sending credential email to:", maskEmail(authEmail));

        try {
          const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
            body: {
              to: authEmail,
              template: 'test_credentials',
              data: {
                company_name: body.company_name,
                user_name: `${targetEmployee.first_name} ${targetEmployee.last_name}`,
                email: authEmail,
                temporary_password: password, // Password only sent in email, never logged
                login_url: `https://${slug}.lovableproject.com/auth`,
                role: roleConfig.role,
                employee_number: targetEmployee.employee_number,
              },
            },
          });

          if (emailError) {
            console.error("[seed-test-company] Email send failed:", maskEmail(authEmail), emailError.message);
            emailErrors.push(`Email failed for ${maskEmail(authEmail)}: ${emailError.message}`);
          } else {
            console.log("[seed-test-company] Email sent successfully:", maskEmail(authEmail));
            emailsSent.push(maskEmail(authEmail));
          }
        } catch (emailErr) {
          console.error("[seed-test-company] Email exception:", maskEmail(authEmail), emailErr);
          emailErrors.push(`Email exception for ${maskEmail(authEmail)}`);
        }

        createdUsers.push({
          email: authEmail,
          role: roleConfig.role,
          password: password, // Returned ONCE in response payload
          employee_number: targetEmployee.employee_number,
        });

      } catch (userErr) {
        console.error("[seed-test-company] User creation exception:", userErr);
        emailErrors.push(`Exception creating user ${i + 1}`);
      }
    }

    // ========== GENERATE HISTORICAL DATA ==========
    console.log("[seed-test-company] Generating historical data...");

    await generateHistoricalData(supabaseAdmin, company.id, employees || []);

    // ========== INITIALIZE PERMISSIONS ==========
    try {
      await supabaseAdmin.rpc('initialize_company_permissions', { _company_id: company.id });
    } catch (permErr) {
      console.error("[seed-test-company] Permissions init error:", permErr);
    }

    // ========== AUDIT LOG ==========
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
        users_created: createdUsers.length,
        plan: body.plan_name,
      },
    });

    // ========== SECTION F: RESPONSE PAYLOAD ==========
    console.log("[seed-test-company] Seeding complete. Employees:", employees?.length, "Users:", createdUsers.length);

    return new Response(
      JSON.stringify({
        success: true,
        company_name: company.name,
        company_id: company.id,
        company_slug: slug,
        employees_created: employees?.length || 0,
        users_created: createdUsers.length,
        emails_sent: emailsSent.length,
        errors: emailErrors.length > 0 ? emailErrors : undefined,
        users: createdUsers.map(u => ({
          email: maskEmail(u.email),
          role: u.role,
          employee_number: u.employee_number,
          password: u.password, // Returned ONCE, never logged
          credentials_sent: emailsSent.includes(maskEmail(u.email)),
        })),
        message: `Test company seeded: ${employees?.length} employees, ${createdUsers.length} auth users, ${emailsSent.length} emails sent`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[seed-test-company] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ========== INCREMENTAL SEED FOR EXISTING COMPANIES ==========
async function handleIncrementalSeed(
  supabaseAdmin: any,
  existingCompany: { id: string; name: string; slug: string },
  body: SeedTestCompanyRequest,
  authHeader: string
): Promise<Response> {
  console.log("[seed-test-company] Incremental seed for:", existingCompany.name);

  // Check current employee count
  const { count: existingEmpCount } = await supabaseAdmin
    .from("employees")
    .select("*", { count: 'exact', head: true })
    .eq("company_id", existingCompany.id);

  const missingEmployees = body.employee_count - (existingEmpCount || 0);
  let employeesCreated = 0;

  if (missingEmployees > 0) {
    console.log("[seed-test-company] Need to create", missingEmployees, "more employees");

    const { data: departments } = await supabaseAdmin
      .from("departments")
      .select("id, code")
      .eq("company_id", existingCompany.id);

    const deptMap = new Map((departments || []).map((d: any) => [d.code, d.id]));

    const newEmployees: any[] = [];
    const startNum = (existingEmpCount || 0) + 1;

    for (let i = 0; i < missingEmployees; i++) {
      const empNumber = `EMP${String(startNum + i).padStart(3, '0')}`;
      const firstName = randomFromArray(FIRST_NAMES);
      const lastName = randomFromArray(LAST_NAMES);
      const deptCode = randomFromArray(DEPARTMENTS).code;

      const hireYearsAgo = 1 + Math.floor(Math.random() * 4);
      const hireDate = new Date();
      hireDate.setFullYear(hireDate.getFullYear() - hireYearsAgo);

      newEmployees.push({
        company_id: existingCompany.id,
        employee_number: empNumber,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${startNum + i}@${existingCompany.slug}.internal`,
        employment_type: 'full_time',
        employment_status: 'active',
        hire_date: hireDate.toISOString().split('T')[0],
        job_title: randomFromArray(JOB_TITLES),
        department_id: deptMap.get(deptCode),
        salary: generateSalary(false),
        salary_currency: 'USD',
        user_id: null,
      });
    }

    const { data: created, error: empErr } = await supabaseAdmin
      .from("employees")
      .insert(newEmployees)
      .select();

    if (empErr) {
      console.error("[seed-test-company] Error creating missing employees:", empErr);
    } else {
      employeesCreated = created?.length || 0;

      // Generate historical data for new employees
      await generateHistoricalData(supabaseAdmin, existingCompany.id, created || []);
    }
  }

  // Check for auth users needing creation or re-send
  const { data: companyUsers } = await supabaseAdmin
    .from("company_users")
    .select("user_id, role")
    .eq("company_id", existingCompany.id);

  const existingAuthCount = companyUsers?.length || 0;
  const missingAuthUsers = AUTH_USER_ROLES.length - existingAuthCount;

  let usersCreated = 0;
  let emailsSent = 0;

  if (missingAuthUsers > 0) {
    console.log("[seed-test-company] Need to create", missingAuthUsers, "auth users");
    // Similar logic as main seed but for missing users only
  }

  return new Response(
    JSON.stringify({
      success: true,
      incremental: true,
      company_name: existingCompany.name,
      company_id: existingCompany.id,
      employees_created: employeesCreated,
      users_created: usersCreated,
      emails_sent: emailsSent,
      message: `Incremental seed complete: +${employeesCreated} employees`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ========== GENERATE HISTORICAL DATA ==========
async function generateHistoricalData(supabaseAdmin: any, companyId: string, employees: any[]): Promise<void> {
  if (!employees || employees.length === 0) return;

  const now = new Date();

  // Salary history (1-3 increments per employee)
  const salaryHistoryRecords: any[] = [];
  for (const emp of employees) {
    const hireDate = new Date(emp.hire_date);
    const yearsEmployed = Math.floor((now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    let currentSalary = emp.salary * 0.7;
    for (let y = 0; y <= Math.min(yearsEmployed, 3); y++) {
      const effectiveDate = new Date(hireDate);
      effectiveDate.setFullYear(effectiveDate.getFullYear() + y);
      
      salaryHistoryRecords.push({
        company_id: companyId,
        employee_id: emp.id,
        effective_date: effectiveDate.toISOString().split('T')[0],
        salary: Math.round(currentSalary),
        currency: 'USD',
        reason: y === 0 ? 'Initial salary' : 'Annual increment',
      });
      
      currentSalary *= 1.1;
    }
  }

  if (salaryHistoryRecords.length > 0) {
    await supabaseAdmin.from("salary_history").insert(salaryHistoryRecords);
  }

  // Attendance summaries (last 6 months)
  const attendanceRecords: any[] = [];
  for (const emp of employees) {
    for (let m = 0; m < 6; m++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      
      const workingDays = 22;
      const daysPresent = workingDays - Math.floor(Math.random() * 4);
      
      attendanceRecords.push({
        company_id: companyId,
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

  // Leave requests (40% of employees)
  const leaveRequests: any[] = [];
  const { data: leaveTypes } = await supabaseAdmin
    .from("leave_types")
    .select("id, code")
    .eq("company_id", companyId);

  const leaveTypesArray = (leaveTypes || []) as { id: string; code: string }[];

  for (const emp of employees.slice(0, Math.floor(employees.length * 0.4))) {
    const leaveType = randomFromArray(leaveTypesArray);
    const startDate = randomDate(2024, 2025);
    const days = Math.floor(Math.random() * 5) + 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    leaveRequests.push({
      company_id: companyId,
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
        company_id: companyId,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        run_date: runDate.toISOString().split('T')[0],
        status: 'completed',
        total_gross: employees.reduce((sum, e) => sum + (e.salary / 12), 0),
        total_deductions: employees.reduce((sum, e) => sum + (e.salary / 12 * 0.2), 0),
        total_net: employees.reduce((sum, e) => sum + (e.salary / 12 * 0.8), 0),
        processed_count: employees.length,
      })
      .select()
      .single();

    if (payrollRun) {
      const entries = employees.map(emp => ({
        payroll_run_id: payrollRun.id,
        employee_id: emp.id,
        company_id: companyId,
        basic_salary: emp.salary / 12,
        gross_salary: emp.salary / 12,
        total_deductions: (emp.salary / 12) * 0.2,
        net_salary: (emp.salary / 12) * 0.8,
        status: 'processed',
      }));

      await supabaseAdmin.from("payroll_entries").insert(entries);
    }
  }
}
