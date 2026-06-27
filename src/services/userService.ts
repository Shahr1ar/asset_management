import { getSupabase } from "@/services/supabase/client";
import { updateUserFinancialData } from "@/services/supabase/database-service";
import type { UserFormValues } from "@/validations/user";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  fullName?: string;
  photoURL: string | null;
  image_url?: string;
  createdAt?: Date;
  lastLogin?: Date;
  referralCode?: string;
  isActive?: boolean;
  status?: "active" | "disabled";
}

function getProfileImageUrl(image: UserFormValues["image"]) {
  return typeof image === "string" && image.trim() ? image.trim() : undefined;
}

function getProfileImageFile(image: UserFormValues["image"]) {
  if (!image) {
    return undefined;
  }

  if (typeof File !== "undefined" && image instanceof File) {
    return image;
  }

  if (typeof FileList !== "undefined" && image instanceof FileList) {
    return image.item(0) ?? undefined;
  }

  if (Array.isArray(image) && typeof File !== "undefined" && image[0] instanceof File) {
    return image[0];
  }

  if (typeof image === "object" && "0" in image && typeof File !== "undefined") {
    const firstFile = (image as { 0?: unknown })[0];
    return firstFile instanceof File ? firstFile : undefined;
  }

  return undefined;
}

function getStorageFileName(file: File) {
  const safeName = file.name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `${Date.now()}-${safeName || "profile-image"}`;
}

async function uploadProfileImage(userId: string, image: UserFormValues["image"]) {
  const existingUrl = getProfileImageUrl(image);
  if (existingUrl) {
    return existingUrl;
  }

  const file = getProfileImageFile(image);
  if (!file) {
    return undefined;
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const fileName = getStorageFileName(file);
  const path = `${userId}/profile/${fileName}`;

  const { error } = await supabase.storage.from("profiles").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path);

  return publicUrl;
}

export const createManagedUser = async (
  values: UserFormValues,
  adminId?: string,
): Promise<string> => {
  const email = values.email.trim().toLowerCase();
  const password = values.password;

  if (!password) {
    throw new Error("Password is required.");
  }

  // 1. Call secure server-side Next.js route handler to create account
  const response = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      displayName: values.name.trim(),
      role: "member",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create user account.");
  }

  const result = await response.json();
  const userId = result.uid;

  // 2. Upload avatar and populate additional profile metadata fields
  try {
    const imageUrl = await uploadProfileImage(userId, values.image);
    const supabase = getSupabase();
    if (supabase) {
      const payload: any = {};
      if (imageUrl) {
        payload.profile_photo_url = imageUrl;
      }
      if (values.referralCode) {
        payload.referral_code = values.referralCode.trim();
      }
      if (adminId) {
        payload.created_by = adminId;
      }

      if (Object.keys(payload).length > 0) {
        await supabase.from("users").update(payload).eq("uid", userId);
      }
    }
  } catch (err) {
    console.error("Failed to update extra user profile data:", err);
  }

  return userId;
};

export const updateManagedUser = async (
  userId: string,
  values: UserFormValues,
): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const imageUrl = await uploadProfileImage(userId, values.image);

  const payload: any = {
    full_name: values.name.trim(),
    display_name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    status: values.isActive ? "active" : "disabled",
    updated_at: new Date().toISOString(),
  };

  if (values.referralCode !== undefined) {
    payload.referral_code = values.referralCode.trim();
  }

  if (imageUrl) {
    payload.profile_photo_url = imageUrl;
  }

  const { error } = await supabase.from("users").update(payload).eq("uid", userId);
  if (error) throw error;
};

export const setUserActive = async (userId: string, isActive: boolean): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("users")
    .update({
      status: isActive ? "active" : "disabled",
      updated_at: new Date().toISOString(),
    })
    .eq("uid", userId);

  if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Delete from public.users. Cascading FKs will automatically delete current_data and history records.
  const { error } = await supabase.from("users").delete().eq("uid", userId);
  if (error) throw error;
};

export const userService = {
  createManagedUser,
  updateManagedUser,
  setUserActive,
  deleteUser,
};

export default userService;
