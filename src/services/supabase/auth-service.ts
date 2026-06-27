import { type User } from "@supabase/supabase-js";
import { getSupabase } from "./client";

export async function loginWithEmailPassword(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logoutCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function watchAuthState(callback: (user: User | null) => void) {
  const supabase = getSupabase();
  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  // Retrieve current user immediately
  supabase.auth.getUser().then(({ data: { user } }) => {
    callback(user);
  });

  // Listen to auth state transitions
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}
