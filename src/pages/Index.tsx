import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import LanguageConverter from "@/components/LanguageConverter";
import GrammarChecker from "@/components/GrammarChecker";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTool, setActiveTool] = useState<"converter" | "grammar">("converter");
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onSignOut={handleSignOut} />

      <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-8">
        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mb-6 md:mb-8">
          <Button
            onClick={() => setActiveTool("converter")}
            variant={activeTool === "converter" ? "default" : "outline"}
            className={
              activeTool === "converter"
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant font-medium text-xs sm:text-sm md:text-base"
                : "hover:bg-muted font-medium text-xs sm:text-sm md:text-base"
            }
          >
            Language Converter
          </Button>
          <Button
            onClick={() => setActiveTool("grammar")}
            variant={activeTool === "grammar" ? "default" : "outline"}
            className={
              activeTool === "grammar"
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant font-medium text-xs sm:text-sm md:text-base"
                : "hover:bg-muted font-medium text-xs sm:text-sm md:text-base"
            }
          >
            Grammar Checker
          </Button>
        </div>
      </div>

      <main>
        {activeTool === "converter" ? <LanguageConverter /> : <GrammarChecker />}
      </main>

      <footer className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
        <a
          href="https://x.com/shuvodip99"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          @shuvodip99
        </a>
      </footer>
    </div>
  );
};

export default Index;
