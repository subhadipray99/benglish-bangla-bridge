import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Loader2 } from "lucide-react";

const GrammarChecker = () => {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to check",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grammar-check", {
        body: { text: inputText },
      });

      if (error) throw error;

      setCorrectedText(data.correctedText);
      toast({
        title: "Grammar check complete",
        description: "Your text has been checked!",
      });
    } catch (error) {
      console.error("Grammar check error:", error);
      toast({
        title: "Grammar check failed",
        description: "There was an error checking your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  const handleCopy = async () => {
    if (!correctedText) return;

    try {
      await navigator.clipboard.writeText(correctedText);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Converter Cards */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Input Card */}
        <Card className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4 shadow-elegant transition-shadow hover:shadow-glow">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Your Text
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {inputText.length}
            </span>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your text here to check grammar...\nPress Enter to check"
            className="min-h-[150px] sm:min-h-[180px] md:min-h-[200px] text-sm sm:text-base resize-none border-border focus:ring-primary"
            disabled={isLoading}
          />
        </Card>

        {/* Output Card */}
        <Card className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4 shadow-elegant transition-shadow hover:shadow-glow">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Corrected Text
            </h2>
            {correctedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="hover:bg-muted h-8 px-2 sm:px-3"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            )}
          </div>
          <div className="min-h-[150px] sm:min-h-[180px] md:min-h-[200px] p-3 sm:p-4 bg-muted rounded-md text-sm sm:text-base whitespace-pre-wrap break-words">
            {correctedText || (
              <span className="text-muted-foreground text-xs sm:text-sm">
                Corrected text will appear here...
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Check Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleCheck}
          disabled={isLoading || !inputText.trim()}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant px-6 sm:px-8 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Check Grammar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GrammarChecker;
