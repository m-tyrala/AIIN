import type { APIRoute } from 'astro';
import { AIService } from '../../../lib/services/aiService';
import { LogService } from '../../../lib/services/logService';
import { generateNpcProfileSchema } from '../../../lib/schemas/npc-profile.schema';
import { ZodError } from 'zod';

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

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = generateNpcProfileSchema.parse(body);

    // Initialize services
    const aiService = new AIService();
    const logService = new LogService(supabase);

    // Generate NPC profile
    const generatedProfile = await aiService.generateNpcProfile(validatedData);

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