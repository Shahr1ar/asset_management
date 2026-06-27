import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email, password, displayName, role } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { message: "Supabase environment keys are not configured on the server." },
        { status: 500 }
      );
    }

    // Initialize Supabase client with Service Role Key for administrative access
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email.split("@")[0],
        full_name: displayName || "",
        role: role || "user",
      },
    });

    if (error) {
      return NextResponse.json(
        { message: error.message || "Failed to create user in Auth." },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { message: "Created user did not return valid user data." },
        { status: 500 }
      );
    }

    // The SQL trigger public.on_auth_user_created automatically populates
    // public.users profile and public.user_current_data on database level.
    return NextResponse.json({
      success: true,
      uid: data.user.id,
      message: "User created successfully.",
    });
  } catch (error: any) {
    console.error("API error during user creation:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
