import { useState, useRef } from "react";
import { Camera, Upload, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  userId: string;
  onImageUpdate: (url: string) => void;
  userName?: string;
}

export function ProfileImageUpload({ 
  currentImageUrl, 
  userId, 
  onImageUpdate,
  userName 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("agri-uploads")
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("agri-uploads")
        .getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onImageUpdate(publicUrl);
      toast.success("Profile image updated!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploading(true);
    
    try {
      // Update profile to remove image URL
      const { error } = await supabase
        .from("profiles")
        .update({ profile_image_url: null })
        .eq("id", userId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageUpdate("");
      toast.success("Profile image removed");
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error("Failed to remove image");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-2 border-border">
          <AvatarImage src={previewUrl || undefined} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {userName ? getInitials(userName) : <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {previewUrl && !isUploading && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG or GIF • Max 5MB
      </p>
    </div>
  );
}
