import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, role, source } = await req.json();

    if (!name || !email || !role) {
      return new Response(JSON.stringify({ error: "Name, email, and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for duplicate
    const { data: existing } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ duplicate: true, message: "Already on the list" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert
    const { error: insertError } = await supabase.from("waitlist_users").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      source: source || "upgrade_plan",
    });

    if (insertError) throw insertError;

    // Send email notification
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const timestamp = new Date().toISOString();
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AGRISMES <onboarding@resend.dev>",
          to: ["lentachai@gmail.com"],
          subject: "New AGRISMES Waitlist User",
          html: `
            <h2>New Waitlist Signup</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Source:</strong> ${source || "upgrade_plan"}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return new Response(JSON.stringify({ error: "Failed to join waitlist" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
