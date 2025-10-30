import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ArrowRight, Loader2 } from "lucide-react";

type LanguagePair = "benglish-bangla" | "hinglish-hindi" | "benglish-english" | "hinglish-english";

const LanguageConverter = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePair>("benglish-bangla");
  const { toast } = useToast();

  const languageOptions = [
    { value: "benglish-bangla" as LanguagePair, label: "Benglish → বাংলা" },
    { value: "hinglish-hindi" as LanguagePair, label: "Hinglish → हिंदी" },
    { value: "benglish-english" as LanguagePair, label: "Benglish → English" },
    { value: "hinglish-english" as LanguagePair, label: "Hinglish → English" },
  ];

  const handleConvert = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to convert",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("convert-script", {
        body: { text: inputText, languagePair: selectedLanguage },
      });

      if (error) throw error;

      setOutputText(data.convertedText);
      toast({
        title: "Conversion successful",
        description: "Your text has been converted!",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: "There was an error converting your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConvert();
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    
    try {
      await navigator.clipboard.writeText(outputText);
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
      {/* Language Selector */}
      <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
        {languageOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => setSelectedLanguage(option.value)}
            variant={selectedLanguage === option.value ? "default" : "outline"}
            size="sm"
            className={
              selectedLanguage === option.value
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant font-medium text-xs sm:text-sm md:text-base"
                : "hover:bg-muted font-medium text-xs sm:text-sm md:text-base"
            }
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Converter Cards */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Input Card */}
        <Card className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4 shadow-elegant transition-shadow hover:shadow-glow">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              {selectedLanguage.startsWith("benglish") ? "Benglish" : "Hinglish"}
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {inputText.length}
            </span>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLanguage.startsWith("benglish")
                ? "Type in Benglish... (e.g., Ami tomake bhalobashi)\nPress Enter to convert"
                : "Type in Hinglish... (e.g., Main tumse pyar karta hoon)\nPress Enter to convert"
            }
            className="min-h-[150px] sm:min-h-[180px] md:min-h-[200px] text-sm sm:text-base resize-none border-border focus:ring-primary"
            disabled={isLoading}
          />
        </Card>

        {/* Output Card */}
        <Card className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4 shadow-elegant transition-shadow hover:shadow-glow">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              {selectedLanguage === "benglish-bangla"
                ? "বাংলা"
                : selectedLanguage === "hinglish-hindi"
                ? "हिंदी"
                : "English"}
            </h2>
            {outputText && (
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
            {outputText || (
              <span className="text-muted-foreground text-xs sm:text-sm">
                Converted text will appear here...
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleConvert}
          disabled={isLoading || !inputText.trim()}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant px-6 sm:px-8 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              Convert
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LanguageConverter;
