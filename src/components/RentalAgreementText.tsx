import AgreementBody from "@/components/AgreementBody";

// The actual Studio Melissa Rental agreement text (from
// Studio_Melissa_Rental_Agreement.docx), rendered with the booking's own
// details filled into section 1 instead of blank lines — everything below
// that is the fixed legal text (AgreementBody), shared with the quote-request
// signing flow (see LeadAgreementText).
export default function RentalAgreementText({
  renterName,
  org,
  phone,
  email,
  eventName,
  eventAddress,
  equipmentLines,
  deliveryLabel,
  pickupLabel,
}: {
  renterName: string;
  org?: string;
  phone: string;
  email?: string;
  eventName?: string;
  eventAddress?: string;
  equipmentLines: string[];
  deliveryLabel: string;
  pickupLabel: string;
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
        By signing below, or by accepting delivery of the Equipment, Renter agrees to be bound by
        the terms of this Agreement in full.
      </p>

      <h4 className="mt-4 font-semibold text-navy">1. Rental Details</h4>
      <div className="mt-1">
        <Field label="Renter name" value={renterName} />
        <Field label="Organization" value={org} />
        <Field label="Phone / Email" value={[phone, email].filter(Boolean).join(" / ")} />
        <Field label="Event name / venue" value={eventName} />
        <Field label="Event address" value={eventAddress} />
        <div className="flex justify-between gap-4 border-b border-line py-1.5 text-sm">
          <span className="text-steel">Equipment</span>
          <span className="text-right font-medium text-navy">
            {equipmentLines.length > 0 ? (
              equipmentLines.map((line, i) => <div key={i}>{line}</div>)
            ) : (
              <>—</>
            )}
          </span>
        </div>
        <Field label="Delivery" value={deliveryLabel} />
        <Field label="Pickup" value={pickupLabel} />
        <Field label="Rental fee / deposit" value="To be confirmed by Studio Melissa Rental staff" />
      </div>
      <p className="mt-2 text-xs text-steel">
        The specific equipment provided under this rental is listed on the attached Equipment
        Schedule / delivery ticket, which is incorporated into this Agreement by reference.
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
        By typing your name and clicking &quot;Sign agreement&quot; below, you acknowledge you have
        read, understood, and agree to be bound by the terms of this Agreement, and that your typed
        name constitutes your electronic signature.
      </p>
    </div>
  );
}
