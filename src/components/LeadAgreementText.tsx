import AgreementBody from "@/components/AgreementBody";

// Same fixed agreement as RentalAgreementText (used at booking checkout),
// but with a "1. Rental Details" header suited to a quote request — no
// assigned equipment/delivery times yet, just what the customer entered.
export default function LeadAgreementText({
  renterName,
  org,
  phone,
  email,
  eventName,
  eventAddress,
  recommendedTier,
  eventDateLabel,
  eventTimeSlotLabel,
  dropoffLabel,
  guestCount,
}: {
  renterName: string;
  org?: string;
  phone?: string;
  email?: string;
  eventName?: string;
  eventAddress?: string;
  recommendedTier?: string;
  eventDateLabel?: string;
  eventTimeSlotLabel?: string;
  dropoffLabel?: string;
  guestCount?: string;
}) {
  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex justify-between gap-4 border-b border-line py-1.5 text-sm">
      <span className="text-steel">{label}</span>
      <span className="text-right font-medium text-navy">{value || "—"}</span>
    </div>
  );

  return (
    <div className="text-sm leading-relaxed text-navy">
      <p className="font-display text-lg font-semibold text-navy">STUDIO MELISSA RENTAL</p>
      <p className="text-xs text-steel">Audio &amp; PA Equipment Rentals — Central Texas</p>
      <h3 className="mt-4 font-display text-base font-semibold text-navy">
        EQUIPMENT RENTAL AGREEMENT
      </h3>
      <p className="mt-2 text-steel">
        This Equipment Rental Agreement (&quot;Agreement&quot;) is entered into as of the date
        signed below, by and between Studio Melissa Rental, LLC, a Texas limited liability company
        with a principal place of business in Central Texas (&quot;Company,&quot; &quot;we,&quot;
        or &quot;us&quot;), and the customer identified below (&quot;Renter,&quot; &quot;you&quot;).
      </p>
      <p className="mt-2 text-steel">
        By signing below, Renter agrees to be bound by the terms of this Agreement in full, pending
        final confirmation of package, pricing, and rental period with Company staff.
      </p>

      <h4 className="mt-4 font-semibold text-navy">1. Rental Details</h4>
      <div className="mt-1">
        <Field label="Renter name" value={renterName} />
        <Field label="Organization" value={org} />
        <Field label="Phone / Email" value={[phone, email].filter(Boolean).join(" / ")} />
        <Field label="Event name / venue" value={eventName} />
        <Field label="Event address" value={eventAddress} />
        <Field label="Package tier" value={recommendedTier || "Not sure — to be recommended"} />
        <Field
          label="Requested pickup"
          value={[eventDateLabel, eventTimeSlotLabel].filter(Boolean).join(" · ")}
        />
        <Field label="Return due" value={dropoffLabel} />
        <Field label="Guest count" value={guestCount} />
        <Field label="Rental fee / deposit" value="To be confirmed by Studio Melissa Rental staff" />
      </div>
      <p className="mt-2 text-xs text-steel">
        This is a quote request, not a confirmed booking. Specific equipment, pricing, and delivery
        times will be finalized with Company staff before the rental period begins.
      </p>

      <AgreementBody />

      <h4 className="mt-4 font-semibold text-navy">Signatures</h4>
      <p className="mt-1 text-steel">
        By signing below, both parties acknowledge they have read, understood, and agree to be
        bound by the terms of this Agreement.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-paper/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Company</p>
          <p className="mt-1 font-medium text-navy">Studio Melissa Rental, LLC</p>
        </div>
        <div className="rounded-lg border border-line bg-paper/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Renter</p>
          <p className="mt-1 font-medium text-navy">{renterName || "—"}</p>
        </div>
      </div>

      <p className="mt-4 text-xs italic text-steel">
        By uploading your signature and clicking &quot;Sign &amp; request quote&quot; below, you
        acknowledge you have read, understood, and agree to be bound by the terms of this
        Agreement, and that your uploaded signature and printed name constitute your electronic
        signature.
      </p>
    </div>
  );
}
