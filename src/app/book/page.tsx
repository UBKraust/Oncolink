import { BookingWidget } from "@/components/booking/booking-widget";

export const metadata = {
  title: "Programare online · Cabinet psihoterapie",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ therapist?: string }>;
}) {
  const { therapist } = await searchParams;

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto w-full max-w-lg px-4">
        <div className="mb-8 space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            O
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Programare online
          </h1>
          <p className="text-sm text-muted-foreground">
            Completează formularul pentru a rezerva o ședință de psihoterapie.
          </p>
        </div>
        <BookingWidget therapistSlug={therapist ?? process.env.NEXT_PUBLIC_PUBLIC_BOOKING_SLUG ?? null} />
      </div>
    </div>
  );
}
