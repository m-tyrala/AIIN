import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane', 
          message: 'Email i hasło są wymagane' 
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd logowania', 
          message: 'Nieprawidłowe dane logowania' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: { 
          user: {
            id: data.user.id,
            email: data.user.email
          }
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Login API error:', error);
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