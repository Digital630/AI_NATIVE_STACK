import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { mintAdminToken } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin code - loaded from environment secret
const ADMIN_CODE = Deno.env.get("ADMIN_CODE");
// Secret used to sign short-lived admin session tokens (server-only).
const ADMIN_SESSION_SECRET = Deno.env.get("ADMIN_SESSION_SECRET");

// Lockout durations in minutes by cycle
const LOCKOUT_DURATIONS = [15, 30, 24 * 60]; // 15min, 30min, 24 hours

interface VerifyRequest {
  code: string;
  visitorId: string;
  deviceFingerprint?: string;
}

interface LockoutState {
  identifier: string;
  failed_attempts: number;
  lockout_cycle: number;
  locked_until: string | null;
  last_attempt_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { code, visitorId, deviceFingerprint }: VerifyRequest = await req.json();

    if (!visitorId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing visitor ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use visitorId as primary identifier, fallback to deviceFingerprint
    const identifier = visitorId || deviceFingerprint || "unknown";

    // Check current lockout state
    const { data: lockoutData } = await supabase
      .from("admin_lockout_state")
      .select("*")
      .eq("identifier", identifier)
      .maybeSingle();

    const now = new Date();

    // Check if currently locked out
    if (lockoutData?.locked_until) {
      const lockedUntil = new Date(lockoutData.locked_until);
      if (lockedUntil > now) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);

        // Log the blocked attempt
        await supabase.from("admin_access_logs").insert({
          visitor_id: visitorId,
          device_fingerprint: deviceFingerprint || null,
          attempt_type: "failure",
          lock_duration_minutes: remainingMinutes,
          lock_expires_at: lockoutData.locked_until,
        });

        return new Response(
          JSON.stringify({
            success: false,
            locked: true,
            lockedUntil: lockoutData.locked_until,
            remainingMinutes,
            message: `Admin access is temporarily locked. Try again in ${remainingMinutes} minutes.`,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verify the code
    const isValidCode = code === ADMIN_CODE;

    if (isValidCode) {
      // SUCCESS - Reset lockout state and log success
      if (lockoutData) {
        await supabase
          .from("admin_lockout_state")
          .update({
            failed_attempts: 0,
            lockout_cycle: 0,
            locked_until: null,
            last_attempt_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("identifier", identifier);
      }

      // Log successful access
      await supabase.from("admin_access_logs").insert({
        visitor_id: visitorId,
        device_fingerprint: deviceFingerprint || null,
        attempt_type: "success",
      });

      if (!ADMIN_SESSION_SECRET) {
        console.error("[admin-verify] ADMIN_SESSION_SECRET not configured");
        return new Response(
          JSON.stringify({ success: false, error: "Server not configured for admin sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mint a short-lived signed admin session token. Privileged endpoints
      // verify this signature server-side — replacing the old client-trusted
      // "verified" string / embedded admin code.
      const token = await mintAdminToken(ADMIN_SESSION_SECRET);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin access granted",
          token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FAILURE - Update lockout state
    let newFailedAttempts = (lockoutData?.failed_attempts || 0) + 1;
    let newLockoutCycle = lockoutData?.lockout_cycle || 0;
    let newLockedUntil: Date | null = null;

    // Check if we've hit the 3-failure threshold for this cycle
    if (newFailedAttempts >= 3) {
      // Move to next lockout cycle
      newLockoutCycle = Math.min(newLockoutCycle + 1, 3); // Cap at cycle 3 (24 hours)
      const lockoutMinutes = LOCKOUT_DURATIONS[Math.min(newLockoutCycle - 1, LOCKOUT_DURATIONS.length - 1)];
      newLockedUntil = new Date(now.getTime() + lockoutMinutes * 60000);
      newFailedAttempts = 0; // Reset attempts for new cycle
    }

    // Upsert lockout state
    const lockoutStateData = {
      identifier,
      failed_attempts: newFailedAttempts,
      lockout_cycle: newLockoutCycle,
      locked_until: newLockedUntil?.toISOString() || null,
      last_attempt_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (lockoutData) {
      await supabase
        .from("admin_lockout_state")
        .update(lockoutStateData)
        .eq("identifier", identifier);
    } else {
      await supabase.from("admin_lockout_state").insert({
        ...lockoutStateData,
        created_at: now.toISOString(),
      });
    }

    // Log failed attempt
    await supabase.from("admin_access_logs").insert({
      visitor_id: visitorId,
      device_fingerprint: deviceFingerprint || null,
      attempt_type: "failure",
      lock_duration_minutes: newLockedUntil ? LOCKOUT_DURATIONS[Math.min(newLockoutCycle - 1, LOCKOUT_DURATIONS.length - 1)] : null,
      lock_expires_at: newLockedUntil?.toISOString() || null,
    });

    // Return appropriate response
    if (newLockedUntil) {
      const lockoutMinutes = LOCKOUT_DURATIONS[Math.min(newLockoutCycle - 1, LOCKOUT_DURATIONS.length - 1)];
      return new Response(
        JSON.stringify({
          success: false,
          locked: true,
          lockedUntil: newLockedUntil.toISOString(),
          remainingMinutes: lockoutMinutes,
          hideIcon: true,
          message: `Too many failed attempts. Admin access locked for ${lockoutMinutes >= 60 ? Math.round(lockoutMinutes / 60) + " hours" : lockoutMinutes + " minutes"}.`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const remainingAttempts = 3 - newFailedAttempts;
    return new Response(
      JSON.stringify({
        success: false,
        locked: false,
        remainingAttempts,
        message: `Invalid admin code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`,
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[admin-verify] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
