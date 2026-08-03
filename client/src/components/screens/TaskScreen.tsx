/**
 * HaMerutz L-70 — Task Screen (מסך משימה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Full-viewport screen with:
 * - Station image (placeholder gradient)
 * - Title
 * - Task instructions
 * - Waze button (optional)
 * - Help button → HintCenter
 * - Send photo button → ControlRoom
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, Lightbulb, Camera } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import HintCenter from "./HintCenter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Placeholder gradient backgrounds per station (used until real images are approved)
const STATION_GRADIENTS: Record<string, string> = {
  "01-opening": "linear-gradient(135deg, oklch(0.2 0.04 250), oklch(0.15 0.03 260))",
  "02-netanya": "linear-gradient(135deg, oklch(0.2 0.04 220), oklch(0.15 0.06 200))",
  "03-neurim": "linear-gradient(135deg, oklch(0.18 0.04 160), oklch(0.13 0.03 200))",
  "04-technion": "linear-gradient(135deg, oklch(0.18 0.04 280), oklch(0.13 0.03 250))",
};

export default function TaskScreen() {
  const { currentStation, goToControlRoom } = useGame();
  const [showHints, setShowHints] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Get teamId from localStorage
  const teamId = parseInt(localStorage.getItem("hamerutz_team_id") ?? "0", 10);

  const uploadMutation = trpc.game.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("התמונה הועלתה בהצלחה! 📸");
      setUploading(false);
      goToControlRoom();
    },
    onError: () => {
      toast.error("שגיאה בהעלאת התמונה, נסו שוב");
      setUploading(false);
    },
  });

  // Downscale + re-encode the photo before upload. Phone cameras produce
  // multi-MB images that exceed the serverless request body limit (~4.5MB);
  // resizing to max 1600px JPEG keeps uploads small and reliable.
  const compressImage = (file: File): Promise<{ base64: string; dataUrl: string }> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1600;
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ base64: dataUrl.split(",")[1], dataUrl });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("failed to load image"));
      };
      img.src = objectUrl;
    });

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow picking the same file again next time
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { base64, dataUrl } = await compressImage(file);
      setPhotoPreview(dataUrl);
      uploadMutation.mutate({
        teamId: teamId || 0,
        stationId: currentStation.dbId ?? currentStation.number,
        imageBase64: base64,
        mimeType: "image/jpeg",
      });
    } catch {
      toast.error("שגיאה בקריאת התמונה, נסו שוב");
      setUploading(false);
    }
  };

  const handleSendPhoto = () => {
    if (!teamId) {
      // No team registered — go directly to control room (fallback)
      goToControlRoom();
      return;
    }
    // Trigger file input
    document.getElementById("photo-input")?.click();
  };

  const gradient = STATION_GRADIENTS[currentStation.image] ||
    "linear-gradient(135deg, oklch(0.18 0.04 250), oklch(0.13 0.03 250))";

  return (
    <>
      <div className="game-screen" dir="rtl">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.13_0.03_250/0.3)] to-[oklch(0.13_0.03_250/0.98)]" />

        {/* Station image placeholder */}
        <div
          className="absolute top-0 left-0 right-0 h-[45vh]"
          style={{ background: gradient }}
        >
          {/* Image label overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gold/40 text-xs tracking-widest uppercase mb-1">תמונה</p>
              <p className="text-white/20 text-sm font-mono">{currentStation.image}</p>
            </div>
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.13_0.03_250)] to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full max-w-[480px] mx-auto w-full px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-12 pb-4">
            <div className="station-badge">{currentStation.number}</div>
            <p className="text-gold/60 text-xs tracking-widest uppercase">משימה</p>
          </div>

          {/* Spacer to push content below image */}
          <div style={{ height: "calc(45vh - 80px)" }} />

          {/* Task content */}
          <div className="flex-1 flex flex-col justify-between pb-8">
            <div className="flex flex-col gap-4">
              <motion.h1
                className="font-display text-white text-2xl font-bold"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                {currentStation.task.title}
              </motion.h1>

              <motion.div
                className="glass-card p-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
              >
                <p className="text-white/90 text-base leading-relaxed">
                  {currentStation.task.instructions}
                </p>
              </motion.div>
            </div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3 mt-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 }}
            >
              {/* Waze button — only if wazeLink exists */}
              {currentStation.task.wazeLink && (
                <a
                  href={currentStation.task.wazeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-gold flex items-center justify-center gap-2 no-underline"
                >
                  <Navigation size={16} />
                  פתח ב-Waze
                </a>
              )}

              {/* Help button */}
              <button
                className="btn-outline-gold flex items-center justify-center gap-2"
                onClick={() => setShowHints(true)}
              >
                <Lightbulb size={16} />
                צריכים עזרה?
              </button>

              {/* Send photo button */}
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              {photoPreview && (
                <div className="rounded-xl overflow-hidden border border-[#c9a84c]/30">
                  <img src={photoPreview} alt="תצוגה מקדימה" className="w-full h-32 object-cover" />
                </div>
              )}
              <button
                className="btn-gold flex items-center justify-center gap-2"
                onClick={handleSendPhoto}
                disabled={uploading}
              >
                <Camera size={16} />
                {uploading ? "מעלה תמונה..." : "צלם ושלח תמונה"}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hint Center modal */}
      {showHints && <HintCenter onClose={() => setShowHints(false)} />}
    </>
  );
}
