import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd wylogowania', 
          message: 'Nie udało się wylogować' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Pomyślnie wylogowano' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Logout API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Błąd serwera', 
        message: 'Wystąpił nieoczekiwany błąd' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 