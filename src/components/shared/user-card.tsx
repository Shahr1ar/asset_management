import { MapPin, Wallet } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { ManagedUser } from "@/types";

export function UserCard({ user }: { user: ManagedUser }) {
  const balanceItem = user.currentData.items.find((item) => item.key === "balance");
  const balance = balanceItem?.enabled === false ? 0 : balanceItem?.value ?? 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profile.avatar} alt={user.profile.fullName} />
              <AvatarFallback>{user.profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.profile.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.profile.email}</p>
            </div>
          </div>
          <Badge variant={user.profile.status === "active" ? "success" : "warning"}>
            {user.profile.status}
          </Badge>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {user.profile.country}
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {formatCurrency(balance)}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/users/${user.profile.uid}`}>Open Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
