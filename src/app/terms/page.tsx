// src/app/terms/page.tsx
// Terms of use. Not legal advice: have them reviewed before launch.
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, type LegalSection } from "@/components/marketing/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The rules for using ${SITE.name}.`,
  alternates: { canonical: "/terms" },
};

const sections: LegalSection[] = [
  {
    id: "what",
    title: "What PayLink is (and isn't)",
    body: (
      <>
        <p>
          {SITE.name} is software that helps service providers ask for payment. It creates payment
          links, QR codes and receipts that show customers who they&apos;re paying, what for, how
          much, and the provider&apos;s own bank or CashSend details.
        </p>
        <p>
          <strong>
            {SITE.name} is not a bank, payment service provider or escrow service. We never receive,
            hold or transfer anyone&apos;s money.
          </strong>{" "}
          Payments go directly from the customer&apos;s bank to the provider&apos;s account, under
          the terms of their own banks.
        </p>
      </>
    ),
  },
  {
    id: "accept",
    title: "Agreeing to these terms",
    body: (
      <p>
        By creating an account or using a payment page, you agree to these terms and our{" "}
        <Link href="/privacy">privacy policy</Link>. If you don&apos;t agree, please don&apos;t use{" "}
        {SITE.name}. These terms are between you and {SITE.legalName}.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>You must be 18 or older and able to enter into a contract.</li>
        <li>Sign up with a cellphone number that belongs to you, and give us accurate details.</li>
        <li>
          Keep your PIN secret. You&apos;re responsible for what happens on your account. If you
          think someone knows your PIN, change it in Settings or contact us straight away.
        </li>
        <li>One account per person or business unless we agree otherwise.</li>
      </ul>
    ),
  },
  {
    id: "providers",
    title: "If you're a service provider",
    body: (
      <ul>
        <li>
          Make sure your payout details are correct. Money sent to wrong details you entered
          can&apos;t be recovered by {SITE.name}.
        </li>
        <li>
          Only ask for money you&apos;re genuinely owed, for real goods or services, described
          honestly.
        </li>
        <li>
          Always check that money has arrived in your bank or CashSend before marking a job as
          paid. A customer tapping &ldquo;I&apos;ve sent the money&rdquo; is not proof of payment.
        </li>
        <li>
          You&apos;re responsible for your own work, prices, refunds, guarantees and taxes, and for
          following laws that apply to your trade, including the Consumer Protection Act.
        </li>
        <li>Receipts are generated from the information you enter. Keep them accurate.</li>
      </ul>
    ),
  },
  {
    id: "customers",
    title: "If you're paying",
    body: (
      <ul>
        <li>
          Check the name, description and amount before you pay. Only pay people you&apos;re
          dealing with.
        </li>
        <li>
          Use the reference shown so the provider can match your payment. Bank and CashSend limits,
          fees and timing are set by your bank.
        </li>
        <li>
          Your agreement for the work or goods is with the provider, not with {SITE.name}. Questions
          about the job, refunds or quality go to them.
        </li>
        <li>
          A &ldquo;Verified by PayLink&rdquo; badge means we&apos;ve checked the provider&apos;s
          identity and number by hand. It isn&apos;t a guarantee of their work.
        </li>
      </ul>
    ),
  },
  {
    id: "not-allowed",
    title: "What's not allowed",
    body: (
      <>
        <p>You may not use {SITE.name} to:</p>
        <ul>
          <li>trick, scam or pressure anyone, or pretend to be someone else;</li>
          <li>ask for money for anything illegal, or launder money;</li>
          <li>send links to people who haven&apos;t dealt with you (spam);</li>
          <li>
            try to break into, overload, copy or interfere with {SITE.name} or other people&apos;s
            accounts.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "suspend",
    title: "Suspending or closing accounts",
    body: (
      <p>
        We may suspend or close an account, and switch off its payment links, if we reasonably
        believe these terms have been broken, a customer may be at risk, or the law requires it.
        Where it&apos;s safe to, we&apos;ll tell you why. You can stop using {SITE.name} and ask us
        to close your account at any time.
      </p>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <p>
        {SITE.name} is free during our pilot. If we introduce fees, we&apos;ll give you at least 30
        days&apos; notice, and nothing will be charged unless you agree.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability",
    body: (
      <p>
        We work hard to keep {SITE.name} running, but it may sometimes be unavailable, for example
        during maintenance, network or power outages, or problems with our hosting providers. Keep
        another way to share your payment details for times when it&apos;s down.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          {SITE.name} is provided as it is during the pilot. To the extent the law allows, we
          aren&apos;t responsible for:
        </p>
        <ul>
          <li>disputes between providers and customers about work, goods or payments;</li>
          <li>payments sent to incorrect details, or payments that don&apos;t arrive;</li>
          <li>losses caused by someone else using your PIN;</li>
          <li>indirect losses such as lost business or profit.</li>
        </ul>
        <p>
          Nothing in these terms limits any right you have under the Consumer Protection Act or
          other law that can&apos;t be excluded, or our responsibility for our own gross negligence
          or fraud.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Our name and software",
    body: (
      <p>
        The {SITE.name} name, logo and software belong to us. You may use them only to use the
        service as intended. Content you add (like job descriptions) stays yours; you let us use it
        to run the service.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as {SITE.name} grows. We&apos;ll tell signed-up providers about
        important changes before they take effect. Continuing to use {SITE.name} after that means
        you accept the new terms.
      </p>
    ),
  },
  {
    id: "law",
    title: "Law and contact",
    body: (
      <p>
        These terms are governed by the laws of the Republic of South Africa. Questions or
        complaints: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, or write to us at{" "}
        {SITE.address}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of use"
      intro={
        <p>
          Please read these terms before using {SITE.name}. They&apos;re written in plain language,
          but they&apos;re still a legal agreement.
        </p>
      }
      sections={sections}
    />
  );
}
