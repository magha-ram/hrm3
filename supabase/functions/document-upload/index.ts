import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  employee_id: string;
  document_type_id: string;
  title: string;
  description?: string;
  issue_date?: string;
  expiry_date?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  parent_document_id?: string; // For versioning
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

Deno.serve(async (req) => {
  console.log("[document-upload] Request received:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[document-upload] No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("[document-upload] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: UploadRequest = await req.json();
    console.log("[document-upload] Request body:", { ...body, title: body.title });

    // Validate required fields
    if (!body.employee_id || !body.document_type_id || !body.title || !body.file_name || !body.file_size || !body.mime_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(body.mime_type)) {
      console.error("[document-upload] Invalid MIME type:", body.mime_type);
      return new Response(
        JSON.stringify({ error: "Invalid file type. Allowed: PDF, JPEG, PNG, WEBP, DOC, DOCX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (body.file_size > MAX_FILE_SIZE) {
      console.error("[document-upload] File too large:", body.file_size);
      return new Response(
        JSON.stringify({ error: "File size exceeds 50MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get employee's company
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, company_id, user_id")
      .eq("id", body.employee_id)
      .single();

    if (empError || !employee) {
      console.error("[document-upload] Employee not found:", empError);
      return new Response(
        JSON.stringify({ error: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = employee.company_id;

    // Check if user has access to this company
    const { data: companyUser, error: cuError } = await supabaseAdmin
      .from("company_users")
      .select("role, is_active")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (cuError || !companyUser) {
      console.error("[document-upload] User not in company:", cuError);
      return new Response(
        JSON.stringify({ error: "Not authorized for this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check document module access
    const { data: moduleAccess } = await supabaseAdmin.rpc("can_use_documents", {
      _user_id: user.id,
      _company_id: companyId,
    });

    if (!moduleAccess) {
      console.error("[document-upload] Documents module not accessible");
      return new Response(
        JSON.stringify({ error: "Documents module not available in your plan" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check write permissions (trial/frozen state)
    const { data: canWrite } = await supabaseAdmin.rpc("guard_write_operation", {
      _company_id: companyId,
    });

    if (!canWrite) {
      console.error("[document-upload] Write operations blocked");
      return new Response(
        JSON.stringify({ error: "Write operations are currently blocked. Please check your subscription status." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is uploading for themselves or has create permission
    const isOwnUpload = employee.user_id === user.id;
    
    if (!isOwnUpload) {
      const { data: hasPermission } = await supabaseAdmin.rpc("has_permission", {
        _user_id: user.id,
        _company_id: companyId,
        _module: "documents",
        _action: "create",
      });

      if (!hasPermission) {
        console.error("[document-upload] No create permission");
        return new Response(
          JSON.stringify({ error: "You do not have permission to upload documents for this employee" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check document limits
    const { data: limits } = await supabaseAdmin.rpc("check_document_limits", {
      _company_id: companyId,
      _employee_id: body.employee_id,
    });

    if (limits && !limits.can_upload) {
      console.error("[document-upload] Document limits exceeded:", limits);
      return new Response(
        JSON.stringify({ 
          error: "Document upload limit reached. Please upgrade your plan or remove existing documents.",
          limits 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate document type exists and is active
    const { data: docType, error: dtError } = await supabaseAdmin
      .from("document_types")
      .select("id, name, has_expiry, is_required")
      .eq("id", body.document_type_id)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (dtError || !docType) {
      console.error("[document-upload] Invalid document type:", dtError);
      return new Response(
        JSON.stringify({ error: "Invalid document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If document type has expiry, require expiry date
    if (docType.has_expiry && !body.expiry_date) {
      return new Response(
        JSON.stringify({ error: "Expiry date is required for this document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle versioning - if replacing a document
    let versionNumber = 1;
    if (body.parent_document_id) {
      // Mark old version as not latest
      const { data: parentDoc } = await supabaseAdmin
        .from("employee_documents")
        .select("version_number")
        .eq("id", body.parent_document_id)
        .single();

      if (parentDoc) {
        versionNumber = (parentDoc.version_number || 1) + 1;
        
        await supabaseAdmin
          .from("employee_documents")
          .update({ is_latest_version: false })
          .eq("id", body.parent_document_id);
      }
    }

    // Generate unique file path: company_id/employee_id/document_id/filename
    const documentId = crypto.randomUUID();
    const fileExt = body.file_name.split(".").pop();
    const sanitizedFileName = body.file_name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${companyId}/${body.employee_id}/${documentId}/${sanitizedFileName}`;

    // Generate signed upload URL
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from("employee-documents")
      .createSignedUploadUrl(storagePath);

    if (signError) {
      console.error("[document-upload] Failed to create signed URL:", signError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create document record (pending upload completion)
    const { data: document, error: insertError } = await supabaseAdmin
      .from("employee_documents")
      .insert({
        id: documentId,
        company_id: companyId,
        employee_id: body.employee_id,
        document_type_id: body.document_type_id,
        title: body.title,
        description: body.description || null,
        file_name: body.file_name,
        file_url: storagePath,
        file_size: body.file_size,
        mime_type: body.mime_type,
        issue_date: body.issue_date || null,
        expiry_date: body.expiry_date || null,
        verification_status: "pending",
        is_verified: false,
        version_number: versionNumber,
        parent_document_id: body.parent_document_id || null,
        is_latest_version: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[document-upload] Failed to create document record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the upload action
    await supabaseAdmin.from("audit_logs").insert({
      company_id: companyId,
      user_id: user.id,
      table_name: "employee_documents",
      action: "create",
      record_id: documentId,
      new_values: {
        title: body.title,
        employee_id: body.employee_id,
        document_type: docType.name,
        file_size: body.file_size,
      },
      metadata: {
        action_type: "document_upload_initiated",
        version_number: versionNumber,
        parent_document_id: body.parent_document_id,
      },
    });

    console.log("[document-upload] Success - document created:", documentId);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        upload_url: signedUrl.signedUrl,
        upload_token: signedUrl.token,
        storage_path: storagePath,
        expires_in: 300, // 5 minutes
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[document-upload] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});