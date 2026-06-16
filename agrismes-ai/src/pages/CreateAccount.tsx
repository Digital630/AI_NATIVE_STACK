import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Building2, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validatePassword } from "@/utils/passwordValidation";
import { USER_TYPES, type UserType } from "@/utils/userTypes";
import agrismesLogo from "@/assets/agrismes-logo-v3.png";

export default function CreateAccount() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phoneWhatsapp: "",
    userType: "seller" as UserType,
    termsAccepted: false,
  });

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            phone_whatsapp: formData.phoneWhatsapp,
            user_type: formData.userType,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional details
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName,
            company_name: formData.companyName,
            phone_whatsapp: formData.phoneWhatsapp,
            user_type: formData.userType,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        // Send welcome email (non-blocking)
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: {
              email: formData.email,
              fullName: formData.fullName,
              userType: formData.userType,
            },
          });
        } catch (emailError) {
          console.error("Welcome email error:", emailError);
          // Don't fail signup if email fails
        }

        toast.success("Account created successfully! Welcome to AgriSMES.");
        navigate("/profile");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create an Account | AgriSMES Platform for Agricultural Trade and Market Intelligence</title>
        <meta 
          name="description" 
          content="Create your account on AgriSMES to connect with buyers and sellers in the agricultural value chain, access AI-driven insights, and list your products or inquiries." 
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-12">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-lg mx-auto">
              {/* Logo & Header */}
              <div className="text-center mb-8">
                <img 
                  src={agrismesLogo} 
                  alt="AgriSMES" 
                  className="h-12 mx-auto mb-4"
                />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Create Your Account
                </h1>
                <p className="text-muted-foreground mt-2">
                  Join AgriSMES to connect with the agricultural trade community
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6 md:p-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Your company or organization"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* WhatsApp/Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phoneWhatsapp">WhatsApp / Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneWhatsapp"
                      type="tel"
                      placeholder="+255 XXX XXX XXX"
                      value={formData.phoneWhatsapp}
                      onChange={(e) => setFormData({ ...formData, phoneWhatsapp: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* User Type */}
                <div className="space-y-2">
                  <Label>I am a... *</Label>
                  <Select 
                    value={formData.userType} 
                    onValueChange={(value) => setFormData({ ...formData, userType: value as UserType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_TYPES).map(([key, { label, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.userType && USER_TYPES[formData.userType] && (
                    <p className="text-xs text-muted-foreground">
                      {USER_TYPES[formData.userType].description}
                    </p>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, termsAccepted: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms-of-use" className="text-primary hover:underline" target="_blank">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full min-h-[48px]"
                  disabled={isLoading || !passwordValidation.isValid || !formData.termsAccepted}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>

                {/* Sign In Link */}
                <p className="text-sm text-center text-muted-foreground pt-2">
                  Already have an account?{" "}
                  <Link to="/sign-in" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
