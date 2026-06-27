"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Edit,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import {
  createProperty,
  deleteProperty,
  getProperties,
  updateProperty,
} from "@/services/supabase/property-service";
import type { Property } from "@/types";

const propertySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(1, "Description is required"),
  price: z.number({ error: "Price is required" }).min(0, "Price cannot be negative"),
  priceType: z.string().trim().min(1, "Price unit is required"),
  propertyType: z.literal("sale"),
  address: z.string().trim().min(1, "Address is required"),
  latitude: z.number({ error: "Latitude is required" }),
  longitude: z.number({ error: "Longitude is required" }),
  bedrooms: z.number({ error: "Bedrooms is required" }).int().min(0),
  bathrooms: z.number({ error: "Bathrooms is required" }).int().min(0),
  area: z.number({ error: "Area is required" }).min(0),
  features: z.array(z.string().trim().min(1)),
  ownerName: z.string().trim().min(1, "Owner name is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required"),
  images: z.array(z.any()).max(5, "Maximum of 5 images allowed"),
  isActive: z.boolean(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const EMPTY_PROPERTY_VALUES: PropertyFormValues = {
  title: "",
  description: "",
  price: 0,
  priceType: "total",
  propertyType: "sale",
  address: "",
  latitude: 0,
  longitude: 0,
  bedrooms: 0,
  bathrooms: 0,
  area: 0,
  features: [],
  ownerName: "",
  phoneNumber: "",
  whatsappNumber: "",
  images: [],
  isActive: true,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getPropertyFormValues(property?: Property | null): PropertyFormValues {
  if (!property) {
    return EMPTY_PROPERTY_VALUES;
  }

  return {
    title: property.title,
    description: property.description,
    price: property.price,
    priceType: property.priceType,
    propertyType: "sale",
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    features: property.features,
    ownerName: property.ownerName,
    phoneNumber: property.phoneNumber,
    whatsappNumber: property.whatsappNumber,
    images: property.imageUrls ?? (property.imageUrl ? [property.imageUrl] : []),
    isActive: property.isActive,
  };
}

function getSelectedImageFile(image: unknown) {
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

function PropertyImagePreview({ image, title }: { image: string | null; title: string }) {
  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white/[0.03]">
      {image ? (
        <img alt={title} className="h-full w-full object-cover" src={image} />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

function PropertyRowActions({
  onDelete,
  onEdit,
  property,
}: {
  onDelete: (property: Property) => void;
  onEdit: (property: Property) => void;
  property: Property;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Open actions for ${property.title}`} size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onEdit(property);
          }}
        >
          <Edit className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-rose-300"
          onSelect={(event) => {
            event.preventDefault();
            onDelete(property);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PropertyCard({
  onDelete,
  onEdit,
  property,
}: {
  onDelete: (property: Property) => void;
  onEdit: (property: Property) => void;
  property: Property;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <PropertyImagePreview image={property.imageUrl || null} title={property.title} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{property.title}</p>
              <Badge variant={property.isActive ? "success" : "warning"}>
                {property.isActive ? "active" : "inactive"}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {property.address || "N/A"}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatCurrency(property.price)}</span>
              <span>{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
              <span>{property.area} sqft</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end sm:justify-start">
          <PropertyRowActions onDelete={onDelete} onEdit={onEdit} property={property} />
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyTableSkeleton() {
  return (
    <>
      <div className="grid gap-4 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex gap-4 p-4">
              <Skeleton className="h-12 w-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-44" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="hidden lg:block">
        <CardContent className="overflow-hidden p-0">
          <div className="space-y-0 divide-y divide-border/60 px-5 py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[72px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.4fr)_64px_64px_88px_88px_48px] items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-12 w-16 rounded-lg" />
                <Skeleton className="h-4 w-full max-w-40" />
                <Skeleton className="h-4 w-20 justify-self-end" />
                <Skeleton className="h-4 w-full max-w-48" />
                <Skeleton className="h-4 w-8 justify-self-center" />
                <Skeleton className="h-4 w-8 justify-self-center" />
                <Skeleton className="h-4 w-16 justify-self-end" />
                <Skeleton className="h-7 w-20 justify-self-start rounded-full" />
                <Skeleton className="h-10 w-10 justify-self-end" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function FeaturesField({
  disabled,
  form,
}: {
  disabled: boolean;
  form: UseFormReturn<PropertyFormValues>;
}) {
  const [draft, setDraft] = useState("");

  return (
    <Controller
      control={form.control}
      name="features"
      render={({ field }) => {
        const features = field.value ?? [];

        function addFeature() {
          const value = draft.trim();
          if (!value || features.includes(value)) {
            setDraft("");
            return;
          }

          field.onChange([...features, value]);
          setDraft("");
        }

        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                disabled={disabled}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="e.g. Swimming Pool"
                value={draft}
              />
              <Button disabled={disabled} onClick={addFeature} type="button" variant="secondary">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            {features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <Badge key={feature} className="gap-1.5" variant="secondary">
                    {feature}
                    <button
                      aria-label={`Remove ${feature}`}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={disabled}
                      onClick={() => field.onChange(features.filter((item) => item !== feature))}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        );
      }}
    />
  );
}

function NumberField({
  id,
  label,
  disabled,
  form,
  name,
  step,
}: {
  id: string;
  label: string;
  disabled: boolean;
  form: UseFormReturn<PropertyFormValues>;
  name: "price" | "latitude" | "longitude" | "bedrooms" | "bathrooms" | "area";
  step?: string;
}) {
  const {
    formState: { errors },
    register,
  } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        disabled={disabled}
        step={step}
        type="number"
        {...register(name, {
          setValueAs: (value) => (value === "" ? undefined : Number(value)),
        })}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] ? <span className="text-xs text-red-500">{errors[name]?.message}</span> : null}
    </div>
  );
}

function TextField({
  id,
  label,
  disabled,
  form,
  name,
  placeholder,
}: {
  id: string;
  label: string;
  disabled: boolean;
  form: UseFormReturn<PropertyFormValues>;
  name: "title" | "priceType" | "address" | "ownerName" | "phoneNumber" | "whatsappNumber";
  placeholder?: string;
}) {
  const {
    formState: { errors },
    register,
  } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] ? <span className="text-xs text-red-500">{errors[name]?.message}</span> : null}
    </div>
  );
}

function SingleImagePreview({
  img,
  index,
  disabled,
  onRemove,
}: {
  img: any;
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  const [previewSrc, setPreviewSrc] = useState("");

  useEffect(() => {
    if (typeof img === "string") {
      setPreviewSrc(img);
      return;
    }

    if (img instanceof File) {
      const objectUrl = URL.createObjectURL(img);
      setPreviewSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [img]);

  return (
    <div className="group relative flex aspect-video shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white/[0.03]">
      {previewSrc ? (
        <img
          alt={`Preview ${index + 1}`}
          className="h-full w-full object-cover"
          src={previewSrc}
        />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
      <button
        aria-label={`Remove image ${index + 1}`}
        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black"
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function PropertyForm({
  disabled,
  form,
  idPrefix,
}: {
  disabled: boolean;
  form: UseFormReturn<PropertyFormValues>;
  idPrefix: string;
}) {
  const {
    control,
    formState: { errors },
    register,
    watch,
  } = form;

  return (
    <div className="grid gap-4">
      <TextField
        disabled={disabled}
        form={form}
        id={`${idPrefix}-title`}
        label="Property Title"
        name="title"
        placeholder="Moonsoon Villa"
      />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          disabled={disabled}
          {...register("description")}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description ? (
          <span className="text-xs text-red-500">{errors.description.message}</span>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-price`}
          label="Price"
          name="price"
          step="0.01"
        />
        <TextField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-priceType`}
          label="Price Unit"
          name="priceType"
          placeholder="total"
        />
      </div>
      <TextField
        disabled={disabled}
        form={form}
        id={`${idPrefix}-address`}
        label="Address"
        name="address"
        placeholder="California, USA"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-latitude`}
          label="Latitude"
          name="latitude"
          step="any"
        />
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-longitude`}
          label="Longitude"
          name="longitude"
          step="any"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-bedrooms`}
          label="Bedrooms"
          name="bedrooms"
        />
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-bathrooms`}
          label="Bathrooms"
          name="bathrooms"
        />
        <NumberField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-area`}
          label="Area (sq ft)"
          name="area"
          step="0.01"
        />
      </div>
      <div className="space-y-2">
        <Label>Features</Label>
        <FeaturesField disabled={disabled} form={form} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-ownerName`}
          label="Owner Name"
          name="ownerName"
          placeholder="John Doe"
        />
        <TextField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-phoneNumber`}
          label="Phone Number"
          name="phoneNumber"
          placeholder="+8801XXXXXXXXX"
        />
        <TextField
          disabled={disabled}
          form={form}
          id={`${idPrefix}-whatsappNumber`}
          label="WhatsApp Number"
          name="whatsappNumber"
          placeholder="+8801XXXXXXXXX"
        />
      </div>
      <div className="space-y-2">
        <Label>Property Images (max 5)</Label>
        <Controller
          control={control}
          name="images"
          render={({ field }) => {
            const images: any[] = field.value ?? [];

            const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              if (!e.target.files) return;
              const files = Array.from(e.target.files);
              const nextImages = [...images, ...files].slice(0, 5);
              field.onChange(nextImages);
            };

            const handleRemoveImage = (index: number) => {
              const nextImages = images.filter((_, idx) => idx !== index);
              field.onChange(nextImages);
            };

            return (
              <div className="space-y-4">
                {images.length < 5 && (
                  <div className="flex items-center gap-4">
                    <Input
                      accept="image/*"
                      disabled={disabled}
                      id={`${idPrefix}-images`}
                      multiple
                      type="file"
                      onChange={handleFileChange}
                      value=""
                    />
                  </div>
                )}

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {images.map((img, index) => (
                      <SingleImagePreview
                        key={index}
                        img={img}
                        index={index}
                        disabled={disabled}
                        onRemove={() => handleRemoveImage(index)}
                      />
                    ))}
                  </div>
                )}
                {errors.images && (
                  <span className="text-xs text-red-500">{errors.images.message}</span>
                )}
              </div>
            );
          }}
        />
      </div>
      <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background/70 px-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Is Active</span>
          <Badge variant={watch("isActive") ? "success" : "warning"}>
            {watch("isActive") ? "active" : "inactive"}
          </Badge>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch checked={field.value} disabled={disabled} onCheckedChange={field.onChange} />
          )}
        />
      </div>
    </div>
  );
}

export function PropertiesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [query, setQuery] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const createForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: EMPTY_PROPERTY_VALUES,
  });
  const editForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: EMPTY_PROPERTY_VALUES,
  });

  const loadProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      setProperties(await getProperties());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesTitle =
        !normalizedQuery || property.title.toLowerCase().includes(normalizedQuery);

      return matchesTitle;
    });
  }, [properties, query]);

  async function handleCreate(values: PropertyFormValues) {
    setSavingCreate(true);
    try {
      await createProperty(values);
      await loadProperties();
      createForm.reset(EMPTY_PROPERTY_VALUES);
      setCreateOpen(false);
      toast.success("Property created.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleUpdate(values: PropertyFormValues) {
    if (!editingProperty) {
      return;
    }

    setSavingEdit(true);
    try {
      await updateProperty(editingProperty.id, values);
      await loadProperties();
      setEditOpen(false);
      setEditingProperty(null);
      toast.success("Property updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await deleteProperty(deleteTarget.id);
      await loadProperties();
      setDeleteTarget(null);
      toast.success("Property deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  function openEditDialog(property: Property) {
    setEditingProperty(property);
    editForm.reset(getPropertyFormValues(property));
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property management"
        description="Create and manage properties for sale shown in the mobile app."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Building2 className="h-4 w-4" />
            Add Property
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title"
              value={query}
            />
          </div>
        </CardContent>
      </Card>
      {loadingProperties ? (
        <PropertyTableSkeleton />
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="Add a property or adjust the search filter."
          actionLabel="Add Property"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                onDelete={setDeleteTarget}
                onEdit={openEditDialog}
                property={property}
              />
            ))}
          </div>
          <Card className="hidden lg:block">
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[72px]" />
                    <col className="w-[20%]" />
                    <col className="w-[11%]" />
                    <col className="w-[24%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[56px]" />
                  </colgroup>
                  <thead className="border-b border-border bg-white/5 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-4 font-medium">Image</th>
                      <th className="px-4 py-4 font-medium">Title</th>
                      <th className="px-4 py-4 text-right font-medium">Price</th>
                      <th className="px-4 py-4 font-medium">Address</th>
                      <th className="px-4 py-4 text-center font-medium">Beds</th>
                      <th className="px-4 py-4 text-center font-medium">Baths</th>
                      <th className="px-4 py-4 text-right font-medium">Area</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-4 align-middle">
                          <PropertyImagePreview
                            image={property.imageUrl || null}
                            title={property.title}
                          />
                        </td>
                        <td className="max-w-0 px-4 py-4 align-middle">
                          <p className="truncate font-medium text-foreground">{property.title}</p>
                        </td>
                        <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                          {formatCurrency(property.price)}
                        </td>
                        <td className="max-w-0 px-4 py-4 align-middle">
                          <p className="truncate text-muted-foreground">
                            {property.address || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center align-middle text-muted-foreground">
                          {property.bedrooms}
                        </td>
                        <td className="px-4 py-4 text-center align-middle text-muted-foreground">
                          {property.bathrooms}
                        </td>
                        <td className="px-4 py-4 text-right align-middle whitespace-nowrap text-muted-foreground">
                          {property.area} sqft
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <Badge variant={property.isActive ? "success" : "warning"}>
                            {property.isActive ? "active" : "inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right align-middle">
                          <PropertyRowActions
                            onDelete={setDeleteTarget}
                            onEdit={openEditDialog}
                            property={property}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (savingCreate) {
            return;
          }

          setCreateOpen(open);
          if (!open) {
            createForm.reset(EMPTY_PROPERTY_VALUES);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
            <DialogDescription>Create a property listing for the mobile app.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={createForm.handleSubmit(handleCreate)}>
            <PropertyForm disabled={savingCreate} form={createForm} idPrefix="property-create" />
            <div className="flex justify-end">
              <Button disabled={savingCreate} type="submit">
                {savingCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                Add Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (savingEdit) {
            return;
          }

          setEditOpen(open);
          if (!open) {
            setEditingProperty(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update property details and availability.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={editForm.handleSubmit(handleUpdate)}>
            <PropertyForm
              disabled={savingEdit}
              form={editForm}
              idPrefix="property-edit"
            />
            <div className="flex justify-end">
              <Button disabled={savingEdit} type="submit">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                Save Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.title ?? "this property"} from the listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
