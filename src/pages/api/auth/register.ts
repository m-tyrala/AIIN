import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password, confirmPassword } = await request.json();

    // Basic validation
    if (!email || !password || !confirmPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane', 
          message: 'Email, hasło i potwierdzenie hasła są wymagane' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane', 
          message: 'Hasła muszą być identyczne' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane', 
          message: 'Hasło musi mieć co najmniej 8 znaków' 
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd rejestracji', 
          message: 'Nie udało się utworzyć konta' 
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
        data: { 
          user: {
            id: data.user?.id,
            email: data.user?.email
          }
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Register API error:', error);
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