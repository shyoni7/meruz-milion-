/**
 * RegisterScreen — Team registration (name + phone)
 * Shown before the game starts. Saves team to DB and stores teamId in localStorage.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Phone, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onRegistered: (teamId: number, teamName: string) => void;
}

export default function RegisterScreen({ onRegistered }: Props) {
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState("");

  const registerMutation = trpc.game.registerTeamWithId.useMutation({
    onSuccess: (data) => {
      toast.success("הרישום הצליח! בהצלחה במירוץ 🏁");
      onRegistered(data.teamId, teamName);
    },
    onError: (err) => {
      toast.error("שגיאה ברישום, נסו שוב");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !phone.trim()) return;
    registerMutation.mutate({ teamName: teamName.trim(), phone: phone.trim() });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #0d1a30 60%, #0a0f1e 100%)" }}
      dir="rtl"
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#c9a84c]/40" />
          <div className="absolute inset-2 rounded-full border border-[#c9a84c]/20" />
          <span
            className="relative text-4xl font-black"
            style={{
              background: "linear-gradient(135deg, #f5d78e 0%, #c9a84c 50%, #a07830 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            70
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">המירוץ ל־70</h1>
        <p className="text-[#c9a84c] text-sm mt-1 tracking-widest uppercase">רישום קבוצה</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#0d1526]/80 backdrop-blur p-6 space-y-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c9a84c]" />
                שם הקבוצה
              </label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="למשל: משפחת כהן"
                className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white placeholder:text-gray-600 focus:border-[#c9a84c] h-12 text-base"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#c9a84c]" />
                מספר טלפון
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-0000000"
                type="tel"
                className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white placeholder:text-gray-600 focus:border-[#c9a84c] h-12 text-base"
                required
                minLength={9}
                maxLength={20}
              />
            </div>
            <Button
              type="submit"
              disabled={registerMutation.isPending || !teamName.trim() || !phone.trim()}
              className="w-full h-14 text-base font-bold rounded-xl mt-2"
              style={{
                background: "linear-gradient(135deg, #f5d78e 0%, #c9a84c 50%, #a07830 100%)",
                color: "#0a0f1e",
              }}
            >
              {registerMutation.isPending ? "רושם..." : "בואו נתחיל! 🏁"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

