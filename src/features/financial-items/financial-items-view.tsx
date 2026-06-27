"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getFinancialTemplate,
  updateFinancialItem,
} from "@/services/supabase/database-service";
import type { FinancialTemplateItem } from "@/types";

const itemSchema = z.object({
  defaultValue: z.number().min(0, "Default value cannot be negative").optional(),
  isActive: z.boolean(),
});

type ItemValues = z.infer<typeof itemSchema>;

const EMPTY_ITEM_VALUES: ItemValues = {
  defaultValue: undefined,
  isActive: true,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getItemFormValues(item: FinancialTemplateItem): ItemValues {
  return {
    defaultValue: item.defaultValue,
    isActive: item.isActive ?? item.enabled,
  };
}

function FinancialItemFields({
  disabled,
  form,
  idPrefix,
}: {
  disabled: boolean;
  form: UseFormReturn<ItemValues>;
  idPrefix: string;
}) {
  const {
    control,
    formState: { errors },
    register,
    watch,
  } = form;
  const isActive = watch("isActive");
  const defaultValueId = `${idPrefix}-default-value`;

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={defaultValueId}>Default value</Label>
        <Input
          id={defaultValueId}
          disabled={disabled}
          min={0}
          type="number"
          {...register("defaultValue", {
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          })}
          aria-invalid={Boolean(errors.defaultValue)}
        />
        {errors.defaultValue ? (
          <span className="text-xs text-red-500">{errors.defaultValue.message}</span>
        ) : null}
      </div>
      <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background/70 px-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Active</span>
          <Badge variant={isActive ? "success" : "warning"}>
            {isActive ? "active" : "inactive"}
          </Badge>
        </div>
        <Controller
          control={control}
          name="isActive"
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

function FinancialItemCard({
  item,
  onEdit,
}: {
  item: FinancialTemplateItem;
  onEdit: (item: FinancialTemplateItem) => void;
}) {
  const isActive = item.isActive ?? item.enabled;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-foreground">{item.title}</h3>
              <Badge variant={isActive ? "success" : "warning"}>
                {isActive ? "active" : "inactive"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`Open actions for ${item.title}`} size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(item);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="rounded-md border border-border/70 px-2 py-1">
            Default: <span className="text-foreground">{item.defaultValue}</span>
          </div>
          <div className="rounded-md border border-border/70 px-2 py-1">
            Key: <span className="break-all font-mono text-foreground">{item.key}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancialItemsView() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialTemplateItem | null>(null);
  const [items, setItems] = useState<FinancialTemplateItem[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const editForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: EMPTY_ITEM_VALUES,
  });

  async function refreshItems() {
    const nextItems = await getFinancialTemplate();
    setItems(nextItems);
  }

  useEffect(() => {
    void refreshItems().catch((error) => {
      toast.error(getErrorMessage(error));
    });
  }, []);

  async function handleUpdate(itemKey: string, values: ItemValues) {
    setSavingEdit(true);
    try {
      await updateFinancialItem(itemKey, {
        ...values,
        defaultValue: values.defaultValue ?? 0,
      });
      await refreshItems();
      toast.success("Financial item updated.");
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  }

  function openEditDialog(item: FinancialTemplateItem) {
    setEditingItem(item);
    editForm.reset(getItemFormValues(item));
    setEditDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial item management"
        description="Manage the financial fields available for user-level values and monthly snapshots."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No financial items yet"
          description="No fixed financial template items are available."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <FinancialItemCard
              item={item}
              key={item.key}
              onEdit={openEditDialog}
            />
          ))}
        </div>
      )}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (savingEdit) {
            return;
          }

          setEditDialogOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit financial item</DialogTitle>
            <DialogDescription>Update the fixed item default value and active status.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={editForm.handleSubmit((values) => {
              if (!editingItem) {
                return;
              }

              void handleUpdate(editingItem.key, values);
            })}
          >
            <FinancialItemFields disabled={savingEdit} form={editForm} idPrefix="financial-edit" />
            <div className="flex justify-end">
              <Button disabled={savingEdit} type="submit">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
