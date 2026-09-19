// Supabase Edge Function: vendor-master
// Orchestration endpoint for Vendor Master operations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-organization-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface VendorPayload {
  action: "create" | "update" | "status" | "history";
  vendor_id?: string;
  vendor_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  gstin_tax_id?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  item_category_ids?: string[];
  status?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticated client using caller's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: VendorPayload = await req.json();
    const { action } = payload;

    switch (action) {
      case "create": {
        // Server-side validation before RPC dispatch
        if (!payload.vendor_name || !payload.address || !payload.city || !payload.state || !payload.pin || !payload.gstin_tax_id) {
          return new Response(
            JSON.stringify({ success: false, error: "Mandatory vendor fields missing" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseClient.rpc("rpc_create_vendor", {
          p_vendor_name: payload.vendor_name,
          p_address: payload.address,
          p_city: payload.city,
          p_state: payload.state,
          p_pin: payload.pin,
          p_gstin_tax_id: payload.gstin_tax_id,
          p_contact_person: payload.contact_person,
          p_phone: payload.phone,
          p_email: payload.email,
          p_item_category_ids: payload.item_category_ids || [],
          p_status: payload.status || "ACTIVE",
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!payload.vendor_id) {
          return new Response(
            JSON.stringify({ success: false, error: "vendor_id is required for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseClient.rpc("rpc_update_vendor", {
          p_vendor_id: payload.vendor_id,
          p_vendor_name: payload.vendor_name,
          p_address: payload.address,
          p_city: payload.city,
          p_state: payload.state,
          p_pin: payload.pin,
          p_gstin_tax_id: payload.gstin_tax_id,
          p_contact_person: payload.contact_person,
          p_phone: payload.phone,
          p_email: payload.email,
          p_item_category_ids: payload.item_category_ids,
          p_status: payload.status,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        if (!payload.vendor_id || !payload.status) {
          return new Response(
            JSON.stringify({ success: false, error: "vendor_id and status are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseClient.rpc("rpc_update_vendor_status", {
          p_vendor_id: payload.vendor_id,
          p_status: payload.status,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "history": {
        if (!payload.vendor_id) {
          return new Response(
            JSON.stringify({ success: false, error: "vendor_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseClient.rpc("rpc_get_vendor_history", {
          p_vendor_id: payload.vendor_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unsupported action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
