import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import GamePage from "./pages/GamePage";
import { GameProvider } from "./contexts/GameContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStations from "./pages/admin/AdminStations";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminTeams from "./pages/admin/AdminTeams";
import SlideshowPage from "./pages/SlideshowPage";

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { isLoggedIn } = useAdmin();
  if (!isLoggedIn) return <AdminLogin />;
  return <Component />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={GamePage} />
      <Route path={"/admin"} component={() => <AdminGuard component={AdminDashboard} />} />
      <Route path={"/admin/stations"} component={() => <AdminGuard component={AdminStations} />} />
      <Route path={"/admin/submissions"} component={() => <AdminGuard component={AdminSubmissions} />} />
      <Route path={"/admin/teams"} component={() => <AdminGuard component={AdminTeams} />} />
      <Route path={"/slideshow/:teamId"} component={SlideshowPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminProvider>
        <GameProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </GameProvider>
        </AdminProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
