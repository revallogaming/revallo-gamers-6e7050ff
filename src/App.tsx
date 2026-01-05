import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Credits from "./pages/Credits";
import TournamentDetails from "./pages/TournamentDetails";
import Organizer from "./pages/Organizer";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import MyTournaments from "./pages/MyTournaments";
import PublicProfile from "./pages/PublicProfile";
import TermsOfUse from "./pages/TermsOfUse";
import Tournaments from "./pages/Tournaments";
import Community from "./pages/Community";
import MiniTournamentDetails from "./pages/MiniTournamentDetails";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/tournament/:id" element={<TournamentDetails />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/my-tournaments" element={<MyTournaments />} />
              <Route path="/organizer" element={<Organizer />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/comunidade" element={<Community />} />
              <Route path="/comunidade/:id" element={<MiniTournamentDetails />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
