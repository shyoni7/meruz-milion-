import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Image, LogOut, MapPin, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { token, displayName, logout } = useAdmin();
  const [, setLocation] = useLocation();

  const { data: teams } = trpc.admin.getTeams.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: stations } = trpc.admin.getStations.useQuery(
    { token: token! },
    { enabled: !!token }
  );
  const { data: submissions } = trpc.admin.getSubmissions.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const finishedTeams = teams?.filter((t) => t.isFinished).length ?? 0;
  const pendingSubmissions = submissions?.filter((s) => s.status === "pending").length ?? 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Teams Table */}
        <Card className="bg-[#0d1526] border-[#c9a84c]/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">קבוצות רשומות</CardTitle>
          </CardHeader>
          <CardContent>
            {!teams || teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">אין קבוצות רשומות עדיין</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#c9a84c]/20 text-gray-400">
                      <th className="text-right py-2 px-3">שם קבוצה</th>
                      <th className="text-right py-2 px-3">טלפון</th>
                      <th className="text-right py-2 px-3">תחנה נוכחית</th>
                      <th className="text-right py-2 px-3">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white font-medium">{team.teamName}</td>
                        <td className="py-2 px-3 text-gray-300">{team.phone}</td>
                        <td className="py-2 px-3 text-gray-300">תחנה {team.currentStationIndex + 1}</td>
                        <td className="py-2 px-3">
                          {team.isFinished ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">סיים</Badge>
                          ) : (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">פעיל</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

