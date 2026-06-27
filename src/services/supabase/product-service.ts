import { getSupabase } from "@/services/supabase/client";
import type { Product, ProductCategory, ProductGrade } from "@/types";

export interface ProductInput {
  name: string;
  category: ProductCategory;
  grade?: ProductGrade | null;
  price: number;
  image?: unknown;
  is_active: boolean;
}

function getProductImageUrl(image: unknown) {
  return typeof image === "string" && image.trim() ? image.trim() : undefined;
}

function getProductImageFile(image: unknown) {
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

  return `${Date.now()}-${safeName || "product-image"}`;
}

async function uploadProductImage(productId: string, image: unknown) {
  const existingUrl = getProductImageUrl(image);
  if (existingUrl) {
    return existingUrl;
  }

  const file = getProductImageFile(image);
  if (!file) {
    return undefined;
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const fileName = getStorageFileName(file);
  const path = `${productId}/${fileName}`;

  const { error } = await supabase.storage.from("products").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("products").getPublicUrl(path);

  return publicUrl;
}

function normalizeProductPayload(values: ProductInput, imageUrl?: string | null) {
  const payload: any = {
    name: values.name.trim(),
    category: values.category,
    grade: values.category === "Steel" ? values.grade ?? null : null,
    price: Number(values.price),
    is_active: values.is_active,
  };

  if (imageUrl !== undefined) {
    payload.image = imageUrl;
  }

  return payload;
}

function normalizeProduct(row: any): Product {
  const now = new Date().toISOString();
  return {
    id: row.id,
    name: row.name || "",
    category: row.category || "Others",
    grade: row.category === "Steel" ? row.grade ?? null : null,
    price: Number(row.price) || 0,
    image: row.image || null,
    is_active: row.is_active ?? true,
    created_at: row.created_at || now,
    updated_at: row.updated_at || now,
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(normalizeProduct);
}

export async function createProduct(values: ProductInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  // Generate a random UUID local to client for storage folder matching
  const tempId = crypto.randomUUID();
  const imageUrl = await uploadProductImage(tempId, values.image);

  const payload = {
    id: tempId,
    ...normalizeProductPayload(values, imageUrl ?? null),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("products").insert(payload);
  if (error) {
    throw error;
  }

  return tempId;
}

export async function updateProduct(productId: string, values: ProductInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const imageUrl = await uploadProductImage(productId, values.image);
  const payload = normalizeProductPayload(values, imageUrl);

  const { error } = await supabase
    .from("products")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    throw error;
  }
}
