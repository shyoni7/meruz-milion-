/**
 * HaMerutz L-70 — Task Screen (מסך משימה)
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Supports four mission types (set per station in the admin panel):
 * - photo:       take a photo → production approval (ControlRoom)
 * - puzzle:      3x3 sliding puzzle from an admin image → auto-advance
 * - coordinates: type the correct answer/code → auto-advance
 * - morse:       decode a morse message (QR hidden at the station) using
 *                the in-app legend, type the word → auto-advance
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, Lightbulb, Camera, KeyRound, Radio } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import HintCenter from "./HintCenter";
import SlidingPuzzle from "@/components/SlidingPuzzle";
import { HEBREW_LEGEND } from "@/lib/morse";
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
  const { currentStation, goToControlRoom, approveMission } = useGame();
  const [showHints, setShowHints] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ base64: string; dataUrl: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const taskType = currentStation.taskType ?? "photo";

  // Get teamId from localStorage
  const teamId = parseInt(localStorage.getItem("hamerutz_team_id") ?? "0", 10);

  const uploadMutation = trpc.game.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("התמונה הועלתה בהצלחה! 📸");
      setUploading(false);
      setPendingPhoto(null);
      setCaption("");
      goToControlRoom();
    },
    onError: () => {
      toast.error("שגיאה בהעלאת התמונה, נסו שוב");
      setUploading(false);
    },
  });

  const checkAnswerMutation = trpc.game.checkAnswer.useMutation({
    onSuccess: (res) => {
      if (res.correct) {
        toast.success("תשובה נכונה! 🎉");
        setAnswerCorrect(true);
      } else {
        toast.error("תשובה שגויה, נסו שוב");
      }
    },
    onError: () => toast.error("שגיאה בבדיקת התשובה, נסו שוב"),
  });

  const handleCheckAnswer = () => {
    if (!answer.trim() || !currentStation.dbId) return;
    checkAnswerMutation.mutate({ stationId: currentStation.dbId, answer });
  };

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
    try {
      const photo = await compressImage(file);
      setPendingPhoto(photo);
      setPhotoPreview(photo.dataUrl);
    } catch {
      toast.error("שגיאה בקריאת התמונה, נסו שוב");
    }
  };

  const handleUploadPending = () => {
    if (!pendingPhoto) return;
    setUploading(true);
    uploadMutation.mutate({
      teamId: teamId || 0,
      stationId: currentStation.dbId ?? currentStation.number,
      imageBase64: pendingPhoto.base64,
      mimeType: "image/jpeg",
      caption: caption.trim() || undefined,
    });
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

  const answerInput = (placeholder: string) =>
    answerCorrect ? (
      <div className="flex flex-col gap-3">
        <div className="glass-card p-4 text-center border-green-500/40">
          <p className="text-gold font-bold text-lg">🎉 תשובה נכונה!</p>
        </div>
        <button className="btn-gold flex items-center justify-center gap-2" onClick={approveMission}>
          עברו למשימה הבאה ⬅
        </button>
      </div>
    ) : (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-[oklch(0.1_0.03_250/0.8)] border border-[#c9a84c]/40 text-white text-lg text-center py-3 px-4 focus:outline-none focus:border-[#c9a84c]"
        onKeyDown={(e) => e.key === "Enter" && handleCheckAnswer()}
      />
      <button
        className="btn-gold flex items-center justify-center gap-2"
        onClick={handleCheckAnswer}
        disabled={checkAnswerMutation.isPending || !answer.trim()}
      >
        <KeyRound size={16} />
        {checkAnswerMutation.isPending ? "בודק..." : "בדקו את התשובה"}
      </button>
    </div>
  );

  return (
    <>
      <div className="game-screen overflow-y-auto" dir="rtl">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.13_0.03_250/0.3)] to-[oklch(0.13_0.03_250/0.98)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-full max-w-[480px] mx-auto w-full px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-12 pb-4 shrink-0">
            <div className="station-badge">{currentStation.number}</div>
            <p className="text-gold/60 text-xs tracking-widest uppercase">
              {taskType === "puzzle" && "פאזל"}
              {taskType === "coordinates" && "קואורדינטות"}
              {taskType === "morse" && "קוד מורס"}
              {taskType === "photo" && "משימה"}
            </p>
          </div>

          {/* Task content */}
          <div className="flex-1 flex flex-col gap-4 pb-8">
            <motion.h1
              className="font-display text-white text-2xl font-bold shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              {currentStation.task.title}
            </motion.h1>

            <motion.div
              className="glass-card p-4 shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <p className="text-white/90 text-base leading-relaxed">
                {currentStation.task.instructions}
              </p>
            </motion.div>

            {/* Audio clip (if configured) */}
            {currentStation.taskAudioUrl && (
              <motion.div
                className="glass-card p-3 shrink-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                <p className="text-gold/70 text-xs mb-2">🔊 האזינו להקלטה:</p>
                <audio controls src={currentStation.taskAudioUrl} className="w-full" preload="metadata" />
              </motion.div>
            )}

            {/* Zoomable attachment image (e.g. code table) — not for puzzles */}
            {taskType !== "puzzle" && currentStation.taskImageUrl && (
              <motion.button
                className="shrink-0 rounded-xl overflow-hidden border border-[#c9a84c]/40 relative"
                onClick={() => setFullscreenImage(currentStation.taskImageUrl!)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                <img src={currentStation.taskImageUrl} alt="קובץ מצורף" className="w-full max-h-48 object-contain bg-black/40" />
                <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-gold px-2 py-1 rounded-md">
                  🔍 לחצו להגדלה
                </span>
              </motion.button>
            )}

            {/* ── Mission body by type ─────────────────────────────── */}
            <motion.div
              className="flex flex-col gap-3 shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
            >
              {taskType === "puzzle" && (
                currentStation.taskImageUrl ? (
                  <SlidingPuzzle
                    imageUrl={currentStation.taskImageUrl}
                    onSolved={approveMission}
                  />
                ) : (
                  <div className="glass-card p-4 text-center text-white/60 text-sm">
                    לא הוגדרה תמונת פאזל לתחנה הזו — פנו לצוות ההפקה
                  </div>
                )
              )}

              {taskType === "coordinates" && answerInput("הקלידו את התשובה / הקוד")}

              {taskType === "morse" && (
                <>
                  <button
                    className="btn-outline-gold flex items-center justify-center gap-2"
                    onClick={() => setShowLegend((v) => !v)}
                  >
                    <Radio size={16} />
                    {showLegend ? "הסתירו את מקרא המורס" : "הציגו את מקרא המורס"}
                  </button>
                  {showLegend && (
                    <div className="glass-card p-4" dir="rtl">
                      <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-center">
                        {HEBREW_LEGEND.map(([letter, code]) => (
                          <div key={letter} className="flex items-center justify-between gap-1 text-sm">
                            <span className="text-gold font-bold">{letter}</span>
                            <span className="text-white/80 font-mono tracking-wider" dir="ltr">{code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {answerInput("הקלידו את המילה שפוענחה")}
                </>
              )}

              {taskType === "photo" && (
                <>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                  {pendingPhoto ? (
                    <>
                      <div className="rounded-xl overflow-hidden border border-[#c9a84c]/30">
                        <img src={pendingPhoto.dataUrl} alt="תצוגה מקדימה" className="w-full max-h-56 object-contain bg-black/40" />
                      </div>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="הוסיפו משפט לתמונה (לא חובה)"
                        maxLength={200}
                        className="w-full rounded-xl bg-[oklch(0.1_0.03_250/0.8)] border border-[#c9a84c]/40 text-white text-base py-3 px-4 focus:outline-none focus:border-[#c9a84c]"
                      />
                      <button
                        className="btn-gold flex items-center justify-center gap-2"
                        onClick={handleUploadPending}
                        disabled={uploading}
                      >
                        <Camera size={16} />
                        {uploading ? "מעלה תמונה..." : "שלחו לאישור ההפקה"}
                      </button>
                      <button
                        className="btn-outline-gold flex items-center justify-center gap-2"
                        onClick={handleSendPhoto}
                        disabled={uploading}
                      >
                        צלמו תמונה אחרת
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-gold flex items-center justify-center gap-2"
                      onClick={handleSendPhoto}
                      disabled={uploading}
                    >
                      <Camera size={16} />
                      צלמו תמונה
                    </button>
                  )}
                </>
              )}
            </motion.div>

            {/* ── Common actions ───────────────────────────────────── */}
            <motion.div
              className="flex flex-col gap-3 mt-auto shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4 }}
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
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          <img src={fullscreenImage} alt="תצוגה מלאה" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-xl"
            onClick={() => setFullscreenImage(null)}
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hint Center modal */}
      {showHints && <HintCenter onClose={() => setShowHints(false)} />}
    </>
  );
}
