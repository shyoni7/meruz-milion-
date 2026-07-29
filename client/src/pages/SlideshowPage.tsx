import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Loader2, Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";

interface Slide {
  imageUrl: string;
  stationTitle: string;
  caption: string;
  stationIndex: number;
}

export default function SlideshowPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = parseInt(params.teamId ?? "0", 10);
  const [, setLocation] = useLocation();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionsReady, setCaptionsReady] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading } = trpc.slideshow.getSlideshowData.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const captionMutation = trpc.slideshow.generateCaptions.useMutation({
    onSuccess: (res) => {
      setCaptions(res.captions);
      setCaptionsReady(true);
    },
    onError: () => setCaptionsReady(true),
  });

  // Build slides once data is ready
  useEffect(() => {
    if (!data || data.submissions.length === 0) return;

    const stationTitles = data.submissions.map(
      (s) => s.station?.title ?? `תחנה ${s.stationId}`
    );

    // Trigger LLM caption generation
    captionMutation.mutate({
      teamId,
      stationTitles,
      teamName: data.team.teamName,
    });
  }, [data]);

  // Build final slides once captions arrive
  useEffect(() => {
    if (!data || !captionsReady) return;

    const built: Slide[] = data.submissions.map((sub, i) => ({
      imageUrl: sub.imageUrl,
      stationTitle: sub.station?.title ?? `תחנה ${sub.stationId}`,
      caption: captions[i] ?? `תחנה ${i + 1} — רגע בלתי נשכח! 🌟`,
      stationIndex: i + 1,
    }));

    setSlides(built);
    setIsPlaying(true); // auto-start
  }, [captionsReady, data]);

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying || slides.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, slides.length]);

  const goTo = (idx: number) => {
    setCurrentIndex((idx + slides.length) % slides.length);
  };

  const current = slides[currentIndex];

  if (isLoading || (data && !captionsReady && data.submissions.length > 0)) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4" dir="rtl">
        <div className="text-[#c9a84c] text-6xl font-bold">70</div>
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
        <p className="text-white/70 text-lg">מכין את המצגת שלכם...</p>
        <p className="text-white/40 text-sm">הבינה המלאכותית כותבת הערות שנונות 🎬</p>
      </div>
    );
  }

  if (!data || data.submissions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4" dir="rtl">
        <div className="text-[#c9a84c] text-6xl font-bold">70</div>
        <p className="text-white text-xl">אין תמונות להצגה עדיין</p>
        <p className="text-white/50 text-sm">העלו תמונות במהלך המשחק כדי ליצור מצגת</p>
        <button
          onClick={() => setLocation("/")}
          className="mt-4 px-6 py-2 rounded-full border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
        >
          חזרה למשחק
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a84c]/20">
        <div className="flex items-center gap-2">
          <span className="text-[#c9a84c] font-bold text-lg">המירוץ ל-70</span>
          <span className="text-white/40 text-sm">|</span>
          <span className="text-white/70 text-sm">{data.team.teamName}</span>
        </div>
        <span className="text-white/40 text-sm">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Main slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Photo */}
              <div className="flex-1 relative">
                <img
                  src={current.imageUrl}
                  alt={current.stationTitle}
                  className="w-full h-full object-cover"
                />
                {/* Vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent" />
                {/* Station badge */}
                <div className="absolute top-4 right-4 bg-[#c9a84c]/90 text-[#0a0f1e] font-bold text-sm px-3 py-1 rounded-full">
                  תחנה {current.stationIndex}
                </div>
              </div>

              {/* Caption area */}
              <div className="px-6 py-5 bg-[#0a0f1e]">
                <p className="text-[#c9a84c] font-bold text-lg mb-1">{current.stationTitle}</p>
                <p className="text-white/80 text-base leading-relaxed">{current.caption}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="border-t border-[#c9a84c]/20 px-4 py-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); setIsPlaying(false); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 bg-[#c9a84c]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { goTo(currentIndex - 1); setIsPlaying(false); }}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="w-14 h-14 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0a0f1e] hover:bg-[#d4b55a] transition-colors shadow-lg shadow-[#c9a84c]/30"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 mr-0.5" />}
          </button>

          <button
            onClick={() => { goTo(currentIndex + 1); setIsPlaying(false); }}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Share hint */}
        <p className="text-center text-white/30 text-xs mt-3">
          📸 {slides.length} תמונות מהמסע שלכם
        </p>
      </div>
    </div>
  );
}
