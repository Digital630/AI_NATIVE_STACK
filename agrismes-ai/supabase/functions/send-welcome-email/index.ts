import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, userType }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!email) {
      throw new Error("Email is required");
    }

    const firstName = fullName?.split(" ")[0] || "there";
    const roleText = userType === "buyer" ? "a buyer" : userType === "seller" ? "a seller" : "a member";

    const emailResponse = await resend.emails.send({
      from: "AgriSMES <noreply@agrismes.com>",
      to: [email],
      subject: "Welcome to AgriSMES – Your Agricultural Trade Partner",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 8px;">Welcome to AgriSMES!</h1>
            <p style="color: #666; margin: 0;">Your gateway to agricultural trade</p>
          </div>
          
          <p>Hi ${firstName},</p>
          
          <p>Thank you for joining AgriSMES as ${roleText}. We're excited to have you on board!</p>
          
          <h2 style="color: #16a34a; font-size: 18px; margin-top: 30px;">What you can do now:</h2>
          
          <ul style="padding-left: 20px;">
            <li><strong>Complete your profile</strong> – Add your company details and contact information</li>
            <li><strong>Explore listings</strong> – Browse agricultural commodities from verified traders</li>
            <li><strong>Submit listings</strong> – Post your own buy or sell listings</li>
            <li><strong>Use AI tools</strong> – Get quality analysis and market insights</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://wwwagrismescom.lovable.app/profile" 
               style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Set Up Your Profile
            </a>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://wwwagrismescom.lovable.app/explore-listings" 
               style="background-color: #f4f4f5; color: #333; padding: 10px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Explore Listings
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            Need help? Chat with Alex, our AI assistant, or reach out to our team.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The AgriSMES Team
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              AgriSMES – AI-Powered Agricultural Trade Intelligence
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
