/**
 * HaMerutz L-70 — Control Room (חדר הבקרה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Shown after the team sends their photo. Polls the server for the review
 * status: approved → advance automatically, rejected → show the production
 * note and move to TryAgain. Photos and videos can be added while waiting.
 * Only a production approval advances the team — no manual skip.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Lightbulb } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import HintCenter from "./HintCenter";
import { trpc } from "@/lib/trpc";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";

export default function ControlRoom() {
  const { currentStation, approveMission, retryMission, retryPhoto } = useGame();
  const [showHints, setShowHints] = useState(false);
  const [uploading, setUploading] = useState(false);
  const handledSubmissionId = useRef<number | null>(null);

  const teamId = parseInt(localStorage.getItem("hamerutz_team_id") ?? "0", 10);
  const stationDbId = currentStation.dbId ?? currentStation.number;

  // Live review status — poll every 5s while waiting
  const { data: submissions } = trpc.game.getTeamSubmissions.useQuery(
    { teamId },
    { enabled: !!teamId, refetchInterval: 5000 }
  );

  useEffect(() => {
    if (!submissions) return;
    const forStation = submissions.filter((s) => s.stationId === stationDbId);
    const latest = forStation[forStation.length - 1];
    if (!latest || latest.id === handledSubmissionId.current) return;
    if (latest.status === "approved") {
      handledSubmissionId.current = latest.id;
      toast.success("ההפקה אישרה את המשימה! 🎉");
      approveMission();
    } else if (latest.status === "rejected") {
      handledSubmissionId.current = latest.id;
      if (latest.adminNote) {
        localStorage.setItem("hamerutz_last_note", latest.adminNote);
      } else {
        localStorage.removeItem("hamerutz_last_note");
      }
      retryMission();
    }
  }, [submissions, stationDbId, approveMission, retryMission]);

  const uploadMutation = trpc.game.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("תמונה נוספת נשלחה! 📸");
      setUploading(false);
    },
    onError: () => {
      toast.error("שגיאה בהעלאת התמונה, נסו שוב");
      setUploading(false);
    },
  });

  const recordSubmissionMutation = trpc.game.recordSubmission.useMutation({
    onSuccess: () => {
      toast.success("הסרטון נשלח! 🎬");
      setUploading(false);
    },
    onError: () => {
      toast.error("שגיאה בשליחת הסרטון, נסו שוב");
      setUploading(false);
    },
  });

  const handleExtraPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !teamId) return;

    // Videos upload straight to Blob storage (no serverless size limit)
    if (file.type.startsWith("video/")) {
      if (file.size > 200 * 1024 * 1024) {
        toast.error("הסרטון גדול מדי — עד 200MB");
        return;
      }
      setUploading(true);
      try {
        const blob = await upload(
          `submissions/team-${teamId}/video-${Date.now()}-${file.name}`,
          file,
          { access: "public", handleUploadUrl: "/api/blob/upload", contentType: file.type }
        );
        recordSubmissionMutation.mutate({
          teamId,
          stationId: stationDbId,
          url: blob.url,
          mediaType: "video",
        });
      } catch {
        toast.error("שגיאה בהעלאת הסרטון, נסו שוב");
        setUploading(false);
      }
      return;
    }

    setUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      const dataUrl: string = await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const MAX = 1600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no canvas"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("bad image"));
        img.src = objectUrl;
      });
      uploadMutation.mutate({
        teamId,
        stationId: stationDbId,
        imageBase64: dataUrl.split(",")[1],
        mimeType: "image/jpeg",
      });
    } catch {
      toast.error("שגיאה בקריאת התמונה");
      setUploading(false);
    }
  };

  return (
    <>
      <div className="game-screen overflow-y-auto" dir="rtl">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-[oklch(0.13_0.03_250)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 80%, oklch(0.72 0.12 75 / 0.3), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-full max-w-[480px] mx-auto w-full px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-12 pb-6 shrink-0">
            <div className="station-badge">{currentStation.number}</div>
            <p className="text-gold/60 text-xs tracking-widest uppercase">חדר הבקרה</p>
          </div>

          <div className="gold-rule mb-8 shrink-0" />

          {/* Main content */}
          <div className="flex flex-col gap-6 my-auto py-2">
            {/* Icon — pulsing while waiting */}
            <motion.div
              className="flex justify-center shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  background: "oklch(0.72 0.12 75 / 0.1)",
                  border: "1px solid oklch(0.72 0.12 75 / 0.3)",
                }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                📡
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-display text-white text-3xl font-bold text-center shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              חדר הבקרה
            </motion.h1>

            {/* Instructions */}
            <motion.div
              className="glass-card p-5 text-center shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <p className="text-white/90 text-base leading-relaxed mb-2">
                המשימה נשלחה לצוות ההפקה 🕐
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                רק אישור של ההפקה מעביר לתחנה הבאה — זה יקרה אוטומטית ברגע שיאשרו.
                <br />
                בינתיים אפשר להוסיף תמונות וסרטונים.
              </p>
            </motion.div>
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex flex-col gap-3 pb-10 pt-6 shrink-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {/* Extra photo */}
            <input
              id="extra-photo-input"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleExtraPhoto}
            />
            <button
              className="btn-gold flex items-center justify-center gap-2"
              onClick={() => document.getElementById("extra-photo-input")?.click()}
              disabled={uploading}
            >
              <Camera size={16} />
              {uploading ? "מעלה..." : "הוסיפו תמונה או סרטון"}
            </button>

            {/* Back to the task screen (does not skip the approval gate) */}
            <button
              className="btn-outline-gold flex items-center justify-center gap-2"
              onClick={retryPhoto}
            >
              חזרה למסך המשימה
            </button>

            <button
              className="btn-outline-gold flex items-center justify-center gap-2"
              onClick={() => setShowHints(true)}
            >
              <Lightbulb size={16} />
              צריכים עזרה?
            </button>
          </motion.div>
        </div>
      </div>

      {showHints && <HintCenter onClose={() => setShowHints(false)} />}
    </>
  );
}
