// src/app/privacy/page.tsx
// Privacy policy written for POPIA (Protection of Personal Information Act, 2013).
// Not legal advice: have it reviewed before launch, and fill in src/lib/site.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, type LegalSection } from "@/components/marketing/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE.name} collects, uses and protects personal information under POPIA.`,
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          {SITE.name} is operated by <strong>{SITE.legalName.trim()}</strong>
          {!SITE.registrationNumber.startsWith("[") && <> (registration number {SITE.registrationNumber})</>},{" "}
          {SITE.address.trim()}. We are the &ldquo;responsible party&rdquo;
          for the personal information described here.
        </p>
        <p>
          Our Information Officer is {SITE.informationOfficer}. You can reach them at{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <h3>From service providers (people who sign up)</h3>
        <ul>
          <li>Your cellphone number, which is also how you sign in.</li>
          <li>Your PIN, stored only in a scrambled (hashed) form we can&apos;t read back.</li>
          <li>Your name, trade and the short name used in your pay page link.</li>
          <li>
            Your payout details: bank name, account number and account type, and/or your CashSend
            number and bank.
          </li>
          <li>
            The jobs you create: description, amount, reference, status, payment method and
            receipt number.
          </li>
          <li>
            If you turn on alerts, a technical push subscription for your browser (not your
            contacts or location).
          </li>
          <li>Basic security records, like failed sign-in attempts and when you last signed in.</li>
        </ul>
        <h3>From customers (people who pay)</h3>
        <p>
          Customers don&apos;t need an account. When you open a payment page we record only that
          the page was used, and the time you tapped &ldquo;I&apos;ve sent the money&rdquo; if you
          do. We don&apos;t ask for your name, card or bank details. Your payment happens in your
          own banking app, not on {SITE.name}.
        </p>
        <h3>Automatically</h3>
        <p>
          Like any website, our hosting provider keeps short-lived server logs (such as IP address,
          browser type and pages requested) to keep the service running and secure.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "Why we use it",
    body: (
      <ul>
        <li>To create and secure your account and let you sign in.</li>
        <li>
          To show your customers who they&apos;re paying and where to send the money, on payment
          pages you choose to share.
        </li>
        <li>To alert you when a customer says they&apos;ve paid, and to produce receipts.</li>
        <li>To verify providers and protect customers from fraud and misuse.</li>
        <li>To answer you when you contact us, and to tell you about important changes.</li>
        <li>To meet our legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "lawful",
    title: "Our lawful basis",
    body: (
      <p>
        We process your information because it&apos;s needed to provide the service you signed up
        for (performing our agreement with you), because we have a legitimate interest in keeping{" "}
        {SITE.name} safe and working, or because the law requires it. We don&apos;t sell personal
        information and we don&apos;t use it for third-party advertising.
      </p>
    ),
  },
  {
    id: "share",
    title: "Who can see it",
    body: (
      <>
        <ul>
          <li>
            <strong>Your customers</strong> see your name, trade, the job and amount, and the payout
            details needed to pay you (bank account or CashSend number) when you share a link or
            QR code with them. Please only share links with people you&apos;re asking to pay you.
          </li>
          <li>
            <strong>{SITE.name} staff</strong> can see account details to verify providers, help
            with sign-in problems and investigate misuse. Bank account numbers are masked in our
            admin tools.
          </li>
          <li>
            <strong>Service providers we use</strong> to run {SITE.name}: Supabase (database and
            sign-in), Vercel (website hosting) and the push notification services built into your
            browser (Google, Apple or Mozilla). They process information only on our instructions.
          </li>
          <li>
            <strong>Authorities</strong>, if the law requires it, or to protect someone from fraud
            or harm.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "abroad",
    title: "Information stored outside South Africa",
    body: (
      <p>
        Our database and hosting run on servers in the European Union and the United Kingdom. These
        regions have data protection laws that give protection comparable to POPIA, and our
        providers are bound by agreements to keep your information secure, as section 72 of POPIA
        requires.
      </p>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep your account information while your account is open. Job and receipt records are
          kept for up to five years after the job, because providers may need them for tax and
          customers may need proof of payment. Failed sign-in records are cleared once the lockout
          ends.
        </p>
        <p>
          If you ask us to close your account, we&apos;ll delete or anonymise your information
          within 30 days, except records we must keep by law.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <ul>
        <li>All traffic is encrypted (HTTPS).</li>
        <li>PINs are hashed, and accounts lock for 15 minutes after five wrong PINs.</li>
        <li>
          Database rules make sure each provider can only see their own jobs, and customers only
          see the public details of the one payment they&apos;re making.
        </li>
        <li>Changing payout details needs your PIN, and the change is shown on your dashboard.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under POPIA you can:</p>
        <ul>
          <li>ask what personal information we hold about you and get a copy;</li>
          <li>ask us to correct or delete it;</li>
          <li>object to how we process it;</li>
          <li>withdraw consent where we rely on it; and</li>
          <li>complain to the Information Regulator.</li>
        </ul>
        <p>
          Most details you can change yourself in Settings. For anything else, email{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We may need to confirm it&apos;s
          really you before we act.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and storage on your phone",
    body: (
      <p>
        We use only essential cookies to keep you signed in. If you choose, your phone also
        remembers your number on the sign-in screen so you only need to type your PIN. We
        don&apos;t use advertising or tracking cookies.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>{SITE.name} accounts are for people aged 18 and over.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we make important changes, we&apos;ll tell signed-up providers before they take effect.
        The date at the top shows when this policy last changed.
      </p>
    ),
  },
  {
    id: "complaints",
    title: "Complaints",
    body: (
      <>
        <p>
          Please contact us first and we&apos;ll do our best to sort it out. If you&apos;re not
          satisfied, you can complain to the Information Regulator (South Africa):
        </p>
        <ul>
          <li>
            Website:{" "}
            <a href="https://inforegulator.org.za/" target="_blank" rel="noopener noreferrer">
              inforegulator.org.za
            </a>
          </li>
          <li>
            Email: <a href="mailto:enquiries@inforegulator.org.za">enquiries@inforegulator.org.za</a>
          </li>
          <li>Address: Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      intro={
        <p>
          This policy explains what personal information {SITE.name} collects, why, and what you
          can do about it. It applies to service providers who sign up and to customers who open a
          payment page. Also see our <Link href="/terms">terms of use</Link>.
        </p>
      }
      sections={sections}
    />
  );
}
