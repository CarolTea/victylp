import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VicTyLogo } from "@/components/victy-logo";
import { supabase } from "@/integrations/supabase/client";

export function DashboardHeader() {
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", search: { next: "dashboard" }, replace: true }); };
  return <header className="dashboard-header"><Link to="/" aria-label="VicTy home"><VicTyLogo /></Link><nav><Button asChild variant="ghost" size="sm"><Link to="/demo">New thesis</Link></Button><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut /> Sign out</Button></nav></header>;
}