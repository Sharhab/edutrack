
"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  FileBarChart,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  ClipboardCheck,
  UserRoundCheck,
  Zap,
} from "lucide-react";

const WHATSAPP_NUMBER = "2347065602624";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello EduTrack team. I would like to learn how EduTrack can help my school."
)}`;

const features = [
  {
    icon: Users,
    title: "Student & Parent Records",
    description:
      "Keep student information, guardian details, class assignments, and academic history organised in one place.",
    benefit: "Spend less time searching through files.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Management",
    description:
      "Record student attendance and help school administrators and teachers keep track of attendance records.",
    benefit: "Make daily attendance easier to manage.",
  },
  {
    icon: GraduationCap,
    title: "Results & Report Cards",
    description:
      "Manage assessment scores, subject results, grades, performance summaries, and school report cards.",
    benefit: "Reduce repetitive end-of-term work.",
  },
  {
    icon: Wallet,
    title: "Fees & Payment Tracking",
    description:
      "Manage school fees, record payments, monitor outstanding balances, and support online fee payments.",
    benefit: "Know what has been paid and what remains.",
  },
  {
    icon: FileBarChart,
    title: "Receipts & Financial Records",
    description:
      "Keep payment records organised and generate receipts to make financial administration clearer.",
    benefit: "Improve record keeping and reconciliation.",
  },
  {
    icon: BarChart3,
    title: "School Reports & Insights",
    description:
      "Bring important academic and administrative information together to support better decisions.",
    benefit: "Understand school performance more clearly.",
  },
  {
    icon: HeartHandshake,
    title: "Parent Portal",
    description:
      "Give parents access to relevant information about their children, including results, announcements, and fee records.",
    benefit: "Help families stay informed.",
  },
  {
    icon: Sparkles,
    title: "AI-Assisted Workflows",
    description:
      "Explore AI-assisted tools for tasks such as drafting student performance comments and reducing repetitive work.",
    benefit: "Spend more time on people, less on paperwork.",
  },
];

const roles = [
  {
    title: "School Owners & Administrators",
    icon: School,
    description:
      "Bring essential school records together, manage school operations, and get a clearer view of what is happening.",
    points: [
      "Organised student and staff records",
      "School-level information and reports",
      "Academic and administrative oversight",
    ],
  },
  {
    title: "Teachers",
    icon: BookOpen,
    description:
      "Manage classroom responsibilities and academic records without relying entirely on scattered paper files.",
    points: [
      "Attendance and class workflows",
      "Assessment and result entry",
      "Support for end-of-term reporting",
    ],
  },
  {
    title: "Bursars & Accounts Staff",
    icon: CreditCard,
    description:
      "Keep fee records, payments, receipts, and outstanding balances easier to follow.",
    points: [
      "Fee and payment tracking",
      "Payment history and receipts",
      "Clearer outstanding-balance records",
    ],
  },
  {
    title: "Parents & Guardians",
    icon: UserRoundCheck,
    description:
      "Access relevant school information through the parent portal instead of depending on paper updates alone.",
    points: [
      "Access to children's school information",
      "Results and academic updates",
      "Fee information and payment receipts",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us about your school",
    description:
      "Start through onboarding or speak with our team on WhatsApp. Tell us your school name and what you need help managing.",
  },
  {
    number: "02",
    title: "Set up your school",
    description:
      "Configure your school profile, academic session, term, classes, subjects, and other relevant settings.",
  },
  {
    number: "03",
    title: "Organise your records",
    description:
      "Set up student and staff accounts, academic information, fee structures, and the workflows your school needs.",
  },
  {
    number: "04",
    title: "Start using EduTrack",
    description:
      "Use the relevant dashboards and modules to manage school activities, review records, and support your daily operations.",
  },
];

const faqs = [
  {
    question: "What is EduTrack?",
    answer:
      "EduTrack is a school management platform designed to bring important school activities—including student records, attendance, results, report cards, fees, payments, and parent access—into one organised system.",
  },
  {
    question: "Is EduTrack suitable for schools in Nigeria?",
    answer:
      "EduTrack is being presented for schools in Nigeria and beyond, with naira-denominated pricing and school fee payment workflows. Contact us to discuss your school's particular requirements.",
  },
  {
    question: "Do I need technical knowledge to get started?",
    answer:
      "You do not need to be a software developer to discuss getting started. Begin with onboarding or contact our team on WhatsApp so we can guide you through the setup process.",
  },
  {
    question: "Can parents access their children's information?",
    answer:
      "EduTrack includes a parent portal for relevant student information, including academic results, announcements, and fee records, subject to account access and the school's configuration.",
  },
  {
    question: "Can parents pay school fees online?",
    answer:
      "EduTrack includes Paystack integration for supported online school-fee payments. Payment availability depends on the school's configuration and completion of any required payment-provider verification.",
  },
  {
    question: "How much does EduTrack cost?",
    answer:
      "The current plans shown on this page are Starter at ₦10,000, Standard at ₦25,000, and Premium at ₦50,000. Contact us to confirm the billing period, student limits, included services, and the best plan for your school before subscribing.",
  },
  {
    question: "Can you help us set up our school?",
    answer:
      "Yes. Contact our team to discuss your school structure, current records, staff needs, and onboarding questions. We can explain the next steps based on your requirements.",
  },
  {
    question: "How can I contact EduTrack?",
    answer:
      "You can reach our support team on WhatsApp at +234 706 560 2624. You can also start through the website onboarding page or sign in if your school already has an account.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-64 left-1/2 h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[700px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <Header />

      <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pb-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2 text-sm text-cyan-200">
            <Sparkles className="h-4 w-4" />
            A more organised way to manage your school
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
            Spend less time on paperwork.
            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Focus more on education.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Student records, attendance, examinations, report cards, school
            fees, receipts, and parent access—all brought together in EduTrack
            to help your school work in a more organised way.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-bold"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              Talk to Us on WhatsApp
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              One connected platform
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Built around school workflows
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Phone and computer access
            </span>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-cyan-300 underline-offset-4 hover:underline"
            >
              Sign in here
            </Link>
            .
          </p>
        </div>

        <DashboardPreview />
      </section>

      <section className="relative z-10 border-y border-white/[0.08] bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <ValuePoint
            icon={<LayoutDashboard className="h-5 w-5" />}
            title="Organised information"
            description="Keep important school records easier to access."
          />
          <ValuePoint
            icon={<Clock3 className="h-5 w-5" />}
            title="Less repetitive work"
            description="Reduce duplicated effort across everyday tasks."
          />
          <ValuePoint
            icon={<Wallet className="h-5 w-5" />}
            title="Clearer fee records"
            description="Track payments, receipts, and outstanding balances."
          />
          <ValuePoint
            icon={<Users className="h-5 w-5" />}
            title="Connected school roles"
            description="Support administrators, teachers, and parents."
          />
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="ONE PLATFORM, MANY SOLUTIONS"
          title="The tools your school needs to stay organised"
          description="Instead of relying on disconnected files and manual processes for every task, bring essential school information into one place."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.055]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/15">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold">{feature.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4 text-sm font-medium text-cyan-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{feature.benefit}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/onboarding"
            className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold"
          >
            Explore EduTrack for Your School
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/[0.08] bg-gradient-to-b from-cyan-500/[0.055] to-transparent">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-28">
          <div>
            <SectionHeading
              eyebrow="THE CHALLENGE"
              title="Your school deserves better than scattered records."
              description="When important information is spread across registers, spreadsheets, notebooks, and separate conversations, everyday administration becomes harder to coordinate."
              align="left"
            />

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "Searching for student information",
                  text: "Bring student and guardian records into an organised system.",
                },
                {
                  title: "Recalculating results at the end of term",
                  text: "Manage assessment records and support report-card preparation.",
                },
                {
                  title: "Unclear outstanding school fees",
                  text: "Review fee balances, payment history, and recorded receipts.",
                },
                {
                  title: "Parents waiting for school updates",
                  text: "Give parents a dedicated portal for relevant school information.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-xl border border-white/[0.08] bg-slate-950/60 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300">
                  The EduTrack approach
                </p>
                <h3 className="text-xl font-bold">Make school work clearer</h3>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              {[
                [
                  "One organised workflow",
                  "Keep important academic and administrative tasks connected.",
                ],
                [
                  "More informed decisions",
                  "Use accessible records and reports to understand what needs attention.",
                ],
                [
                  "Clearer accountability",
                  "Maintain payment histories, student records, and relevant reports.",
                ],
                [
                  "Better access for families",
                  "Give parents a dedicated way to view relevant information.",
                ],
              ].map(([title, description], index) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-200">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/onboarding"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-50"
            >
              Start Your School Setup
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="who-its-for"
        className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="DESIGNED AROUND YOUR TEAM"
          title="Value for everyone involved in running a school"
          description="Different people have different responsibilities. EduTrack brings their relevant school workflows into a connected platform."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <article
                key={role.title}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{role.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {role.description}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {role.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/[0.08] bg-white/[0.025]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="A CLEAR PATH TO GETTING STARTED"
            title="From your first conversation to everyday use"
            description="You do not have to figure everything out alone. Start with your school's needs and take the setup process one step at a time."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="relative rounded-2xl border border-white/10 bg-slate-950/80 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-cyan-300/70">
                    {step.number}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden h-5 w-5 text-slate-600 lg:block" />
                  )}
                </div>

                <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-4 font-bold"
            >
              Begin Onboarding
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-4 font-semibold transition hover:bg-white/5"
            >
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              Ask a Question First
            </a>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="SIMPLE PLAN OPTIONS"
          title="Choose a starting point for your school"
          description="Compare the current plan options below. Contact our team to confirm billing terms, included features, and which option best matches your school's size and needs."
        />

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="₦10,000"
            description="For schools looking to organise essential school records."
            features={[
              "Basic school management features",
              "Up to 200 students",
              "Email support",
            ]}
          />

          <PricingCard
            name="Standard"
            price="₦25,000"
            description="For schools that need a broader set of core workflows."
            highlighted
            features={[
              "All core features",
              "Up to 1,000 students",
              "Priority support",
            ]}
          />

          <PricingCard
            name="Premium"
            price="₦50,000"
            description="For schools looking for the highest listed student capacity."
            features={[
              "Unlimited students",
              "Advanced analytics",
              "Dedicated support",
            ]}
          />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-slate-500">
          Please confirm the billing period, plan limits, and support terms
          with EduTrack before making a payment. Plan availability and features
          may depend on your school's configuration.
        </p>

        <div className="mt-10 text-center">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Need help choosing a plan?
            Chat with our team
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/[0.08] bg-gradient-to-r from-cyan-500/[0.07] via-blue-500/[0.05] to-violet-500/[0.07]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              Questions? We can help.
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Not sure if EduTrack is right for your school?
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-slate-300">
              Tell us about your school's current challenges. Whether you need
              better student records, simpler result preparation, clearer fee
              tracking, or parent access, we can help you understand the
              available options before you decide.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-slate-400">EduTrack WhatsApp Support</p>
                <p className="mt-1 text-xl font-bold">+234 706 560 2624</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-400">
              Ask about features, onboarding, plan options, or how to get your
              school started.
            </p>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <MessageCircle className="h-5 w-5" />
              Chat with EduTrack on WhatsApp
              <ArrowUpRight className="h-5 w-5" />
            </a>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              No pressure to choose a plan before asking your questions.
            </p>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative z-10 mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="FREQUENTLY ASKED QUESTIONS"
          title="Get the answers you need before you decide"
          description="Understand how EduTrack works, what the plans offer, and how to take the next step."
        />

        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 open:border-cyan-400/25 open:bg-white/[0.045]"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 pr-6 text-sm leading-7 text-slate-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate-400">
            Still have a question about your school?
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-cyan-300 hover:text-cyan-200"
          >
            <CircleHelp className="h-5 w-5" />
            Ask us on WhatsApp
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-violet-500/15 px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%)]"
          />

          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <GraduationCap className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">
              Give your school a more organised way to move forward.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
              Take the first step towards better organised student records,
              academic reporting, fee management, and parent access with
              EduTrack.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 font-bold"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/5"
              >
                Existing User Login
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Prefer to speak to someone first?{" "}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cyan-200 underline underline-offset-4 hover:text-white"
              >
                Chat with us on WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="relative z-20 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 font-black text-slate-950 shadow-lg shadow-cyan-500/10">
            ET
          </div>
          <div>
            <span className="block text-lg font-black tracking-tight">
              EduTrack
            </span>
            <span className="hidden text-xs text-slate-400 sm:block">
              School management, made clearer
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <a
            href="#features"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </a>
          <a
            href="#who-its-for"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Who It's For
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            FAQs
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:px-4"
          >
            Login
          </Link>
          <Link
            href="/onboarding"
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold sm:gap-2 sm:px-5"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Start</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function DashboardPreview() {
  const stats = [
    { label: "Student records", icon: Users },
    { label: "Academic results", icon: BookOpen },
    { label: "Fee management", icon: Wallet },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-violet-500/10 blur-2xl" />

      <div className="relative rounded-3xl border border-white/15 bg-slate-900/90 p-3 shadow-2xl shadow-black/40 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-2 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 text-slate-950">
              <School className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">School Overview</p>
              <p className="text-xs text-slate-400">EduTrack dashboard preview</p>
            </div>
          </div>
          <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
            Overview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Users className="h-5 w-5 text-cyan-300" />
            <p className="mt-4 text-sm text-slate-400">Student records</p>
            <p className="mt-1 text-lg font-bold">Organised</p>
            <p className="mt-1 text-xs text-slate-500">
              Student information
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <ClipboardCheck className="h-5 w-5 text-violet-300" />
            <p className="mt-4 text-sm text-slate-400">Academic work</p>
            <p className="mt-1 text-lg font-bold">Connected</p>
            <p className="mt-1 text-xs text-slate-500">
              Results and attendance
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">School operations</p>
              <p className="mt-1 text-xs text-slate-400">
                Important workflows in one place
              </p>
            </div>
            <LayoutDashboard className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="mt-5 space-y-3">
            {stats.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-slate-950/70 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm text-slate-200">
                    {item.label}
                  </span>
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      index === 1 ? "text-violet-300" : "text-cyan-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
          <div>
            <p className="text-sm font-semibold">Access designed around roles</p>
            <p className="mt-1 text-xs leading-6 text-slate-400">
              Support the relevant workflows for school administrators,
              teachers, and parents.
            </p>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-500">
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
    <div
      className={`max-w-3xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-sm">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-slate-400">{description}</p>
    </div>
  );
}

function ValuePoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
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
      className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-8 ${
        highlighted
          ? "border-cyan-400/50 bg-gradient-to-b from-cyan-400/[0.11] to-slate-900/80 shadow-xl shadow-cyan-950/20"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      {highlighted && (
        <span className="absolute right-5 top-5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
          Popular choice
        </span>
      )}

      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-400">
        {description}
      </p>

      <p className="mt-6 text-4xl font-black tracking-tight">{price}</p>
      <p className="mt-2 text-xs text-slate-500">
        Confirm billing period with our team
      </p>

      <div className="my-6 border-t border-white/10" />

      <p className="text-sm font-semibold text-slate-200">
        Plan highlights
      </p>

      <ul className="mt-4 flex-1 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <span className="leading-6 text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/onboarding"
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-center font-bold transition ${
          highlighted
            ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            : "border border-white/15 bg-white/[0.05] text-white hover:bg-white/10"
        }`}
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </Link>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-center text-sm font-medium text-slate-400 transition hover:text-cyan-200"
      >
        Ask about this plan
      </a>
    </article>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 font-black text-slate-950">
                ET
              </div>
              <span className="text-xl font-black">EduTrack</span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              A school management platform bringing student records,
              attendance, results, fees, reporting, and parent access into a
              more organised workflow.
            </p>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp: +234 706 560 2624
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <a className="block transition hover:text-white" href="#features">
                Features
              </a>
              <a
                className="block transition hover:text-white"
                href="#who-its-for"
              >
                Who It's For
              </a>
              <a
                className="block transition hover:text-white"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a className="block transition hover:text-white" href="#pricing">
                Pricing
              </a>
              <a className="block transition hover:text-white" href="#faq">
                FAQs
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Your Account</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <Link
                className="block transition hover:text-white"
                href="/onboarding"
              >
                Get Started
              </Link>
              <Link
                className="block transition hover:text-white"
                href="/login"
              >
                Login
              </Link>
              <a
                className="block transition hover:text-white"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EduTrack. All rights reserved.
          </p>
          <p>Helping schools organise the work that matters.</p>
        </div>
      </div>
    </footer>
  );
}
