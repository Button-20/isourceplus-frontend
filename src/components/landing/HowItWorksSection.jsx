// Mirrors the 6-step flow from the original Timeline component.
const steps = [
  {
    title: "Register",
    description:
      "Create your buyer or supplier account and verify your business with the Ghana Card.",
  },
  {
    title: "Post & Upload",
    description:
      "Publish RFQs, tenders, or your product catalog in minutes.",
  },
  {
    title: "Review & Choose",
    description:
      "Compare competitive offers side by side and select the best value.",
  },
  {
    title: "Confirm & Order",
    description:
      "Issue purchase orders and agree terms with a single click.",
  },
  {
    title: "Pay & Document",
    description:
      "Settle securely and auto-generate invoices and waybills.",
  },
  {
    title: "Finish & Review",
    description: "Close the deal and rate your trading partner.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-muted/40 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From request to receipt in six simple steps
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient font-display text-lg font-bold text-brand-foreground">
                {i + 1}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
