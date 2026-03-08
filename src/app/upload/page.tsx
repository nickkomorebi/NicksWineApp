import { UploadFlow } from "@/components/upload/UploadFlow";
import { PageHeader } from "@/components/layout/PageHeader";

interface UploadPageProps {
  searchParams: Promise<{ tripId?: string }>;
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const { tripId } = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Upload Wine Labels" showBack />
      <UploadFlow tripId={tripId} />
    </div>
  );
}
