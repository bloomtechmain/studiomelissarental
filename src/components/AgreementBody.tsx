// The fixed legal text from Studio_Melissa_Rental_Agreement.docx (sections
// 2-11, plus the intro paragraphs) — identical for every signer, whether
// they're signing at booking checkout or on the public quote-request form.
// Only section 1 (the renter's own details) differs between those two
// callers, so it stays out of this component.
export default function AgreementBody() {
  return (
    <>
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
    </>
  );
}
