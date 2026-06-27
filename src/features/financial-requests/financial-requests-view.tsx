"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import {
  approveFinancialRequest,
  cancelFinancialRequest,
  getFinancialRequests,
} from "@/services/supabase/database-service";
import type { FinancialRequest, FinancialRequestType } from "@/types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function RequestCard({
  disabled,
  onApprove,
  onCancel,
  request,
}: {
  disabled: boolean;
  onApprove: (request: FinancialRequest) => void;
  onCancel: (request: FinancialRequest) => void;
  request: FinancialRequest;
}) {
  const canReview = request.status === "pending" && !request.applied;
  const userName = request.userName ?? request.userId;
  const statusClassName =
    request.status === "cancelled"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.userAvatar} alt={userName} />
            <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{userName}</p>
            <p className="text-xl font-semibold">{formatCurrency(request.amount)}</p>
          </div>
        </div>

        {canReview ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-3">
            <Button
              disabled={disabled}
              variant="outline"
              onClick={() => onCancel(request)}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button disabled={disabled} onClick={() => onApprove(request)}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </div>
        ) : (
          <div
            className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold capitalize ${statusClassName}`}
          >
            {request.status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequestsList({
  disabled,
  emptyTitle,
  onApprove,
  onCancel,
  requests,
}: {
  disabled: boolean;
  emptyTitle: string;
  onApprove: (request: FinancialRequest) => void;
  onCancel: (request: FinancialRequest) => void;
  requests: FinancialRequest[];
}) {
  if (requests.length === 0) {
    return <EmptyState title={emptyTitle} description="No matching financial requests are available." />;
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <RequestCard
          disabled={disabled}
          key={`${request.type}-${request.id}`}
          onApprove={onApprove}
          onCancel={onCancel}
          request={request}
        />
      ))}
    </div>
  );
}

export function FinancialRequestsView() {
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const refreshRequests = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await getFinancialRequests());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRequests();
  }, [refreshRequests]);

  const requestsByType = useMemo(
    () => ({
      deposit: requests.filter((request) => request.type === "deposit"),
      withdrawal: requests.filter((request) => request.type === "withdrawal"),
    }),
    [requests],
  );

  async function reviewRequest(
    request: FinancialRequest,
    action: "approve" | "cancel",
  ) {
    const reviewKey = `${request.type}-${request.id}`;
    setReviewingId(reviewKey);

    try {
      if (action === "approve") {
        await approveFinancialRequest(request);
        toast.success("Request approved and user financial data updated.");
      } else {
        await cancelFinancialRequest(request.type, request.id);
        toast.success("Request cancelled.");
      }

      await refreshRequests();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setReviewingId(null);
    }
  }

  const renderList = (type: FinancialRequestType) => (
    <RequestsList
      disabled={Boolean(reviewingId)}
      emptyTitle={`No ${type} requests`}
      onApprove={(request) => void reviewRequest(request, "approve")}
      onCancel={(request) => void reviewRequest(request, "cancel")}
      requests={requestsByType[type]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial requests"
        description="Approve or cancel deposit and withdrawal requests. Approved requests update the selected user's current financial data."
        actions={
          <Button disabled={loading} variant="outline" onClick={() => void refreshRequests()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardContent className="flex min-h-52 items-center justify-center p-8 text-muted-foreground">
            Loading financial requests...
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="deposit">
          <TabsList>
            <TabsTrigger value="deposit">Deposit ({requestsByType.deposit.length})</TabsTrigger>
            <TabsTrigger value="withdrawal">
              Withdrawal ({requestsByType.withdrawal.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">{renderList("deposit")}</TabsContent>
          <TabsContent value="withdrawal">{renderList("withdrawal")}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
