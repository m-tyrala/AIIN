import type { APIRoute } from 'astro';
import { MockAIService } from '../../../lib/services/aiService.mock';
import { LogService } from '../../../lib/services/logService';
import { generateNpcProfileSchema } from '../../../lib/schemas/npc-profile.schema';
import { ZodError } from 'zod';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  
  try {
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Unauthorized: not connected to supabase' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

    const aiService = new MockAIService();
    const logService = new LogService(supabase);

    const generatedProfile = await aiService.generateNpcProfile(validationResult.data);

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