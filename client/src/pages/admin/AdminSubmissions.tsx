import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminSubmissions() {
  const { token } = useAdmin();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Poll every 10s so new photos appear without a manual refresh
  const { data: submissions, isLoading } = trpc.admin.getSubmissions.useQuery(
    { token: token! },
    { enabled: !!token, refetchInterval: 10_000 }
  );

  const reviewMutation = trpc.admin.reviewSubmission.useMutation({
    onSuccess: () => {
      utils.admin.getSubmissions.invalidate();
      toast.success("עודכן בהצלחה");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteSubmission.useMutation({
    onSuccess: () => {
      utils.admin.getSubmissions.invalidate();
      toast.success("התמונה נמחקה");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (id: number) => {
    if (!window.confirm("למחוק את התמונה לצמיתות?")) return;
    deleteMutation.mutate({ token: token!, submissionId: id });
  };

  const pending = submissions?.filter((s) => s.status === "pending") ?? [];
  const reviewed = submissions?.filter((s) => s.status !== "pending") ?? [];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" dir="rtl">
      <div className="border-b border-[#c9a84c]/20 bg-[#0d1526]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="text-gray-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="text-[#c9a84c] font-bold text-xl">אישור תמונות</span>
          {pending.length > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {pending.length} ממתינות
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isLoading && <p className="text-gray-400 text-center py-12">טוען...</p>}

        {pending.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-yellow-400 mb-4">ממתינות לאישור ({pending.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((sub) => (
                <Card key={sub.id} className="bg-[#0d1526] border-yellow-500/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>קבוצה #{sub.teamId}</span>
                      <span>תחנה #{sub.stationId}</span>
                    </div>
                    <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer" title="פתח בגודל מלא">
                      <img
                        src={sub.imageUrl}
                        alt="submission"
                        className="w-full max-h-72 object-contain rounded-lg border border-white/10 bg-black/40"
                      />
                    </a>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => reviewMutation.mutate({ token: token!, submissionId: sub.id, status: "approved" })}
                        disabled={reviewMutation.isPending}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                        variant="ghost"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        אשר
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => reviewMutation.mutate({ token: token!, submissionId: sub.id, status: "rejected" })}
                        disabled={reviewMutation.isPending}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                        variant="ghost"
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        דחה
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(sub.id)}
                        disabled={deleteMutation.isPending}
                        className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/40"
                        variant="ghost"
                        title="מחק תמונה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {reviewed.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-400 mb-4">נסקרו ({reviewed.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviewed.map((sub) => (
                <Card key={sub.id} className={`bg-[#0d1526] ${sub.status === "approved" ? "border-green-500/20" : "border-red-500/20"}`}>
                  <CardContent className="p-3 space-y-2">
                    <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer" title="פתח בגודל מלא">
                      <img src={sub.imageUrl} alt="submission" className="w-full max-h-48 object-contain rounded bg-black/40" />
                    </a>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">קבוצה #{sub.teamId} | תחנה #{sub.stationId}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={sub.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {sub.status === "approved" ? "אושר" : "נדחה"}
                        </Badge>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-red-400/60 hover:text-red-400 transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && submissions?.length === 0 && (
          <p className="text-gray-500 text-center py-16">אין תמונות שהועלו עדיין</p>
        )}
      </div>
    </div>
  );
}
