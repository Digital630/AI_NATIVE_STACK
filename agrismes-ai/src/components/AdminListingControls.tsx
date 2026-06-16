import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Flag,
  Star,
  MessageSquare,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminTag = "approved" | "clarification_needed" | "rejected" | "high_risk" | "promising";
type AdminReviewStatus = "pending" | "conditional" | "not_ready" | "approved" | "rejected";

interface AdminListingControlsProps {
  listingId: string;
  currentTag?: AdminTag | null;
  currentNotes?: string | null;
  currentReviewStatus?: AdminReviewStatus | null;
  isVisible?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const TAG_CONFIG: Record<AdminTag, {
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}> = {
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    description: "Ready for facilitated introductions",
  },
  clarification_needed: {
    label: "Clarification Needed",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    description: "Requires additional information from user",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
    description: "Does not meet listing requirements",
  },
  high_risk: {
    label: "High Risk",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Flag className="w-3.5 h-3.5" />,
    description: "Flagged for additional review",
  },
  promising: {
    label: "Promising",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Star className="w-3.5 h-3.5" />,
    description: "High potential, prioritize review",
  },
};

const REVIEW_STATUS_CONFIG: Record<AdminReviewStatus, {
  label: string;
  color: string;
}> = {
  pending: { label: "Pending Review", color: "bg-muted text-muted-foreground" },
  conditional: { label: "Conditional", color: "bg-amber-100 text-amber-700" },
  not_ready: { label: "Not Ready", color: "bg-orange-100 text-orange-700" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export function AdminListingControls({
  listingId,
  currentTag,
  currentNotes,
  currentReviewStatus,
  isVisible = true,
  onUpdate,
  onDelete,
}: AdminListingControlsProps) {
  const [selectedTag, setSelectedTag] = useState<AdminTag | "">(currentTag || "");
  const [reviewStatus, setReviewStatus] = useState<AdminReviewStatus>(currentReviewStatus || "pending");
  const [notes, setNotes] = useState(currentNotes || "");
  const [visible, setVisible] = useState(isVisible);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("commodity_listings")
        .update({
          admin_review_status: "approved",
          admin_tag: "approved",
          is_visible: true,
        })
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing approved and now visible to users!");
      setReviewStatus("approved");
      setSelectedTag("approved");
      setVisible(true);
      onUpdate?.();
    } catch (err) {
      console.error("[AdminListingControls] Approve error:", err);
      toast.error("Failed to approve listing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("commodity_listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing deleted successfully");
      onDelete?.();
    } catch (err) {
      console.error("[AdminListingControls] Delete error:", err);
      toast.error("Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("commodity_listings")
        .update({
          admin_tag: selectedTag || null,
          admin_notes: notes || null,
          admin_review_status: reviewStatus,
          is_visible: visible,
        })
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing updated successfully");
      onUpdate?.();
    } catch (err) {
      console.error("[AdminListingControls] Save error:", err);
      toast.error("Failed to update listing");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    selectedTag !== (currentTag || "") || 
    notes !== (currentNotes || "") || 
    reviewStatus !== (currentReviewStatus || "pending") ||
    visible !== isVisible;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Admin Controls</span>
          {currentTag && (
            <Badge className={`${TAG_CONFIG[currentTag].color} text-[10px]`}>
              {TAG_CONFIG[currentTag].icon}
              <span className="ml-1">{TAG_CONFIG[currentTag].label}</span>
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-800">
              {/* Admin Tag */}
              <div className="space-y-2">
                <Label className="text-xs">Admin Tag (Not visible to users)</Label>
                <Select
                  value={selectedTag}
                  onValueChange={(v) => setSelectedTag(v as AdminTag)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAG_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTag && (
                  <p className="text-[10px] text-muted-foreground">
                    {TAG_CONFIG[selectedTag].description}
                  </p>
                )}
              </div>

              {/* Review Status */}
              <div className="space-y-2">
                <Label className="text-xs">Review Status (Visible to listing owner)</Label>
                <Select
                  value={reviewStatus}
                  onValueChange={(v) => setReviewStatus(v as AdminReviewStatus)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REVIEW_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span>{config.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Internal Notes
                </Label>
                <Textarea
                  placeholder="Add internal notes about this listing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm min-h-[80px]"
                  maxLength={1000}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {notes.length}/1000
                </p>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  {visible ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Public Visibility</span>
                </div>
                <Switch
                  checked={visible}
                  onCheckedChange={setVisible}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isSaving || reviewStatus === "approved"}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Quick Approve
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this listing? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="w-full"
                variant="outline"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Tags and notes are only visible to administrators
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminListingControls;
