import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/contexts/AdminContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Film, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminTeams() {
  const { token } = useAdmin();
  const utils = trpc.useUtils();
  const { data: teams, isLoading } = trpc.admin.getTeams.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const deleteMutation = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => {
      utils.admin.getTeams.invalidate();
      toast.success("הקבוצה נמחקה");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`למחוק את הקבוצה "${name}" וכל התמונות שלה לצמיתות?`)) return;
    deleteMutation.mutate({ token: token!, teamId: id });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <button className="text-[#c9a84c] hover:underline flex items-center gap-1 text-sm">
              <ArrowRight size={14} /> חזרה ללוח הבקרה
            </button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">קבוצות רשומות ({teams?.length ?? 0})</h1>
        {isLoading ? (
          <p className="text-gray-400">טוען...</p>
        ) : (
          <div className="space-y-3">
            {(teams ?? []).map((team) => (
              <div key={team.id} className="rounded-xl border border-[#c9a84c]/20 bg-[#0d1526] p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{team.teamName}</p>
                  <p className="text-sm text-gray-400">{team.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">תחנה {team.currentStationIndex + 1}</span>
                  {team.isFinished ? (
                    <Badge className="bg-green-600 text-white">סיים 🏆</Badge>
                  ) : (
                    <Badge variant="outline" className="border-[#c9a84c]/40 text-[#c9a84c]">בתהליך</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open("/slideshow", "_blank")}
                    className="text-[#c9a84c]/70 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 h-8 w-8 p-0"
                    title="מצגת כל המשתתפים"
                  >
                    <Film className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(team.id, team.teamName)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
                    title="מחק קבוצה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(teams ?? []).length === 0 && (
              <p className="text-gray-500 text-center py-8">אין קבוצות רשומות עדיין</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
