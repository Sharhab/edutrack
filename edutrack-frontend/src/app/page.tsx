
"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileBarChart,
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const WHATSAPP_LINK = `https://wa.me/2347065602624?text=${encodeURIComponent(
  "Hello EduTrack, I would like to learn how your school management platform can help my school."
)}`;

const features = [
  {
    icon: Users,
    title: "Student Management",
    description:
      "Organise student profiles, parent details, classes, and academic records.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance",
    description:
      "Record attendance and make daily classroom administration easier.",
  },
  {
    icon: GraduationCap,
    title: "Results & Report Cards",
    description:
      "Manage scores, grades, student performance, and report cards.",
  },
  {
    icon: Wallet,
    title: "School Fees",
    description:
      "Track fee payments, outstanding balances, and payment records.",
  },
  {
    icon: CreditCard,
    title: "Payments & Receipts",
    description:
      "Support online fee payments and keep payment records organised.",
  },
  {
    icon: FileBarChart,
    title: "School Reports",
    description:
      "Access academic and administrative information to support decisions.",
  },
  {
    icon: HeartHandshake,
    title: "Parent Portal",
    description:
      "Help parents access relevant school information and updates.",
  },
  {
    icon: Sparkles,
    title: "AI-Assisted Tools",
    description:
      "Explore AI-assisted workflows for tasks such as drafting student comments.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Save time",
    description:
      "Reduce repetitive paperwork and keep everyday school tasks organised.",
  },
  {
    icon: BarChart3,
    title: "Improve visibility",
    description:
      "Find academic and financial information more easily.",
  },
  {
    icon: Users,
    title: "Keep everyone connected",
    description:
      "Support administrators, teachers, parents, and accounts staff.",
  },
];

const steps = [
  {
    number: "01",
    title: "Register your school",
    description:
      "Start online or contact our team for guidance.",
  },
  {
    number: "02",
    title: "Set up your records",
    description:
      "Configure classes, sessions, subjects, students, and fees.",
  },
  {
    number: "03",
    title: "Start managing your school",
    description:
      "Use the available tools to organise school activities and records.",
  },
];

const faqs = [
  {
    question: "What is EduTrack?",
    answer:
      "EduTrack is a school management platform that brings student records, attendance, results, report cards, fees, payments, and parent access together.",
  },
  {
    question: "Who can use EduTrack?",
    answer:
      "School owners, administrators, teachers, accounts staff, and parents can use the relevant features available to their accounts.",
  },
  {
    question: "Can parents pay school fees online?",
    answer:
      "EduTrack supports Paystack school-fee payments where the school's payment setup and required provider verification are complete.",
  },
  {
    question: "How much does it cost?",
    answer:
      "The listed plans are Starter at ₦10,000, Standard at ₦25,000, and Premium at ₦50,000. Contact us to confirm billing periods, plan details, and suitability before subscribing.",
  },
  {
    question: "Can you help us get started?",
    answer:
      "Yes. Register through the website or contact our team on WhatsApp to discuss your school's needs and onboarding questions.",
  },
];

function WhatsAppLink({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-800">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-blue-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              School management made simpler
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Run your school with
              <span className="block text-cyan-700">
                greater clarity.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Manage students, attendance, results, report cards, school fees,
              and parent communication in one organised platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-7 py-4 font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:bg-cyan-800"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>

              <WhatsAppLink className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                Talk to Our Team
              </WhatsAppLink>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-cyan-800 underline underline-offset-4"
              >
                Log in to EduTrack
              </Link>
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
              {[
                "Organised school records",
                "Academic reporting",
                "Fee tracking",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:grid-cols-3 sm:px-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div key={benefit.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    {benefit.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24"
      >
        <SectionHeading
          eyebrow="WHAT YOU CAN DO"
          title="Everything important, in one place"
          description="Spend less time managing scattered records and more time focusing on your school."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-9 text-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-7 py-4 font-bold text-white transition hover:bg-cyan-800"
          >
            Get Started with EduTrack
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <SectionHeading
              eyebrow="WHY EDUTRACK"
              title="Less paperwork. Better organised information."
              description="School administration can be demanding. EduTrack helps bring essential records and workflows together so your team can work with greater clarity."
              align="left"
            />

            <div className="mt-7 space-y-4">
              {[
                "Find student information more easily.",
                "Organise attendance and academic records.",
                "Track fees, payments, and outstanding balances.",
                "Give parents access to relevant school information.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-cyan-800 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-950">
              Built around school needs
            </h3>

            <p className="mt-3 leading-7 text-slate-600">
              From administrators managing school operations to teachers
              recording results and parents checking updates, EduTrack brings
              relevant workflows into one platform.
            </p>

            <Link
              href="/onboarding"
              className="mt-7 inline-flex items-center gap-2 font-bold text-cyan-800 hover:text-cyan-950"
            >
              Explore getting started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24"
      >
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="Get started in three steps"
          description="Start with your school's needs and build from there."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 font-black text-cyan-900">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="pricing"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionHeading
            eyebrow="PRICING"
            title="Choose a plan for your school"
            description="Compare the existing plans and contact us to confirm billing terms and the features included."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Starter"
              price="₦10,000"
              description="For schools getting started with digital management."
              features={[
                "Basic features",
                "Up to 200 students",
                "Email support",
              ]}
            />

            <PricingCard
              name="Standard"
              price="₦25,000"
              description="For schools needing a wider range of core features."
              features={[
                "All core features",
                "Up to 1,000 students",
                "Priority support",
              ]}
              highlighted
            />

            <PricingCard
              name="Premium"
              price="₦50,000"
              description="For schools requiring a higher student capacity."
              features={[
                "Unlimited students",
                "Advanced analytics",
                "Dedicated support",
              ]}
            />
          </div>

          <p className="mt-6 text-center text-sm leading-6 text-slate-500">
            Confirm the billing period, limits, and plan details with our team
            before subscribing.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions before you start?"
          description="Here are a few things schools commonly want to know."
        />

        <div className="mt-9 space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" />
              </summary>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-cyan-800 to-blue-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              Ready to organise your school's work?
            </h2>
            <p className="mt-3 leading-7 text-cyan-50">
              Start online or talk to our team about your school's needs.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-cyan-900 transition hover:bg-cyan-50"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>

            <WhatsAppLink className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-4 font-bold text-white transition hover:bg-white/10">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Support
            </WhatsAppLink>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 font-black text-white">
            ET
          </div>
          <div>
            <span className="block text-lg font-black text-slate-950">
              EduTrack
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              School management made simpler
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <a href="#features" className="text-sm text-slate-600 hover:text-cyan-800">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-cyan-800">
            How It Works
          </a>
          <a href="#pricing" className="text-sm text-slate-600 hover:text-cyan-800">
            Pricing
          </a>
          <a href="#faq" className="text-sm text-slate-600 hover:text-cyan-800">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Start
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function DashboardPreview() {
  const items = [
    { icon: Users, title: "Student records", detail: "Student information" },
    { icon: BookOpen, title: "Academic results", detail: "Scores and report cards" },
    { icon: Wallet, title: "Fee management", detail: "Payments and balances" },
    { icon: HeartHandshake, title: "Parent portal", detail: "Relevant school updates" },
  ];

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
            <School className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950">School Overview</h2>
            <p className="text-sm text-slate-500">
              Your essential workflows, organised
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <Users className="h-5 w-5 text-cyan-800" />
            <p className="mt-3 text-sm text-slate-600">Student records</p>
            <p className="mt-1 font-bold text-slate-950">Organised</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <BarChart3 className="h-5 w-5 text-blue-800" />
            <p className="mt-3 text-sm text-slate-600">School workflows</p>
            <p className="mt-1 font-bold text-slate-950">Connected</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-cyan-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.detail}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Illustrative preview, not live school data.
        </p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-bold uppercase tracking-widest text-cyan-800">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 ${
        highlighted
          ? "border-cyan-500 bg-cyan-50/70 shadow-lg shadow-cyan-900/5"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {highlighted && (
        <span className="mb-4 w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-900">
          Popular choice
        </span>
      )}

      <h3 className="text-xl font-bold text-slate-950">{name}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
        {description}
      </p>

      <p className="mt-5 text-4xl font-black tracking-tight text-slate-950">
        {price}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Confirm billing period with our team
      </p>

      <div className="my-6 border-t border-slate-200" />

      <ul className="flex-1 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span className="leading-6 text-slate-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/onboarding"
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold transition ${
          highlighted
            ? "bg-cyan-700 text-white hover:bg-cyan-800"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        }`}
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </Link>

      <WhatsAppLink className="mt-4 text-center text-sm font-semibold text-cyan-800 hover:text-cyan-950">
        Ask about this plan
      </WhatsAppLink>
    </article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 font-black text-white">
                ET
              </div>
              <span className="text-xl font-black text-slate-950">
                EduTrack
              </span>
            </Link>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Helping schools organise student records, academic reporting,
              fees, and parent access in one platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">Quick links</h3>
            <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600">
              <Link href="/onboarding" className="hover:text-cyan-800">
                Get Started
              </Link>
              <Link href="/login" className="hover:text-cyan-800">
                Login
              </Link>
              <a href="#features" className="hover:text-cyan-800">
                Features
              </a>
              <a href="#pricing" className="hover:text-cyan-800">
                Pricing
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">Need help?</h3>
            <p className="mt-3 text-sm text-slate-600">
              WhatsApp support
            </p>
            <WhatsAppLink className="mt-2 inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800">
              <MessageCircle className="h-5 w-5" />
              +234 706 560 2624
            </WhatsAppLink>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
          © {new Date().getFullYear()} EduTrack. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
