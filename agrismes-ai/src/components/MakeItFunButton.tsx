import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Image, Award, Music, Loader2, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateMoodBadge, getJingleCaption, playJingleSound } from "@/utils/makeItFun";

type FunType = "cartoon" | "badge" | "jingle";

interface FunOutput {
  type: FunType;
  data: string;
  caption?: string;
}

interface MakeItFunButtonProps {
  imageBase64?: string;
  resultSummary: {
    commodity: string;
    grade?: string;
    quality?: string;
    moistureStatus?: string;
    confidenceLevel?: string;
  };
  toolType: "qc" | "moisture" | "kg";
  consentMarketing: boolean;
  submissionId?: string | null;
  onFunGenerated?: (output: FunOutput) => void;
}

export function MakeItFunButton({
  imageBase64,
  resultSummary,
  toolType,
  consentMarketing,
  submissionId,
  onFunGenerated,
}: MakeItFunButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<FunType | null>(null);
  const [funOutput, setFunOutput] = useState<FunOutput | null>(null);

  const generateFunContent = async (type: FunType) => {
    setSelectedType(type);
    setIsGenerating(true);
    setFunOutput(null);

    try {
      if (type === "cartoon") {
        // Generate cartoon version using AI image generation
        const { data, error } = await supabase.functions.invoke("generate-commodity-image", {
          body: {
            commodity: resultSummary.commodity,
            prompt: `Create a fun, friendly cartoon illustration of ${resultSummary.commodity}. Make it colorful, playful, and appealing with a happy, cheerful style. Keep it simple and fun. No text or labels.`,
            imageBase64: imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : undefined,
            style: "cartoon",
          },
        });

        if (error) {
          console.error("Cartoon generation error:", error);
          throw error;
        }

        if (data?.imageUrl) {
          const output: FunOutput = {
            type: "cartoon",
            data: data.imageUrl,
            caption: `Your ${resultSummary.commodity} got a makeover! 🎨`,
          };
          setFunOutput(output);
          onFunGenerated?.(output);

          if (consentMarketing && submissionId) {
            await storeFunOutput(output);
          }
        } else {
          throw new Error("No image generated");
        }
      } else if (type === "badge") {
        const badge = generateMoodBadge(resultSummary);
        const output: FunOutput = {
          type: "badge",
          data: badge.svg,
          caption: badge.caption,
        };
        setFunOutput(output);
        onFunGenerated?.(output);

        if (consentMarketing && submissionId) {
          await storeFunOutput(output);
        }
      } else if (type === "jingle") {
        const caption = getJingleCaption(resultSummary);
        const output: FunOutput = {
          type: "jingle",
          data: "playing",
          caption,
        };
        setFunOutput(output);
        onFunGenerated?.(output);

        // Play jingle using Web Audio API
        await playJingleSound(resultSummary);

        if (consentMarketing && submissionId) {
          await storeFunOutput(output);
        }
      }

      toast.success(`${type === "cartoon" ? "Cartoon" : type === "badge" ? "Badge" : "Jingle"} created!`);
    } catch (err) {
      console.error("Fun generation error:", err);
      toast.error("Couldn't create fun content. Try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  const storeFunOutput = async (output: FunOutput) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      await (supabase as any).from("fun_outputs").insert({
        user_id: session.session.user.id,
        submission_id: submissionId,
        fun_type: output.type,
        output_data: {
          caption: output.caption,
          dataPreview: output.data.substring(0, 100),
        },
      });
    } catch (err) {
      console.error("Failed to store fun output:", err);
    }
  };

  const handleDownload = () => {
    if (!funOutput) return;

    if (funOutput.type === "cartoon" || funOutput.type === "badge") {
      const link = document.createElement("a");
      link.href = funOutput.data;
      const ext = funOutput.type === "badge" ? "svg" : "png";
      link.download = `agrismes-${funOutput.type}-${Date.now()}.${ext}`;
      link.click();
    }
    toast.success("Downloaded!");
  };

  const handleShare = async () => {
    if (!funOutput) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgriSMES Fun ${funOutput.type}`,
          text: funOutput.caption,
        });
      } catch {
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Sparkles className="h-4 w-4" />
        Make it Fun
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Make it Fun!
            </DialogTitle>
            <DialogDescription>
              Add some fun to your {resultSummary.commodity} analysis results
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!funOutput ? (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-3 gap-3 py-4"
              >
                <button
                   type="button"
                  onClick={() => generateFunContent("cartoon")}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating && selectedType === "cartoon" ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <Image className="h-8 w-8 text-primary" />
                  )}
                  <span className="text-sm font-medium">Cartoon</span>
                  <span className="text-xs text-muted-foreground text-center">Fun illustration</span>
                </button>

                <button
                   type="button"
                  onClick={() => generateFunContent("badge")}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/5 hover:border-yellow-500/40 transition-colors disabled:opacity-50"
                >
                  {isGenerating && selectedType === "badge" ? (
                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                  ) : (
                    <Award className="h-8 w-8 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">Badge</span>
                  <span className="text-xs text-muted-foreground text-center">Fun mood badge</span>
                </button>

                <button
                   type="button"
                  onClick={() => generateFunContent("jingle")}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-green-500/20 hover:bg-green-500/5 hover:border-green-500/40 transition-colors disabled:opacity-50"
                >
                  {isGenerating && selectedType === "jingle" ? (
                    <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                  ) : (
                    <Music className="h-8 w-8 text-green-500" />
                  )}
                  <span className="text-sm font-medium">Jingle</span>
                  <span className="text-xs text-muted-foreground text-center">Playful sound</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 space-y-4"
              >
                <div className="text-center">
                  {funOutput.type === "cartoon" && (
                    <img
                      src={funOutput.data}
                      alt="Cartoon version"
                      className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                    />
                  )}
      {funOutput.type === "badge" && (
                    <img 
                      src={funOutput.data} 
                      alt="Mood badge" 
                      className="w-32 h-32 mx-auto"
                    />
                  )}
                  {funOutput.type === "jingle" && (
                    <div className="flex flex-col items-center gap-2">
                      <Music className="h-16 w-16 text-green-500 animate-pulse" />
                      <p className="text-sm text-muted-foreground">Playing your jingle...</p>
                    </div>
                  )}
                </div>

                {funOutput.caption && (
                  <p className="text-center text-sm font-medium text-primary">
                    {funOutput.caption}
                  </p>
                )}

                <div className="flex justify-center gap-2">
                  {(funOutput.type === "cartoon" || funOutput.type === "badge") && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                       <Button variant="outline" size="sm" type="button" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-1" /> Share
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                     type="button"
                    onClick={() => setFunOutput(null)}
                  >
                    Try Another
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground text-center">
            This is for entertainment only and doesn't affect your analysis results.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
