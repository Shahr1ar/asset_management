"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterControls } from "@/components/shared/search-filter-controls";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/formatters";
import { getUserProfiles } from "@/services/supabase/database-service";
import { UserForm } from "@/services/UserForm";
import { userService } from "@/services/userService";
import { useAppStore } from "@/store/app-store";
import type { ManagedUser } from "@/types";
import type { UserFormValues } from "@/validations/user";

type PendingUserAction =
  | {
      type: "toggle";
      user: ManagedUser;
    }
  | {
      type: "delete";
      user: ManagedUser;
    }
  | null;

function isUserActive(user: ManagedUser) {
  return user.profile.isActive ?? user.profile.status === "active";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "US";
}

function getUserFormValues(user: ManagedUser): Partial<UserFormValues> {
  return {
    name: user.profile.fullName,
    email: user.profile.email,
    referralCode: user.profile.referralCode ?? "",
    isActive: isUserActive(user),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_40px]">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UsersView() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingUserAction>(null);
  const { userFilters, setUserFilters } = useAppStore();
  const { adminProfile, authUser } = useAuth();
  const deferredQuery = useDeferredValue(userFilters.query);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsers(await getUserProfiles());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (user.profile.role === "admin") {
        return false;
      }

      const query = deferredQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        user.profile.fullName.toLowerCase().includes(query) ||
        user.profile.email.toLowerCase().includes(query) ||
        (user.profile.referralCode ?? "").toLowerCase().includes(query);
      const active = isUserActive(user);
      const matchesStatus =
        userFilters.status === "all" ||
        (userFilters.status === "active" ? active : !active);
      return matchesQuery && matchesStatus;
    });
  }, [deferredQuery, userFilters.status, users]);

  const openCreateDialog = useCallback(() => {
    setEditingUser(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((user: ManagedUser) => {
    setEditingUser(user);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (savingUser) {
      return;
    }

    setDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  }, [savingUser]);

  const handleUserSubmit = useCallback(
    async (values: UserFormValues) => {
      setSavingUser(true);
      try {
        if (editingUser) {
          await userService.updateManagedUser(editingUser.profile.uid, values);
          toast.success("User updated.");
        } else {
          const adminId = adminProfile?.profile.uid ?? authUser?.id ?? "admin";
          await userService.createManagedUser(values, adminId);
          toast.success("User created.");
        }

        setDialogOpen(false);
        setEditingUser(null);
        await loadUsers();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setSavingUser(false);
      }
    },
    [adminProfile?.profile.uid, authUser?.id, editingUser, loadUsers],
  );

  const handleStatusChange = useCallback(
    async (user: ManagedUser, nextActive: boolean) => {
      try {
        await userService.setUserActive(user.profile.uid, nextActive);
        toast.success(`${user.profile.fullName} ${nextActive ? "enabled" : "disabled"}.`);
        await loadUsers();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [loadUsers],
  );

  const handleDeleteUser = useCallback(
    async (user: ManagedUser) => {
      try {
        await userService.deleteUser(user.profile.uid);
        toast.success(`${user.profile.fullName} deleted.`);
        await loadUsers();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [loadUsers],
  );

  const handleConfirmUserAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;
    setPendingAction(null);

    if (action.type === "toggle") {
      await handleStatusChange(action.user, !isUserActive(action.user));
      return;
    }

    await handleDeleteUser(action.user);
  }, [handleDeleteUser, handleStatusChange, pendingAction]);

  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => [
      {
        header: "User",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profile.avatar} alt={user.profile.fullName} />
                <AvatarFallback>{getInitials(user.profile.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{user.profile.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.profile.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        header: "Referral",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.profile.referralCode || "N/A"}
          </span>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const active = isUserActive(row.original);

          return (
            <Badge variant={active ? "success" : "warning"}>
              {active ? "active" : "inactive"}
            </Badge>
          );
        },
      },
      {
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.profile.createdAt || row.original.profile.joinedAt)}
          </span>
        ),
      },
      {
        header: "Last Login",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.profile.lastLoginAt ?? row.original.profile.lastActiveAt)}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const active = isUserActive(user);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.profile.uid}`}>View profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openEditDialog(user);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setPendingAction({ type: "toggle", user });
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  {active ? "Disable user" : "Enable user"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-rose-300"
                  onSelect={(event) => {
                    event.preventDefault();
                    setPendingAction({ type: "delete", user });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [openEditDialog],
  );

  const pendingUser = pendingAction?.user ?? null;
  const pendingUserActive = pendingUser ? isUserActive(pendingUser) : false;
  const pendingTitle =
    pendingAction?.type === "delete"
      ? "Delete user?"
      : pendingUserActive
        ? "Disable user?"
        : "Enable user?";
  const pendingDescription =
    pendingAction?.type === "delete"
      ? "This removes the Firestore profile, current data, and monthly history managed by this panel."
      : pendingUserActive
        ? "This user will no longer appear as active in the admin panel."
        : "This user will be restored to active status in the admin panel.";
  const pendingActionLabel =
    pendingAction?.type === "delete" ? "Delete" : pendingUserActive ? "Disable" : "Enable";

  return (
    <div className="space-y-6">
      <PageHeader
        title="User management"
        description="Create user accounts, maintain profile records, and control active access states."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Create user
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-4 p-5">
          <SearchFilterControls
            query={userFilters.query}
            onQueryChange={(value) =>
              startTransition(() => {
                setUserFilters({ query: value });
              })
            }
            status={userFilters.status}
            onStatusChange={(value) =>
              setUserFilters({ status: value as typeof userFilters.status })
            }
          />
        </CardContent>
      </Card>
      {loadingUsers ? (
        <UsersTableSkeleton />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Create a user or adjust the search and status filters."
          actionLabel="Create user"
          onAction={openCreateDialog}
        />
      ) : (
        <DataTable columns={columns} data={filteredUsers} />
      )}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update profile details, referral code, active status, or profile image."
                : "Create a Supabase Auth account and save the user profile."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            initialData={editingUser ? getUserFormValues(editingUser) : undefined}
            isLoading={savingUser}
            onSubmit={handleUserSubmit}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingTitle}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmUserAction()}>
              {pendingActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
