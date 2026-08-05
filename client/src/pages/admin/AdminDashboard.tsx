import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Film, Image, LogOut, MapPin, RefreshCw, Trophy, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { token, displayName, logout } = useAdmin();
  const [, setLocation] = useLocation();

  const { data: teams } = trpc.admin.getTeams.useQuery(
    { token: token! },
    { enabled: !!token, refetchInterval: 10_000 }
  );
  const { data: stations } = trpc.admin.getStations.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  // Poll every 10s so new photos show up and trigger a notification
  const { data: submissions } = trpc.admin.getSubmissions.useQuery(
    { token: token! },
    { enabled: !!token, refetchInterval: 10_000 }
  );

  const finishedTeams = teams?.filter((t) => t.isFinished).length ?? 0;
  const pendingSubmissions = submissions?.filter((s) => s.status === "pending").length ?? 0;

  // Notify when new photos arrive while the dashboard is open
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    if (submissions === undefined) return;
    const prev = prevPendingRef.current;
    if (prev !== null && pendingSubmissions > prev) {
      toast.info(`📸 תמונה חדשה ממתינה לאישור (${pendingSubmissions} בסך הכול)`);
    }
    prevPendingRef.current = pendingSubmissions;
  }, [pendingSubmissions, submissions]);

  // Notify when a team advances to the next station or finishes the race
  const prevTeamsRef = useRef<Record<number, { idx: number; finished: boolean }> | null>(null);
  useEffect(() => {
    if (!teams) return;
    const prev = prevTeamsRef.current;
    if (prev) {
      for (const t of teams) {
        const p = prev[t.id];
        if (!p) continue;
        if (t.isFinished && !p.finished) {
          toast.success(`🏆 קבוצת "${t.teamName}" סיימה את המירוץ!`);
        } else if (t.currentStationIndex > p.idx) {
          toast.info(`🏁 קבוצת "${t.teamName}" עברה לתחנה ${t.currentStationIndex + 1}`);
        }
      }
    }
    prevTeamsRef.current = Object.fromEntries(
      teams.map((t) => [t.id, { idx: t.currentStationIndex, finished: t.isFinished }])
    );
  }, [teams]);
  const totalStations = stations?.length ?? 4;

  // Sort teams for leaderboard: finished first, then by station index desc
  const leaderboard = [...(teams ?? [])].sort((a, b) => {
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    return b.currentStationIndex - a.currentStationIndex;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-[#c9a84c]/20 bg-[#0d1526]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#c9a84c] font-bold text-xl">המירוץ ל־70</span>
            <Badge variant="outline" className="border-[#c9a84c]/40 text-[#c9a84c] text-xs">צוות הפקה</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">שלום, {displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 ml-1" />
              יציאה
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0d1526] border-[#c9a84c]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-[#c9a84c]" />
              <div>
                <p className="text-2xl font-bold text-white">{teams?.length ?? 0}</p>
                <p className="text-xs text-gray-400">קבוצות רשומות</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1526] border-[#c9a84c]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{finishedTeams}</p>
                <p className="text-xs text-gray-400">סיימו המירוץ</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1526] border-[#c9a84c]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stations?.length ?? 0}</p>
                <p className="text-xs text-gray-400">תחנות פעילות</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1526] border-[#c9a84c]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{pendingSubmissions}</p>
                <p className="text-xs text-gray-400">תמונות ממתינות</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button
            onClick={() => setLocation("/admin/stations")}
            className="p-6 rounded-xl border border-[#c9a84c]/30 bg-[#0d1526]/80 hover:border-[#c9a84c] hover:bg-[#0d1526] transition-all text-right group"
          >
            <MapPin className="w-10 h-10 text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-1">ניהול תחנות</h3>
            <p className="text-sm text-gray-400">הוסף, ערוך ומחק תחנות, רמזים ומשימות</p>
          </button>
          <button
            onClick={() => setLocation("/admin/teams")}
            className="p-6 rounded-xl border border-[#c9a84c]/30 bg-[#0d1526]/80 hover:border-[#c9a84c] hover:bg-[#0d1526] transition-all text-right group"
          >
            <Users className="w-10 h-10 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-1">קבוצות</h3>
            <p className="text-sm text-gray-400">צפה בקבוצות רשומות ומעקב התקדמות</p>
          </button>
          <button
            onClick={() => setLocation("/admin/submissions")}
            className="p-6 rounded-xl border border-[#c9a84c]/30 bg-[#0d1526]/80 hover:border-[#c9a84c] hover:bg-[#0d1526] transition-all text-right group"
          >
            <Image className="w-10 h-10 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold text-white mb-1">אישור תמונות</h3>
          <p className="text-sm text-gray-400">
            בדוק ואשר תמונות שהועלו
            {pendingSubmissions > 0 && (
              <span className="mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-black text-xs font-bold">
                {pendingSubmissions}
                </span>
              )}
            </p>
          </button>
          <button
            onClick={() => window.open("/slideshow", "_blank")}
            className="p-6 rounded-xl border border-[#c9a84c]/50 bg-[#0d1526]/80 hover:border-[#c9a84c] hover:bg-[#c9a84c]/10 transition-all text-right group"
          >
            <Film className="w-10 h-10 text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-[#c9a84c] mb-1">הפעל מצגת כללית</h3>
            <p className="text-sm text-gray-400">מצגת כל המשתתפים לפי תחנות</p>
          </button>
        </div>

        {/* Teams Table */}
        {/* ─── LEADERBOARD ─────────────────────────────────────────────── */}
        <Card className="bg-[#0d1526] border-[#c9a84c]/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#c9a84c]" />
                לוח מובילים — זמן אמת
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} />
                מתעדכן כל 10 שניות
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-center py-10">אין קבוצות רשומות עדיין</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((team, idx) => {
                  const progress = team.isFinished
                    ? 100
                    : Math.round(((team.currentStationIndex) / totalStations) * 100);
                  const stationLabel = team.isFinished
                    ? "סיים את המירוץ! 🏆"
                    : `תחנה ${team.currentStationIndex + 1} מתוך ${totalStations}`;

                  const rankColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
                  const rankEmojis = ["🥇", "🥈", "🥉"];

                  return (
                    <div
                      key={team.id}
                      className="rounded-xl border border-white/10 bg-[#0a0f1e]/60 p-4 hover:border-[#c9a84c]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-8 text-center shrink-0">
                          {idx < 3 ? (
                            <span className="text-xl">{rankEmojis[idx]}</span>
                          ) : (
                            <span className={`text-sm font-bold text-gray-500`}>#{idx + 1}</span>
                          )}
                        </div>

                        {/* Team info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white truncate">{team.teamName}</span>
                            <span className="text-xs text-gray-400 shrink-0 mr-2">{stationLabel}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${progress}%`,
                                background: team.isFinished
                                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                                  : "linear-gradient(90deg, #f5d78e, #c9a84c)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {team.isFinished ? (
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">סיים</Badge>
                          ) : (
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">פעיל</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
