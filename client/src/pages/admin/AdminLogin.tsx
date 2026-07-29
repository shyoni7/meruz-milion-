import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/contexts/AdminContext";
import { trpc } from "@/lib/trpc";
import { Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      login(data.token, data.displayName);
      toast.success("ברוכים הבאים לצוות ההפקה!");
    },
    onError: (err) => {
      toast.error("שם משתמש או סיסמה שגויים");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-md p-8 rounded-2xl border border-[#c9a84c]/30 bg-[#0d1526]/80 backdrop-blur shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/40 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">צוות הפקה</h1>
            <p className="text-sm text-gray-400 mt-1">המירוץ ל־70</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">שם משתמש</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white placeholder:text-gray-600 focus:border-[#c9a84c]"
              placeholder="admin"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0a0f1e] border-[#c9a84c]/30 text-white placeholder:text-gray-600 focus:border-[#c9a84c]"
              placeholder="••••••••"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-[#0a0f1e] font-bold h-12 text-base"
          >
            {loginMutation.isPending ? "מתחבר..." : "כניסה"}
          </Button>
        </form>
      </div>
    </div>
  );
}

