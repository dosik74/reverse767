import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Gamepad, Music, Book, Tv } from "lucide-react";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Movies />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/series" element={<PlaceholderPage title="Series & Anime" icon={Tv} />} />
            <Route path="/games" element={<PlaceholderPage title="Games" icon={Gamepad} />} />
            <Route path="/music" element={<PlaceholderPage title="Music" icon={Music} />} />
            <Route path="/books" element={<PlaceholderPage title="Books" icon={Book} />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
