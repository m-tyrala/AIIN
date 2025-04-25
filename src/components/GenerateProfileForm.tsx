import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { ComplexityLevel, GenerateNpcProfileCommand } from "../types";
import { toast } from "sonner";
import { navigate } from "astro:transitions/client";
import LoaderOverlay from "./LoaderOverlay";
import MultiSelect from "./MultiSelect";

// Define the GeneratedProfileViewModel type as described in the implementation plan
interface GeneratedProfileViewModel {
  name: string;
  appearance: string;
  profession: string;
  relationship_to_party: string;
  scene_description: string;
  special_traits: string;
  complexity_level: ComplexityLevel;
  existing_profile_ids?: string[];
  is_public?: boolean;
}

// Custom hook for generating NPC profile
const useGenerateNpcProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProfile = async (command: GenerateNpcProfileCommand): Promise<GeneratedProfileViewModel | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/npc_profiles/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Za dużo żądań. Spróbuj ponownie później.");
        } else if (response.status === 401) {
          throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Błędne dane wejściowe.");
        } else {
          throw new Error("Wystąpił błąd podczas generowania profilu.");
        }
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd sieciowy";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        description: "Sprawdź połączenie internetowe i spróbuj ponownie"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateProfile, isLoading, error };
};

// Custom hook for getting existing NPC profiles
const useExistingNpcProfiles = () => {
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/npc_profiles");
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
        } else {
          throw new Error("Nie udało się pobrać istniejących profili");
        }
      }
      
      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd sieciowy";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  return { profiles, isLoading, error, refetch: fetchProfiles };
};

const GenerateProfileForm = () => {
  const { generateProfile, isLoading: isGenerating } = useGenerateNpcProfile();
  const { profiles, isLoading: isLoadingProfiles, refetch: refetchProfiles } = useExistingNpcProfiles();

  // Form state
  const [initialPrompt, setInitialPrompt] = useState("");
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>("zwykły");
  const [existingProfileIds, setExistingProfileIds] = useState<string[]>([]);
  
  // Form validation state
  const [errors, setErrors] = useState<{
    initialPrompt?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      initialPrompt?: string;
    } = {};

    if (!initialPrompt.trim()) {
      newErrors.initialPrompt = "Opis postaci jest wymagany";
    } else if (initialPrompt.length > 1000) {
      newErrors.initialPrompt = "Opis postaci nie może przekraczać 1000 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Formularz zawiera błędy", {
        duration: 3000,
        description: "Popraw błędy przed kontynuowaniem"
      });
      return;
    }

    const command: GenerateNpcProfileCommand = {
      initial_prompt: initialPrompt,
      complexity_level: complexityLevel as ComplexityLevel,
    };

    if (existingProfileIds.length > 0) {
      command.existing_profile_ids = existingProfileIds;
    }

    try {
      toast.promise(generateProfile(command), {
        loading: 'Generowanie profilu...',
        success: (result) => {
          if (result) {
            navigate(`/new`);
            return 'Profil wygenerowany pomyślnie!';
          }
          return 'Błąd podczas generowania profilu';
        },
        error: (error) => {
          if (error instanceof Error && error.message.includes("Za dużo żądań")) {
            // For rate limiting errors, provide a more specific message and retry button
            setTimeout(() => {
              toast("Możesz spróbować ponownie", {
                action: {
                  label: "Ponów",
                  onClick: () => handleSubmit(e)
                }
              });
            }, 1000);
            return "Za dużo żądań. Poczekaj chwilę przed ponowną próbą.";
          }
          return "Wystąpił błąd podczas generowania profilu";
        }
      });
    } catch (error) {
      // This catch block is mostly for synchronous errors before the promise begins
      toast.error("Nieoczekiwany błąd podczas generowania profilu");
    }
  };

  const handleReturn = () => {
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <LoaderOverlay isVisible={isGenerating} message="Generowanie profilu NPC..." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="initialPrompt" className="block text-sm font-medium">
            Opis postaci
          </label>
          <Textarea
            id="initialPrompt"
            value={initialPrompt}
            onChange={(e) => setInitialPrompt(e.target.value)}
            placeholder="Opisz swoją postać NPC (max 1000 znaków)"
            className={errors.initialPrompt ? "border-red-500" : ""}
          />
          {errors.initialPrompt && (
            <p className="text-sm text-red-500">{errors.initialPrompt}</p>
          )}
          <p className="text-sm text-gray-500">
            {initialPrompt.length}/1000 znaków
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="complexityLevel" className="block text-sm font-medium">
            Poziom skomplikowania
          </label>
          <Select
            value={complexityLevel}
            onValueChange={(value) => setComplexityLevel(value as ComplexityLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz poziom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uproszczony">Uproszczony</SelectItem>
              <SelectItem value="zwykły">Zwykły</SelectItem>
              <SelectItem value="szczegółowy">Szczegółowy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <MultiSelect
          label="Wybierz istniejące profile (opcjonalnie)"
          options={profiles.map(profile => ({ id: profile.id, name: profile.name }))}
          selectedValues={existingProfileIds}
          onChange={setExistingProfileIds}
          isLoading={isLoadingProfiles}
        />

        <div className="flex space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={handleReturn}>
            Powrót
          </Button>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? "Generowanie..." : "Generuj"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GenerateProfileForm; 