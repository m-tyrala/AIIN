import type { APIRoute } from 'astro';
import { AIService } from '../../../lib/services/aiService';
import { LogService } from '../../../lib/services/logService';
import { generateNpcProfileSchema } from '../../../lib/schemas/npc-profile.schema';
import { ZodError } from 'zod';
import type { ComplexityLevel, NpcProfileDTO } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  
  try {
    // Get the supabase client from context
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Unauthorized: not connected to supabase' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // const { data:{ user }, error } = await supabase.auth.getUser(token);
    
    // if (error || !user) {
    //     console.log(error);
    //     console.log(user);
    //           return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = generateNpcProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Błędne dane wejściowe",
          errors: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize services
    const aiService = new AIService();
    const logService = new LogService(supabase);

    // Generate NPC profile
    const generatedProfile = await aiService.generateNpcProfile(validationResult.data);

    // Log the operation
    const duration = Date.now() - startTime;
    await logService.logOperation(
      'GENERATE',
      null, // No profile ID yet as this is just a preview
      'dummy-user-id',
      duration
    );

    return new Response(JSON.stringify(generatedProfile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate endpoint:', error);

    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation error', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to generate a mock profile based on the complexity level
function generateMockProfile(
  initialPrompt: string,
  complexityLevel: ComplexityLevel
): NpcProfileDTO {
  const professionOptions = ["Kupiec", "Strażnik", "Mag", "Rolnik", "Kowal", "Łowca", "Bard"];
  const randomProfession = professionOptions[Math.floor(Math.random() * professionOptions.length)];

  const now = new Date().toISOString();
  const mockId = crypto.randomUUID();

  // Base profile with required fields
  const profile: NpcProfileDTO = {
    id: mockId,
    name: `NPC z ${initialPrompt.substring(0, 10)}...`,
    appearance: `${complexityLevel === "szczegółowy" ? "Szczegółowy" : "Podstawowy"} opis wyglądu dla: ${initialPrompt.substring(0, 20)}...`,
    profession: randomProfession,
    relationship_to_party: "Neutralny, może stać się sojusznikiem",
    scene_description: `Spotykasz tę postać ${complexityLevel === "uproszczony" ? "w tawernie" : "podczas wędrówki przez las"}`,
    special_traits: complexityLevel === "uproszczony" ? "Brak szczególnych cech" : "Ma bliznę nad prawym okiem i lekko utyka",
    complexity_level: complexityLevel,
    is_public: false,
    created_at: now,
    updated_at: now,
    user_id: "mock-user-id", // In a real app, this would come from the authenticated user
  };

  // Add more details based on complexity level
  if (complexityLevel === "szczegółowy") {
    profile.appearance += " Szczegółowy opis stroju, fryzury i wyglądu.";
    profile.special_traits += " Posiada nietypowe umiejętności i historię.";
    profile.scene_description += " Zestaw szczegółowych opcji dialogowych i zachowań.";
  } else if (complexityLevel === "zwykły") {
    profile.appearance += " Standardowy opis wyglądu zewnętrznego.";
    profile.special_traits += " Kilka charakterystycznych cech osobowości.";
  }

  return profile;
} 