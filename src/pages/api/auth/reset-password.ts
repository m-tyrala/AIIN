import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email } = await request.json();

    // Basic validation
    if (!email) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane', 
          message: 'Email jest wymagany' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password?token=true`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd resetowania hasła', 
          message: 'Nie udało się wysłać linku resetującego' 
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
        message: 'Link resetujący został wysłany na podany email' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Reset password API error:', error);
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