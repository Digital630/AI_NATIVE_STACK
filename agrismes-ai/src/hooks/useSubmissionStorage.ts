import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ToolType = "qc" | "moisture" | "kg";

export interface SubmissionConsent {
  consentResearch: boolean;
  consentStoreImage: boolean;
  consentMarketing: boolean;
}

export interface SubmissionData {
  toolType: ToolType;
  commodity: string;
  region?: string;
  resultJson: Record<string, unknown>;
  imageBase64?: string;
  consent: SubmissionConsent;
}

interface SubmissionResult {
  submissionId: string | null;
  researchId: string | null;
  imagePath: string | null;
}

export function useSubmissionStorage() {
  const [isStoring, setIsStoring] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<SubmissionResult | null>(null);

  /**
   * Store submission to Layer 1 (submissions_user) and optionally Layer 2 (submissions_research)
   * Only stores if user is authenticated
   */
  const storeSubmission = useCallback(async (data: SubmissionData): Promise<SubmissionResult> => {
    setIsStoring(true);
    const result: SubmissionResult = {
      submissionId: null,
      researchId: null,
      imagePath: null,
    };

    try {
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.log("[useSubmissionStorage] User not authenticated, skipping storage");
        return result;
      }

      // Upload image to storage if consent given
      if (data.consent.consentStoreImage && data.imageBase64) {
        try {
          const fileName = `${userId}/${data.toolType}-${Date.now()}.jpg`;
          const base64Data = data.imageBase64.includes(",") 
            ? data.imageBase64.split(",")[1] 
            : data.imageBase64;
          
          // Convert base64 to Uint8Array
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const { error: uploadError } = await supabase.storage
            .from("agri-uploads")
            .upload(fileName, bytes, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (!uploadError) {
            result.imagePath = fileName;
          } else {
            console.error("[useSubmissionStorage] Image upload error:", uploadError);
          }
        } catch (imgErr) {
          console.error("[useSubmissionStorage] Image processing error:", imgErr);
        }
      }

      // Store in submissions_user (Layer 1)
      // Using any to bypass type generation lag - tables exist in DB
      const { data: submission, error: insertError } = await (supabase as any)
        .from("submissions_user")
        .insert({
          user_id: userId,
          tool_type: data.toolType,
          commodity: data.commodity,
          region: data.region || null,
          image_path: result.imagePath,
          result_json: data.resultJson,
          consent_research: data.consent.consentResearch,
          consent_store_image: data.consent.consentStoreImage,
          consent_marketing: data.consent.consentMarketing,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[useSubmissionStorage] Layer 1 insert error:", insertError);
      } else {
        result.submissionId = submission?.id || null;
      }

      // Store anonymized data in submissions_research (Layer 2) if consent given
      if (data.consent.consentResearch && result.submissionId) {
        // Get user's country from profile (coarse location only) - using any for type bypass
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("country, region")
          .eq("id", userId)
          .single();

        // Extract non-identifying features from result
        const imageFeatures = extractImageFeatures(data.resultJson);

        // Using any to bypass type generation lag - tables exist in DB
        // Note: We don't select after insert because SELECT is denied on this table (research data is write-only)
        const { error: researchError } = await (supabase as any)
          .from("submissions_research")
          .insert({
            tool_type: data.toolType,
            commodity: data.commodity,
            country: profile?.country || null,
            region: data.region || profile?.region || null,
            result_json: sanitizeResultForResearch(data.resultJson),
            image_features_json: imageFeatures,
            source_submission_id: result.submissionId,
          });

        if (researchError) {
          console.error("[useSubmissionStorage] Layer 2 insert error:", researchError);
        } else {
          result.researchId = "anonymized"; // Confirm research data was stored
        }
      }

      setLastSubmission(result);
      return result;

    } catch (err) {
      console.error("[useSubmissionStorage] Error:", err);
      return result;
    } finally {
      setIsStoring(false);
    }
  }, []);

  /**
   * Create a market access request (Layer 3)
   */
  const requestMarketAccess = useCallback(async (
    submissionId: string,
    commodity: string,
    volumeEstimate: string,
    preferredMarket: "local" | "export" | "both"
  ): Promise<string | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.log("[useSubmissionStorage] User not authenticated for market request");
        return null;
      }

      // Using any to bypass type generation lag - tables exist in DB
      const { data, error } = await (supabase as any)
        .from("market_access_requests")
        .insert({
          user_id: userId,
          submission_id: submissionId,
          commodity,
          volume_estimate: volumeEstimate,
          preferred_market: preferredMarket,
          status: "new",
        })
        .select("id")
        .single();

      if (error) {
        console.error("[useSubmissionStorage] Market access request error:", error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.error("[useSubmissionStorage] Market access error:", err);
      return null;
    }
  }, []);

  return {
    storeSubmission,
    requestMarketAccess,
    isStoring,
    lastSubmission,
  };
}

/**
 * Extract non-identifying image features for research
 */
function extractImageFeatures(resultJson: Record<string, unknown>): Record<string, unknown> | null {
  const features: Record<string, unknown> = {};

  // Extract general quality metrics (non-identifying)
  if (typeof resultJson.moisturePercentage === "number") {
    features.moistureRange = categorizeValue(resultJson.moisturePercentage as number, [0, 5, 10, 15, 20, 100]);
  }

  if (typeof resultJson.confidenceLevel === "string") {
    features.confidenceLevel = resultJson.confidenceLevel;
  }

  if (resultJson.qualityMetrics && typeof resultJson.qualityMetrics === "object") {
    const qm = resultJson.qualityMetrics as Record<string, unknown>;
    if (typeof qm.colorUniformity === "number") {
      features.colorUniformityRange = categorizeValue(qm.colorUniformity as number, [0, 25, 50, 75, 100]);
    }
    if (typeof qm.defectPercentage === "number") {
      features.defectRange = categorizeValue(qm.defectPercentage as number, [0, 5, 15, 30, 100]);
    }
  }

  return Object.keys(features).length > 0 ? features : null;
}

/**
 * Sanitize result JSON for research (remove any potentially identifying info)
 */
function sanitizeResultForResearch(resultJson: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...resultJson };

  // Remove any fields that might contain identifying information
  delete sanitized.imageMetadata;
  delete sanitized.gpsLocation;
  delete sanitized.capturedAt;
  delete sanitized.timestamp;
  delete sanitized.sessionId;
  delete sanitized.visitorId;

  return sanitized;
}

/**
 * Categorize a numeric value into a range bucket
 */
function categorizeValue(value: number, buckets: number[]): string {
  for (let i = 0; i < buckets.length - 1; i++) {
    if (value >= buckets[i] && value < buckets[i + 1]) {
      return `${buckets[i]}-${buckets[i + 1]}`;
    }
  }
  return `${buckets[buckets.length - 1]}+`;
}
