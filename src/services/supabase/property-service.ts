import { getSupabase } from "@/services/supabase/client";
import type { Property, PropertyType } from "@/types";

export interface PropertyInput {
  title: string;
  description: string;
  price: number;
  priceType: string;
  propertyType: PropertyType;
  address: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  ownerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  images?: any[];
  isActive: boolean;
}

function getImageUrl(image: unknown) {
  return typeof image === "string" && image.trim() ? image.trim() : undefined;
}

function getImageFile(image: unknown) {
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

  return `${Date.now()}-${safeName || "property-image"}`;
}

async function uploadPropertyImages(propertyId: string, images: any[]) {
  if (!images || images.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const urls: string[] = [];

  for (const item of images) {
    if (typeof item === "string") {
      urls.push(item);
    } else {
      const file = getImageFile(item);
      if (!file) continue;

      const fileName = getStorageFileName(file);
      const path = `${propertyId}/${fileName}`;

      const { error } = await supabase.storage.from("properties").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("properties").getPublicUrl(path);

      urls.push(publicUrl);
    }
  }

  return urls;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePropertyPayload(values: PropertyInput, imageUrls: string[]) {
  const payload: any = {
    title: values.title.trim(),
    description: values.description.trim(),
    price: toNumber(values.price),
    price_type: values.priceType.trim(),
    property_type: "sale",
    address: values.address.trim(),
    latitude: toNumber(values.latitude),
    longitude: toNumber(values.longitude),
    bedrooms: Math.trunc(toNumber(values.bedrooms)),
    bathrooms: Math.trunc(toNumber(values.bathrooms)),
    area: toNumber(values.area),
    features: values.features
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0),
    owner_name: values.ownerName.trim(),
    phone_number: values.phoneNumber.trim(),
    whatsapp_number: values.whatsappNumber.trim(),
    is_active: values.isActive,
  };

  payload.image_url = imageUrls[0] ?? "";
  payload.image_urls = imageUrls;

  return payload;
}

function normalizeProperty(row: any): Property {
  return {
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    price: toNumber(row.price),
    priceType: row.price_type || "total",
    propertyType: "sale",
    address: row.address || "",
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    bedrooms: Math.trunc(toNumber(row.bedrooms)),
    bathrooms: Math.trunc(toNumber(row.bathrooms)),
    area: toNumber(row.area),
    features: Array.isArray(row.features) ? row.features.map((feature: any) => String(feature)) : [],
    ownerName: row.owner_name || "",
    phoneNumber: row.phone_number || "",
    whatsappNumber: row.whatsapp_number || "",
    imageUrl: row.image_url || "",
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls.map((u: any) => String(u)) : (row.image_url ? [row.image_url] : []),
    isActive: row.is_active ?? true,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

export async function getProperties(): Promise<Property[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map(normalizeProperty)
    .filter((property) => property.propertyType === "sale");
}

export async function createProperty(values: PropertyInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const tempId = crypto.randomUUID();
  const imageUrls = await uploadPropertyImages(tempId, values.images ?? []);

  const payload = {
    id: tempId,
    ...normalizePropertyPayload(values, imageUrls),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("properties").insert(payload);
  if (error) {
    throw error;
  }

  return tempId;
}

export async function updateProperty(propertyId: string, values: PropertyInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const imageUrls = await uploadPropertyImages(propertyId, values.images ?? []);
  const payload = normalizePropertyPayload(values, imageUrls);

  const { error } = await supabase
    .from("properties")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    throw error;
  }
}

export async function deleteProperty(propertyId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) {
    throw error;
  }
}
