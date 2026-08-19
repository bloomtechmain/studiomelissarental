import NewLeadForm from "./NewLeadForm";

export default function NewLeadPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New lead</h1>
      <p className="mt-1 text-sm text-steel">For a phone or email inquiry that didn&apos;t come through the website.</p>
      <NewLeadForm />
    </div>
  );
}
