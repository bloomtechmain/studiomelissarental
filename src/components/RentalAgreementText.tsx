// The actual Studio Melissa Rental agreement text (from
// Studio_Melissa_Rental_Agreement.docx), rendered with the booking's own
// details filled into section 1 instead of blank lines — everything below
// that is the fixed legal text, unchanged.
export default function RentalAgreementText({
  renterName,
  org,
  phone,
  email,
  eventName,
  eventAddress,
  packageOrItemLabel,
  deliveryLabel,
  pickupLabel,
}: {
  renterName: string;
  org?: string;
  phone: string;
  email?: string;
  eventName?: string;
  eventAddress?: string;
  packageOrItemLabel: string;
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
        <Field label="Equipment" value={packageOrItemLabel} />
        <Field label="Delivery" value={deliveryLabel} />
        <Field label="Pickup" value={pickupLabel} />
        <Field label="Rental fee / deposit" value="To be confirmed by Studio Melissa Rental staff" />
      </div>
      <p className="mt-2 text-xs text-steel">
        The specific equipment provided under this rental is listed on the attached Equipment
        Schedule / delivery ticket, which is incorporated into this Agreement by reference.
      </p>

      <h4 className="mt-4 font-semibold text-navy">2. Rental Period &amp; Use</h4>
      <p className="mt-1 text-steel">
        The rental period begins at the delivery/setup time stated above and ends at the agreed
        pickup time. Equipment remains the property of Company at all times. Renter may use the
        Equipment only for the event and location specified above, and only for its intended
        purpose. Renter may not sublease, relocate to a different venue, or allow use by anyone
        other than event staff working under Renter&apos;s direction. Company handles all
        delivery, setup, and pickup for every package tier. Renter or an authorized representative
        must be present at the venue for both delivery and pickup. Extensions to the rental period
        must be requested at least 24 hours before scheduled pickup and are subject to availability
        and additional fees.
      </p>

      <h4 className="mt-4 font-semibold text-navy">3. Fees, Payment &amp; Security Deposit</h4>
      <p className="mt-1 text-steel">
        The rental fee stated above covers the package tier, delivery, setup, and pickup within
        Company&apos;s standard service area. Travel outside the standard service area may incur an
        additional fee, quoted before booking. A non-refundable booking fee of 25% of the rental
        fee is due at signing to reserve the date; the balance is due no later than 3 days before
        the event. A refundable security deposit is due at signing along with the booking fee. The
        deposit is held against damage, loss, or excessive cleaning, and is not applied toward the
        rental fee. The security deposit is returned within 7 business days after pickup, less any
        deductions for damage, loss, or missing items. Late payment of the balance may result in
        cancellation of the booking and forfeiture of the booking fee.
      </p>

      <h4 className="mt-4 font-semibold text-navy">4. Cancellation</h4>
      <p className="mt-1 text-steel">
        Cancellations made 14 or more days before the event: full refund of amounts paid, minus the
        booking fee. Cancellations made 7–13 days before the event: 50% refund of the rental fee
        paid, minus the booking fee; security deposit refunded in full. Cancellations made less than
        7 days before the event: rental fee is non-refundable; security deposit refunded in full. If
        Company is unable to fulfill the booking due to equipment failure or unavailability outside
        Renter&apos;s control, Company will refund all amounts paid or, where possible, offer
        comparable substitute equipment.
      </p>

      <h4 className="mt-4 font-semibold text-navy">5. Condition, Damage &amp; Loss</h4>
      <p className="mt-1 text-steel">
        Renter is responsible for the Equipment from the moment of delivery until Company&apos;s
        pickup is confirmed complete. Renter agrees to use the Equipment only as instructed, and not
        to attempt repairs, modifications, or servicing of any kind. Any damage, malfunction caused
        by misuse, or loss of Equipment during the rental period will be deducted from the security
        deposit at Company&apos;s reasonable repair or replacement cost. Normal wear from ordinary,
        careful use is not charged to Renter. Renter must notify Company immediately of any
        equipment malfunction, damage, or safety issue discovered during the rental period.
      </p>

      <h4 className="mt-4 font-semibold text-navy">6. Renter Responsibilities</h4>
      <p className="mt-1 text-steel">
        Provide Company with accurate venue access details, power availability, and load-in path
        information before delivery. Ensure a stable, appropriate power source is available as
        specified by Company at time of booking. Keep the Equipment in a secure, weather-protected
        location when not actively in use, particularly for outdoor events. Not move, disassemble,
        or adjust system configuration beyond normal operating controls without Company&apos;s
        authorization. Notify Company of any changes in guest count, room, or venue that may affect
        the suitability of the booked package tier.
      </p>

      <h4 className="mt-4 font-semibold text-navy">7. Liability &amp; Indemnification</h4>
      <p className="mt-1 text-steel">
        Company&apos;s equipment is provided in good working order. Renter assumes responsibility
        for the safe and proper use of the Equipment during the rental period, except where damage
        or malfunction results from Company&apos;s negligence or a pre-existing defect. Renter
        agrees to indemnify and hold Company harmless from any claims, damages, or liabilities
        arising from Renter&apos;s use, misuse, or operation of the Equipment, except to the extent
        caused by Company&apos;s negligence. Company&apos;s total liability under this Agreement is
        limited to the total rental fee paid by Renter for the applicable booking.
      </p>

      <h4 className="mt-4 font-semibold text-navy">8. Insurance</h4>
      <p className="mt-1 text-steel">
        For Hall and Field tier bookings, Company may require proof of general liability or event
        insurance naming Company as an additional insured before delivery.
      </p>

      <h4 className="mt-4 font-semibold text-navy">9. Force Majeure</h4>
      <p className="mt-1 text-steel">
        Neither party is liable for delay or failure to perform due to causes beyond reasonable
        control, including severe weather, natural disaster, government order, or venue closure. In
        such cases, the parties will work in good faith to reschedule or issue a prorated refund.
      </p>

      <h4 className="mt-4 font-semibold text-navy">10. Governing Law</h4>
      <p className="mt-1 text-steel">
        This Agreement is governed by the laws of the State of Texas. Any dispute will be resolved
        in the state or federal courts located in the county of Company&apos;s principal place of
        business.
      </p>

      <h4 className="mt-4 font-semibold text-navy">11. Entire Agreement</h4>
      <p className="mt-1 text-steel">
        This Agreement, together with the attached Equipment Schedule, constitutes the entire
        agreement between the parties regarding the rental and supersedes any prior discussions or
        agreements, written or oral. Amendments must be made in writing and signed by both parties.
      </p>

      <p className="mt-4 text-xs italic text-steel">
        By typing your name and clicking &quot;Sign agreement&quot; below, you acknowledge you have
        read, understood, and agree to be bound by the terms of this Agreement, and that your typed
        name constitutes your electronic signature.
      </p>
    </div>
  );
}
