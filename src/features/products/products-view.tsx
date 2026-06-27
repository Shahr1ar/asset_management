"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ImageIcon, Loader2, MoreHorizontal, PackagePlus, Search, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/services/supabase/product-service";
import type { Product, ProductCategory, ProductGrade } from "@/types";

const PRODUCT_CATEGORIES = ["Steel", "Cement", "Consumer", "Others"] as const;
const STEEL_GRADES = ["Grade A", "Grade B"] as const;
const CATEGORY_FILTERS = ["all", ...PRODUCT_CATEGORIES] as const;

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters"),
    category: z.enum(PRODUCT_CATEGORIES),
    grade: z.enum(STEEL_GRADES).nullable().optional(),
    price: z.number({ error: "Price is required" }).min(0, "Price cannot be negative"),
    image: z.any().optional(),
    is_active: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.category === "Steel" && !data.grade) {
      context.addIssue({
        code: "custom",
        message: "Grade is required for steel products",
        path: ["grade"],
      });
    }
  });

type ProductFormValues = z.infer<typeof productSchema>;

const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  name: "",
  category: "Others",
  grade: null,
  price: 0,
  image: undefined,
  is_active: true,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getProductFormValues(product?: Product | null): ProductFormValues {
  if (!product) {
    return EMPTY_PRODUCT_VALUES;
  }

  return {
    name: product.name,
    category: product.category,
    grade: product.grade,
    price: product.price,
    image: undefined,
    is_active: product.is_active,
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

function ProductImagePreview({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-white/[0.03]">
      {image ? (
        <img alt={name} className="h-full w-full object-cover" src={image} />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

function ProductForm({
  disabled,
  form,
  idPrefix,
  initialImage,
}: {
  disabled: boolean;
  form: UseFormReturn<ProductFormValues>;
  idPrefix: string;
  initialImage?: string | null;
}) {
  const {
    control,
    formState: { errors },
    register,
    setValue,
    watch,
  } = form;
  const category = watch("category");
  const image = watch("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage ?? null);

  useEffect(() => {
    const file = getSelectedImageFile(image);
    if (!file) {
      setPreviewUrl(initialImage ?? null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image, initialImage]);

  useEffect(() => {
    if (category !== "Steel") {
      setValue("grade", null);
    }
  }, [category, setValue]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Product Name</Label>
          <Input
            id={`${idPrefix}-name`}
            disabled={disabled}
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <span className="text-xs text-red-500">{errors.name.message}</span> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-price`}>Price</Label>
          <Input
            id={`${idPrefix}-price`}
            disabled={disabled}
            min={0}
            step="0.01"
            type="number"
            {...register("price", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            aria-invalid={Boolean(errors.price)}
          />
          {errors.price ? <span className="text-xs text-red-500">{errors.price.message}</span> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                disabled={disabled}
                onValueChange={(value) => field.onChange(value as ProductCategory)}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((categoryItem) => (
                    <SelectItem key={categoryItem} value={categoryItem}>
                      {categoryItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {category === "Steel" ? (
          <div className="space-y-2">
            <Label>Grade</Label>
            <Controller
              control={control}
              name="grade"
              render={({ field }) => (
                <Select
                  disabled={disabled}
                  onValueChange={(value) => field.onChange(value as ProductGrade)}
                  value={field.value ?? undefined}
                >
                  <SelectTrigger aria-invalid={Boolean(errors.grade)}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {STEEL_GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.grade ? <span className="text-xs text-red-500">{errors.grade.message}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-image`}>Product Image</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <ProductImagePreview image={previewUrl} name={watch("name") || "Product image"} />
          <Input
            accept="image/*"
            className="min-w-0 flex-1"
            disabled={disabled}
            id={`${idPrefix}-image`}
            type="file"
            {...register("image")}
          />
        </div>
      </div>
      <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background/70 px-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Is Active</span>
          <Badge variant={watch("is_active") ? "success" : "warning"}>
            {watch("is_active") ? "active" : "inactive"}
          </Badge>
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              checked={field.value}
              disabled={disabled}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}

function ProductCard({
  onDelete,
  onEdit,
  product,
}: {
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  product: Product;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <ProductImagePreview image={product.image} name={product.name} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{product.name}</p>
              <Badge variant={product.is_active ? "success" : "warning"}>
                {product.is_active ? "active" : "inactive"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{product.category}</span>
              <span>{product.grade ?? "N/A"}</span>
              <span className="font-medium text-foreground">{formatCurrency(product.price)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end sm:justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`Open actions for ${product.name}`} size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(product);
                }}
              >
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-300"
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete(product);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductTableSkeleton() {
  return (
    <>
      <div className="grid gap-4 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex gap-4 p-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="hidden lg:block">
        <CardContent className="space-y-4 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-4 md:grid-cols-[64px_1.4fr_1fr_1fr_0.8fr_0.8fr_40px]"
            >
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-10 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export function ProductsView() {
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT_VALUES,
  });
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT_VALUES,
  });

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      setProducts(await getProducts());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesName =
        !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesName && matchesCategory;
    });
  }, [categoryFilter, products, query]);

  async function handleCreate(values: ProductFormValues) {
    setSavingCreate(true);
    try {
      await createProduct(values);
      await loadProducts();
      createForm.reset(EMPTY_PRODUCT_VALUES);
      setCreateOpen(false);
      toast.success("Product created.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleUpdate(values: ProductFormValues) {
    if (!editingProduct) {
      return;
    }

    setSavingEdit(true);
    try {
      await updateProduct(editingProduct.id, values);
      await loadProducts();
      setEditOpen(false);
      setEditingProduct(null);
      toast.success("Product updated.");
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
      await deleteProduct(deleteTarget.id);
      await loadProducts();
      setDeleteTarget(null);
      toast.success("Product deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    editForm.reset(getProductFormValues(product));
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product management"
        description="Create products, manage category-specific grade data, and control product availability."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PackagePlus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />
      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by product name"
              value={query}
            />
          </div>
          <Select
            onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
            value={categoryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {loadingProducts ? (
        <ProductTableSkeleton />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Add a product or adjust the search and category filters."
          actionLabel="Add Product"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                onDelete={setDeleteTarget}
                onEdit={openEditDialog}
                product={product}
              />
            ))}
          </div>
          <Card className="hidden lg:block">
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-white/5 text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-medium">Image</th>
                      <th className="px-5 py-4 font-medium">Name</th>
                      <th className="px-5 py-4 font-medium">Category</th>
                      <th className="px-5 py-4 font-medium">Grade</th>
                      <th className="px-5 py-4 font-medium">Price</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-4">
                          <ProductImagePreview image={product.image} name={product.name} />
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">{product.name}</td>
                        <td className="px-5 py-4">{product.category}</td>
                        <td className="px-5 py-4">{product.grade ?? "N/A"}</td>
                        <td className="px-5 py-4">{formatCurrency(product.price)}</td>
                        <td className="px-5 py-4">
                          <Badge variant={product.is_active ? "success" : "warning"}>
                            {product.is_active ? "active" : "inactive"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Open actions for ${product.name}`}
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  openEditDialog(product);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-300"
                                onSelect={(event) => {
                                  event.preventDefault();
                                  setDeleteTarget(product);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            createForm.reset(EMPTY_PRODUCT_VALUES);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Create a product record for the catalog.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={createForm.handleSubmit(handleCreate)}>
            <ProductForm disabled={savingCreate} form={createForm} idPrefix="product-create" />
            <div className="flex justify-end">
              <Button disabled={savingCreate} type="submit">
                {savingCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Add Product
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
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details and availability.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={editForm.handleSubmit(handleUpdate)}>
            <ProductForm
              disabled={savingEdit}
              form={editForm}
              idPrefix="product-edit"
              initialImage={editingProduct?.image}
            />
            <div className="flex justify-end">
              <Button disabled={savingEdit} type="submit">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                Save Product
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
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.name ?? "this product"} from the catalog.
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
