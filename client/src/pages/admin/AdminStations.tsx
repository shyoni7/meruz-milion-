import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/contexts/AdminContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Edit, MapPin, Plus, Trash2, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { toMorse } from "@/lib/morse";

type TaskType = "photo" | "puzzle" | "coordinates" | "morse";

type StationForm = {
  orderIndex: number;
  title: string;
  subtitle: string;
  clueText: string;
  taskTitle: string;
  taskDescription: string;
  taskType: TaskType;
  taskAnswer: string;
  taskImageUrl: string;
  taskAudioUrl: string;
  skipScratch: boolean;
  hint1: string;
  hint2: string;
  hint3: string;
  wazeUrl: string;
  funFact: string;
  isActive: boolean;
};

const emptyForm: StationForm = {
  orderIndex: 1,
  title: "",
  subtitle: "",
  clueText: "",
  taskTitle: "",
  taskDescription: "",
  taskType: "photo",
  taskAnswer: "",
  taskImageUrl: "",
  taskAudioUrl: "",
  skipScratch: false,
  hint1: "",
  hint2: "",
  hint3: "",
  wazeUrl: "",
  funFact: "",
  isActive: true,
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  photo: "📸 צילום תמונה (אישור הפקה)",
  puzzle: "🧩 פאזל הזזה (מתקדמים אוטומטית)",
  coordinates: "📍 קואורדינטות / קוד (מתקדמים אוטומטית)",
  morse: "📡 קוד מורס + QR (מתקדמים אוטומטית)",
};

export default function AdminStations() {
  const { token } = useAdmin();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StationForm>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: stations, isLoading } = trpc.admin.getStations.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const createMutation = trpc.admin.createStation.useMutation({
    onSuccess: () => {
      toast.success("תחנה נוצרה בהצלחה");
      utils.admin.getStations.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateStation.useMutation({
    onSuccess: () => {
      toast.success("תחנה עודכנה בהצלחה");
      utils.admin.getStations.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteStation.useMutation({
    onSuccess: () => {
      toast.success("תחנה נמחקה");
      utils.admin.getStations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImageMutation = trpc.admin.uploadImage.useMutation();

  // Generate a printable QR containing the morse code of the answer
  useEffect(() => {
    if (form.taskType === "morse" && form.taskAnswer.trim()) {
      QRCode.toDataURL(toMorse(form.taskAnswer), { width: 400, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [form.taskType, form.taskAnswer]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("קובץ השמע גדול מדי — עד 3MB");
      return;
    }
    setUploadingAudio(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const { url } = await uploadImageMutation.mutateAsync({
        token: token!,
        imageBase64: dataUrl.split(",")[1],
        mimeType: file.type || "audio/mpeg",
      });
      setForm((p) => ({ ...p, taskAudioUrl: url }));
      toast.success("קובץ השמע הועלה");
    } catch {
      toast.error("שגיאה בהעלאת השמע");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handlePuzzleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      // Downscale to keep the upload small
      const dataUrl: string = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no canvas"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("bad image"));
        img.src = url;
      });
      const { url } = await uploadImageMutation.mutateAsync({
        token: token!,
        imageBase64: dataUrl.split(",")[1],
        mimeType: "image/jpeg",
      });
      setForm((p) => ({ ...p, taskImageUrl: url }));
      toast.success("התמונה הועלתה");
    } catch {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, orderIndex: (stations?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (s: NonNullable<typeof stations>[0]) => {
    setEditingId(s.id);
    setForm({
      orderIndex: s.orderIndex,
      title: s.title,
      subtitle: s.subtitle ?? "",
      clueText: s.clueText,
      taskTitle: s.taskTitle,
      taskDescription: s.taskDescription,
      taskType: ((s as { taskType?: string }).taskType as TaskType) ?? "photo",
      taskAnswer: (s as { taskAnswer?: string | null }).taskAnswer ?? "",
      taskImageUrl: s.taskImageUrl ?? "",
      taskAudioUrl: (s as { taskAudioUrl?: string | null }).taskAudioUrl ?? "",
      skipScratch: (s as { skipScratch?: boolean }).skipScratch ?? false,
      hint1: s.hint1 ?? "",
      hint2: s.hint2 ?? "",
      hint3: s.hint3 ?? "",
      wazeUrl: s.wazeUrl ?? "",
      funFact: s.funFact ?? "",
      isActive: s.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Friendly validation before hitting the server
    const missing: string[] = [];
    if (!form.title.trim()) missing.push("כותרת תחנה");
    if (!form.clueText.trim()) missing.push("טקסט הרמז");
    if (!form.taskTitle.trim()) missing.push("כותרת משימה");
    if (!form.taskDescription.trim()) missing.push("תיאור המשימה");
    if (form.taskType === "puzzle" && !form.taskImageUrl.trim()) missing.push("תמונת פאזל");
    if ((form.taskType === "coordinates" || form.taskType === "morse") && !form.taskAnswer.trim())
      missing.push("התשובה הנכונה");
    if (missing.length > 0) {
      toast.error(`חסרים שדות חובה: ${missing.join(", ")}`);
      return;
    }
    // The number input stores its value as a string — the server expects a number
    const payload = { ...form, orderIndex: Number(form.orderIndex) || 1 };
    if (editingId) {
      updateMutation.mutate({ token: token!, id: editingId, ...payload });
    } else {
      createMutation.mutate({ token: token!, ...payload });
    }
  };

  const f = (field: keyof StationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" dir="rtl">
      <div className="border-b border-[#c9a84c]/20 bg-[#0d1526]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="text-gray-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="text-[#c9a84c] font-bold text-xl">ניהול תחנות</span>
          <div className="flex-1" />
          <Button onClick={openCreate} className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0a0f1e] font-bold">
            <Plus className="w-4 h-4 ml-1" />
            תחנה חדשה
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {isLoading && <p className="text-gray-400 text-center py-12">טוען...</p>}
        {!isLoading && (!stations || stations.length === 0) && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">אין תחנות עדיין. לחץ "תחנה חדשה" כדי להתחיל.</p>
          </div>
        )}
        {stations?.map((s) => (
          <Card key={s.id} className="bg-[#0d1526] border-[#c9a84c]/20 hover:border-[#c9a84c]/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] font-bold shrink-0">
                {s.orderIndex}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white truncate">{s.title}</h3>
                  {!s.isActive && <Badge variant="outline" className="border-red-500/40 text-red-400 text-xs">לא פעיל</Badge>}
                </div>
                <p className="text-sm text-gray-400 truncate mt-0.5">{s.clueText}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="text-gray-400 hover:text-white hover:bg-white/10">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`למחוק את תחנה "${s.title}"?`)) deleteMutation.mutate({ token: token!, id: s.id });
                  }}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0d1526] border-[#c9a84c]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[#c9a84c]">{editingId ? "עריכת תחנה" : "תחנה חדשה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-gray-300">מספר סדר</Label>
                <Input type="number" value={form.orderIndex} onChange={f("orderIndex")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">כותרת תחנה *</Label>
                <Input value={form.title} onChange={f("title")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" placeholder="למשל: נתניה" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">כותרת משנה</Label>
              <Input value={form.subtitle} onChange={f("subtitle")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" placeholder="תיאור קצר" />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">טקסט הרמז *</Label>
              <Textarea value={form.clueText} onChange={f("clueText")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white min-h-[80px]" placeholder="הרמז שיוצג לקבוצה..." />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">כותרת משימה *</Label>
              <Input value={form.taskTitle} onChange={f("taskTitle")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" placeholder="שם המשימה" />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">תיאור המשימה *</Label>
              <Textarea value={form.taskDescription} onChange={f("taskDescription")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white min-h-[80px]" placeholder="הסבר מה צריך לעשות..." />
            </div>

            {/* ── Mission type ─────────────────────────────────── */}
            <div className="space-y-1">
              <Label className="text-gray-300">סוג משימה</Label>
              <select
                value={form.taskType}
                onChange={(e) => setForm((p) => ({ ...p, taskType: e.target.value as TaskType }))}
                className="w-full h-10 rounded-md bg-[#0a0f1e] border border-[#c9a84c]/30 text-white px-3 text-sm"
              >
                {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
                  <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {(
              <div className="space-y-2">
                <Label className="text-gray-300">
                  {form.taskType === "puzzle"
                    ? "תמונת פאזל * (תיחתך ל-9 אריחים)"
                    : "תמונה מצורפת למשימה (לא חובה — למשל טבלת קודים, תוצג עם אפשרות הגדלה)"}
                </Label>
                {form.taskImageUrl && (
                  <img src={form.taskImageUrl} alt="תמונת פאזל" className="w-32 h-32 object-cover rounded-lg border border-[#c9a84c]/30" />
                )}
                <label className="flex items-center gap-2 cursor-pointer text-[#c9a84c] hover:text-[#f0d080] text-sm w-fit">
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? "מעלה תמונה..." : form.taskImageUrl ? "החלפת תמונה" : "העלאת תמונה"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePuzzleImage} disabled={uploadingImage} />
                </label>
              </div>
            )}

            {(form.taskType === "coordinates" || form.taskType === "morse") && (
              <div className="space-y-1">
                <Label className="text-gray-300">התשובה הנכונה *</Label>
                <Input
                  value={form.taskAnswer}
                  onChange={f("taskAnswer")}
                  className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white"
                  placeholder={form.taskType === "morse" ? "המילה שהקבוצה צריכה לפענח" : "למשל: 32.284 34.858 או מילת קוד"}
                />
                <p className="text-xs text-gray-500">הבדיקה מתעלמת מרווחים, פסיקים וסימנים — רק אותיות ומספרים נספרים</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">קובץ שמע למשימה (לא חובה, עד 3MB)</Label>
              {form.taskAudioUrl && (
                <div className="flex items-center gap-2">
                  <audio controls src={form.taskAudioUrl} className="h-9 flex-1" preload="metadata" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, taskAudioUrl: "" }))}
                    className="text-red-400 text-xs underline shrink-0"
                  >
                    הסרה
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-[#c9a84c] hover:text-[#f0d080] text-sm w-fit">
                <Upload className="w-4 h-4" />
                {uploadingAudio ? "מעלה שמע..." : form.taskAudioUrl ? "החלפת קובץ שמע" : "העלאת קובץ שמע"}
                <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
              </label>
            </div>

            {form.taskType === "morse" && qrDataUrl && (
              <div className="space-y-2 text-center border border-[#c9a84c]/20 rounded-lg p-3">
                <Label className="text-gray-300">קוד ה-QR להדפסה — הסתירו אותו בתחנה</Label>
                <img src={qrDataUrl} alt="QR" className="w-40 h-40 mx-auto bg-white p-2 rounded-lg" />
                <p className="text-xs text-gray-400 font-mono break-all" dir="ltr">{toMorse(form.taskAnswer)}</p>
                <a
                  href={qrDataUrl}
                  download={`morse-qr-${form.title || "station"}.png`}
                  className="text-[#c9a84c] underline text-sm"
                >
                  הורדת ה-QR כתמונה
                </a>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-gray-300">רמז 1</Label>
                <Input value={form.hint1} onChange={f("hint1")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">רמז 2</Label>
                <Input value={form.hint2} onChange={f("hint2")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">רמז 3</Label>
                <Input value={form.hint3} onChange={f("hint3")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">קישור Waze</Label>
              <Input value={form.wazeUrl} onChange={f("wazeUrl")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white" placeholder="https://waze.com/ul?..." />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">עובדה מעניינת</Label>
              <Textarea value={form.funFact} onChange={f("funFact")} className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white min-h-[60px]" placeholder="עובדה על המקום..." />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="skipScratch"
                checked={form.skipScratch}
                onChange={(e) => setForm((p) => ({ ...p, skipScratch: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="skipScratch" className="text-gray-300">ללא כרטיס גירוד (נכנסים ישר לרמז)</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="text-gray-300">תחנה פעילה</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0a0f1e] font-bold"
              >
                {createMutation.isPending || updateMutation.isPending ? "שומר..." : "שמור"}
              </Button>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-white">
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

