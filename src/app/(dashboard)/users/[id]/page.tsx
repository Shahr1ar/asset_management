import { UserDetailView } from "@/features/users/user-detail-view";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailView userId={id} />;
}
