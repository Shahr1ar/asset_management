'use client';

import { Loader2, Upload } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createUserSchema, userSchema, type UserFormValues } from '../validations/user';

interface UserFormProps {
  initialData?: Partial<UserFormValues>;
  onSubmit: (data: UserFormValues) => Promise<void>;
  isLoading: boolean;
}

export function UserForm({ initialData, onSubmit, isLoading }: UserFormProps) {
  const isEditing = Boolean(initialData);
  const schema = isEditing ? userSchema : createUserSchema;
  const defaultValues = useMemo<UserFormValues>(
    () => ({
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      referralCode: initialData?.referralCode ?? '',
      password: '',
      confirmPassword: '',
      isActive: initialData?.isActive ?? true,
      image: undefined,
    }),
    [initialData],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const isBusy = isLoading || isSubmitting;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            autoComplete="name"
            {...register('name')}
            disabled={isBusy}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            autoComplete="email"
            {...register('email')}
            readOnly={isEditing}
            disabled={isBusy}
            aria-invalid={Boolean(errors.email)}
            className={isEditing ? 'opacity-80' : undefined}
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>

        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="user-referral-code">Referral Code</Label>
            <Input
              id="user-referral-code"
              autoComplete="off"
              {...register('referralCode')}
              disabled={isBusy}
              aria-invalid={Boolean(errors.referralCode)}
            />
            {errors.referralCode && <span className="text-xs text-red-500">{errors.referralCode.message}</span>}
          </div>
        )}

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background/70 px-3">
            <span className="text-sm text-muted-foreground">Active account</span>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  disabled={isBusy}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {!isEditing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                disabled={isBusy}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-confirm-password">Confirm Password</Label>
              <Input
                id="user-confirm-password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                disabled={isBusy}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-image">Image</Label>
        <label
          htmlFor="user-image"
          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
        >
          <span>Upload profile image</span>
          <Upload className="h-4 w-4" />
        </label>
        <Input
          id="user-image"
          type="file"
          accept="image/*"
          {...register('image')}
          disabled={isBusy}
          className="sr-only"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isBusy}
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isBusy ? 'Processing...' : isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
