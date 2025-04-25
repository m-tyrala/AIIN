import type { APIRoute } from "astro";
import type { NpcProfileDTO } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // In a real implementation, this would fetch from a database
    // For demonstration, we'll return mock data
    const mockProfiles: NpcProfileDTO[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Eldric the Wise",
        appearance: "Starszy mężczyzna z długą siwą brodą, ubrany w niebieskie szaty.",
        profession: "Mag",
        relationship_to_party: "Mentor głównego bohatera",
        scene_description: "Spotykasz go w bibliotece studiującego stare księgi.",
        special_traits: "Posiada niezwykłą pamięć i umiejętność przewidywania przyszłości.",
        complexity_level: "szczegółowy",
        is_public: true,
        created_at: "2023-01-15T10:30:00Z",
        updated_at: "2023-01-15T10:30:00Z",
        user_id: "user-1",
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Brenna Kowalska",
        appearance: "Kobieta w średnim wieku z krótko przyciętymi rudymi włosami.",
        profession: "Kowal",
        relationship_to_party: "Neutralna, oferuje usługi naprawy ekwipunku",
        scene_description: "Pracuje w swojej kuźni w centrum wioski.",
        special_traits: "Najlepszy kowal w okolicy, specjalizuje się w broni siecznej.",
        complexity_level: "zwykły",
        is_public: true,
        created_at: "2023-02-20T14:15:00Z",
        updated_at: "2023-02-20T14:15:00Z",
        user_id: "user-1",
      },
      {
        id: "9d9c7e44-b08c-4a17-92f6-d442979aa75f",
        name: "Tomas Przewoźnik",
        appearance: "Niski mężczyzna z bujną czupryną.",
        profession: "Kupiec",
        relationship_to_party: "Neutralny",
        scene_description: "Podróżuje między wioskami ze swoim wozem pełnym towarów.",
        special_traits: "Zna wiele plotek i historii z różnych regionów.",
        complexity_level: "uproszczony",
        is_public: false,
        created_at: "2023-03-10T09:45:00Z",
        updated_at: "2023-03-10T09:45:00Z",
        user_id: "user-1",
      },
    ];

    // Add a small delay to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    return new Response(JSON.stringify(mockProfiles), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching NPC profiles:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Wystąpił błąd podczas pobierania profili",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}; 