// Public legal pages — Terms of Use and Privacy Policy. Branded shell (landing
// nav + footer) with a simple sectioned layout. The body copy is a concise,
// generic scaffold for the platform and should be reviewed/finalized by legal.
import { useEffect } from "react";
import { ScrollText, ShieldCheck } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

function LegalPage({ icon: Icon, title, updated, intro, sections }) {
  // Land at the top when navigating in from a same-page link.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="font-montserrat">
      <LandingNav />
      <main>
        {/* Branded header */}
        <section className="relative overflow-hidden bg-brand-gradient text-brand-foreground">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container relative py-16 sm:py-20">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Icon className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-white/80">Last updated: {updated}</p>
          </div>
        </section>

        {/* Body */}
        <section className="py-16 sm:py-20">
          <div className="container max-w-3xl">
            <p className="text-muted-foreground">{intro}</p>
            <div className="mt-10 space-y-8">
              {sections.map((s, i) => (
                <div key={s.heading}>
                  <h2 className="font-display text-lg font-semibold">
                    {i + 1}. {s.heading}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-12 text-sm text-muted-foreground">
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:support@isourceplus.net"
                className="font-medium text-brand hover:underline"
              >
                support@isourceplus.net
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

const LAST_UPDATED = "1 November 2026";

export function TermsPage() {
  return (
    <LegalPage
      icon={ScrollText}
      title="Terms of Use"
      updated={LAST_UPDATED}
      intro="These Terms of Use govern your access to and use of the iSourcePlus platform. By creating an account or using the platform, you agree to these terms."
      sections={[
        {
          heading: "Acceptance of terms",
          body: "By accessing or using iSourcePlus, you confirm that you have read, understood and agreed to be bound by these terms and any policies referenced here.",
        },
        {
          heading: "Eligibility and accounts",
          body: "You must register a valid business and complete our onboarding checks, including Tax Identification Number (TIN) verification. TIN verification provides a first layer of due diligence only; you remain responsible for your own further diligence on counterparties.",
        },
        {
          heading: "Use of the platform",
          body: "iSourcePlus connects buyers, suppliers and cargo transporters to source, transact and pay. You are responsible for the accuracy of the documents, quotations, orders and invoices you create and for keeping your account credentials secure.",
        },
        {
          heading: "Transactions, invoicing and escrow",
          body: "Purchase orders, invoices, waybills and payment documents you generate are your legal instruments. Where escrow is used, funds are held and released in line with the escrow terms accepted for that transaction, including the Goods Received Note and dispute process.",
        },
        {
          heading: "Tax and compliance",
          body: "The platform is integrated with GRA E-VAT to help you issue VAT invoices, and also supports NON-VAT invoicing where applicable. You are responsible for the correctness of your tax status and the invoices you issue.",
        },
        {
          heading: "Fees and subscriptions",
          body: "Access to certain features depends on your subscription package. Fees, package benefits and renewal terms are as displayed at the point of purchase.",
        },
        {
          heading: "Prohibited conduct",
          body: "You may not misuse the platform, misrepresent your identity or business, upload unlawful content, or attempt to circumvent security, verification or payment controls.",
        },
        {
          heading: "Disclaimers and liability",
          body: "The platform is provided on an “as is” basis. To the maximum extent permitted by law, iSourcePlus is not liable for losses arising from your transactions with other users or from your failure to carry out your own due diligence.",
        },
        {
          heading: "Termination",
          body: "We may suspend or terminate access for breach of these terms or applicable law. You may close your account at any time, subject to settling outstanding obligations.",
        },
        {
          heading: "Governing law",
          body: "These terms are governed by the laws of the Republic of Ghana, and disputes are subject to the jurisdiction of the Ghanaian courts.",
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy Policy"
      updated={LAST_UPDATED}
      intro="This Privacy Policy explains how iSourcePlus collects, uses, protects and shares your information when you use the platform. We are committed to 100% data-protection compliance."
      sections={[
        {
          heading: "Information we collect",
          body: "We collect account and business details (including your TIN and verification documents), transactional data (RFx, quotations, orders, invoices, waybills and payments), and technical data such as device and usage information.",
        },
        {
          heading: "How we use your information",
          body: "We use your information to verify your business, operate the sourcing and payment workflow, file VAT on your behalf where applicable, provide support, and keep the platform secure and compliant.",
        },
        {
          heading: "Data protection and security",
          body: "Your transactional data is secured, auditable and highly retentive. We apply organisational and technical safeguards to protect it against unauthorised access, alteration or loss.",
        },
        {
          heading: "Sharing and disclosure",
          body: "We share information with the counterparties you transact with (buyers, suppliers, cargo transporters), with regulators such as the GRA where required for e-VAT, and with service providers who help us operate the platform. We do not sell your personal data.",
        },
        {
          heading: "Data retention",
          body: "We retain transactional records for as long as needed to provide the service, support auditability, and meet legal and regulatory obligations.",
        },
        {
          heading: "Your rights",
          body: "Subject to the Data Protection Act, 2012 (Act 843), you may request access to, correction of, or deletion of your personal data, and object to certain processing, by contacting us.",
        },
        {
          heading: "Cookies",
          body: "We use essential cookies to keep you signed in and to operate the platform. You can control non-essential cookies through your browser settings.",
        },
        {
          heading: "Changes to this policy",
          body: "We may update this policy from time to time. Material changes will be reflected by the “last updated” date above.",
        },
      ]}
    />
  );
}
