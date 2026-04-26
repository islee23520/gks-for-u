"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useAnimatedCounter(
  target: number,
  opts: { duration?: number; decimals?: number; isActive?: boolean } = {},
) {
  const { duration = 2000, decimals = 0, isActive = true } = opts;
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setValue(0);
      return;
    }
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      const raw = target * eased;
      const factor = Math.pow(10, decimals);
      setValue(Math.round(raw * factor) / factor);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, decimals, isActive]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Slide shell — with gradient background support                     */
/* ------------------------------------------------------------------ */
function SlideShell({
  children,
  gradient = "from-zinc-950 via-zinc-900 to-zinc-950",
  orb,
}: {
  children: React.ReactNode;
  gradient?: string;
  orb?: { color: string; position: string };
}) {
  return (
    <div
      className={`relative flex h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} text-white`}
    >
      {/* Background orb glow */}
      {orb && (
        <div
          className={`pointer-events-none absolute h-[600px] w-[600px] rounded-full opacity-20 blur-[120px] ${orb.color} ${orb.position}`}
        />
      )}
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-8 py-16">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Counter block                                                      */
/* ------------------------------------------------------------------ */
function CounterBlock({
  value,
  label,
  suffix = "",
  color = "text-white",
}: {
  value: number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p
        className={`font-mono text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl ${color}`}
      >
        {Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1)}
        {suffix}
      </p>
      <p className="mt-3 text-sm font-medium tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 1 — Hook                                                     */
/* ------------------------------------------------------------------ */
function SlideHook({ isActive }: { isActive: boolean }) {
  const applicants = useAnimatedCounter(15000, {
    duration: 2200,
    isActive,
  });
  const accepted = useAnimatedCounter(367, { duration: 2200, isActive });
  const rate = useAnimatedCounter(2.4, {
    duration: 2200,
    decimals: 1,
    isActive,
  });

  return (
    <SlideShell
      gradient="from-slate-950 via-blue-950/40 to-slate-950"
      orb={{ color: "bg-blue-600", position: "top-1/4 left-1/2 -translate-x-1/2" }}
    >
      <div className="space-y-12 text-center">
        <p className="font-mono text-sm font-medium uppercase tracking-[0.3em] text-blue-400/60">
          Oh My Scholarship
        </p>
        <div className="flex flex-wrap justify-center gap-10 sm:gap-20">
          <CounterBlock value={applicants} label="applicants / year" />
          <div className="hidden items-center sm:flex">
            <div className="text-4xl text-zinc-600">→</div>
          </div>
          <CounterBlock
            value={accepted}
            label="accepted"
            color="text-blue-400"
          />
          <div className="hidden items-center sm:flex">
            <div className="text-4xl text-zinc-600">=</div>
          </div>
          <CounterBlock
            value={rate}
            label="acceptance rate"
            suffix="%"
            color="text-red-400"
          />
        </div>
        <div className="space-y-4">
          <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Most fail{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              before they even submit.
            </span>
          </h1>
          <p className="text-lg text-zinc-500">
            Global Korea Scholarship — Undergraduate Program
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 2 — Problem 1: Eligibility                                   */
/* ------------------------------------------------------------------ */
const DISQUALIFIERS = [
  { label: "Age > 25", icon: "🎂" },
  { label: "Korean citizen", icon: "🪪" },
  { label: "Has bachelor's", icon: "🎓" },
  { label: "GPA < 80%", icon: "📉" },
  { label: "Criminal record", icon: "⚖️" },
  { label: "Prior scholarship", icon: "🔄" },
  { label: "Wrong country", icon: "🌍" },
  { label: "Withdrew < 3yr", icon: "⏱️" },
  { label: "Health flag", icon: "🏥" },
];

function SlideProblem1() {
  return (
    <SlideShell
      gradient="from-slate-950 via-red-950/20 to-slate-950"
      orb={{ color: "bg-red-600", position: "top-0 right-0" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-red-400">
            Problem 01
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            Eligibility is a{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              minefield
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {DISQUALIFIERS.map((item, i) => (
            <div
              key={item.label}
              className="animate-fade-in-up rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center backdrop-blur-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-lg">{item.icon}</span>
              <p className="mt-1 font-mono text-xs text-red-300">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <p className="text-sm text-zinc-400">
            GPA must normalize to 80% — but every country uses a different
            scale:
          </p>
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-xl font-bold">
            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-blue-400">
              /4.0
            </span>
            <span className="rounded-lg bg-green-500/10 px-3 py-1 text-green-400">
              /4.3
            </span>
            <span className="rounded-lg bg-yellow-500/10 px-3 py-1 text-yellow-400">
              /4.5
            </span>
            <span className="rounded-lg bg-orange-500/10 px-3 py-1 text-orange-400">
              /5.0
            </span>
            <span className="rounded-lg bg-red-500/10 px-3 py-1 text-red-400">
              /100
            </span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            79.5% cannot be rounded up → automatic rejection
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 3 — Problem 2: Track & University Trap                       */
/* ------------------------------------------------------------------ */
function SlideProblem2() {
  return (
    <SlideShell
      gradient="from-slate-950 via-amber-950/20 to-slate-950"
      orb={{ color: "bg-amber-500", position: "bottom-0 left-1/4" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-amber-400">
            Problem 02
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            One wrong click ={" "}
            <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
              disqualified
            </span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <h3 className="font-mono text-lg font-semibold text-blue-400">
                Embassy Track
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> Apply through Korean
                Embassy
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> Choose up to 3
                universities
              </li>
              <li className="flex gap-2 rounded-lg bg-yellow-500/10 px-2 py-1">
                <span className="text-yellow-400">!</span>
                <span className="font-semibold text-yellow-300">
                  Must include at least 1 Type B
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> Embassy → NIIED →
                University
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <h3 className="font-mono text-lg font-semibold text-emerald-400">
                University Track
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> Apply directly to
                university
              </li>
              <li className="flex gap-2 rounded-lg bg-red-500/10 px-2 py-1">
                <span className="text-red-400">!</span>
                <span className="font-semibold text-red-300">
                  1 university, 1 department only
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> Wrong pick = no second
                chance
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600">→</span> University → NIIED
                review
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <p className="font-mono text-sm text-red-300">
            Applying to both tracks = automatic disqualification
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 4 — Problem 3: Document Dropout                              */
/* ------------------------------------------------------------------ */
const TIMELINE = [
  { duration: "3 months", label: "Essay writing", color: "bg-blue-500" },
  {
    duration: "7–8 months",
    label: "Degree certificate wait",
    color: "bg-purple-500",
  },
  {
    duration: "Weeks",
    label: "Apostille & notarization chain",
    color: "bg-amber-500",
  },
];

function SlideProblem3() {
  return (
    <SlideShell
      gradient="from-slate-950 via-purple-950/20 to-slate-950"
      orb={{ color: "bg-purple-600", position: "top-1/3 right-0" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-purple-400">
            Problem 03
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            Document preparation{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              dropout
            </span>
          </h2>
        </div>

        <blockquote className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <p className="text-base italic leading-relaxed text-zinc-200">
            &quot;This process is expensive both in terms of cost and patience,
            and there will be moments when you feel lost, frustrated, or even
            doubt yourself.&quot;
          </p>
          <footer className="mt-3 flex items-center gap-2 text-xs text-zinc-500 not-italic">
            <div className="h-px w-4 bg-purple-500" />
            LKI School of Korean Language
          </footer>
        </blockquote>

        <div className="space-y-1 pl-2">
          {TIMELINE.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-4 w-4 rounded-full ${item.color}`} />
                {i < TIMELINE.length - 1 && (
                  <div className="h-12 w-px bg-gradient-to-b from-zinc-700 to-transparent" />
                )}
              </div>
              <div className="pb-2">
                <p className="font-mono text-xl font-bold text-white">
                  {item.duration}
                </p>
                <p className="text-sm text-zinc-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <blockquote className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-sm">
          <p className="text-sm italic text-zinc-300">
            &quot;Most GKS applicants spend weeks perfecting their personal
            statement and completely overlook the document that Korean professors
            actually read first — the study plan.&quot;
          </p>
          <footer className="mt-2 flex items-center gap-2 text-xs text-zinc-500 not-italic">
            <div className="h-px w-4 bg-amber-500" />
            Scholars Academie
          </footer>
        </blockquote>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 5 — Demo                                                     */
/* ------------------------------------------------------------------ */
const DEMO_FEATURES = [
  {
    icon: "✓",
    title: "Eligibility Check",
    desc: "9 disqualifiers checked in 2 minutes",
    href: "/eligibility",
    color: "from-green-500/20 to-emerald-500/5",
    border: "border-green-500/20 hover:border-green-400/40",
    accent: "text-green-400",
  },
  {
    icon: "◎",
    title: "Dashboard",
    desc: "Progress, rubric score, competitiveness tier",
    href: "/dashboard",
    color: "from-blue-500/20 to-cyan-500/5",
    border: "border-blue-500/20 hover:border-blue-400/40",
    accent: "text-blue-400",
  },
  {
    icon: "✦",
    title: "AI Essay Feedback",
    desc: "Claude-powered rubric scoring & line notes",
    href: "/apply/personal-statement",
    color: "from-purple-500/20 to-pink-500/5",
    border: "border-purple-500/20 hover:border-purple-400/40",
    accent: "text-purple-400",
  },
  {
    icon: "↓",
    title: "PDF / DOCX Export",
    desc: "One-click download of complete application",
    href: "/apply/review",
    color: "from-amber-500/20 to-orange-500/5",
    border: "border-amber-500/20 hover:border-amber-400/40",
    accent: "text-amber-400",
  },
];

function SlideDemo() {
  return (
    <SlideShell
      gradient="from-slate-950 via-cyan-950/20 to-slate-950"
      orb={{ color: "bg-cyan-500", position: "bottom-1/4 left-1/3" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-cyan-400">
            Live Demo
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            See it{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              in action
            </span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              target="_blank"
              className={`group rounded-2xl border bg-gradient-to-br ${f.color} ${f.border} p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
            >
              <p className={`mb-3 text-3xl ${f.accent}`}>{f.icon}</p>
              <h3
                className={`text-lg font-semibold transition-colors ${f.accent}`}
              >
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{f.desc}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-500">
          Click any card to open in a new tab
        </p>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 6 — Why AI                                                   */
/* ------------------------------------------------------------------ */
const AI_ROWS = [
  {
    feature: "Eligibility",
    without: "Read 33-page PDF",
    with: "6 questions → instant",
  },
  {
    feature: "GPA",
    without: "Manual calculation",
    with: "Auto across 5 scales",
  },
  {
    feature: "Essay",
    without: "$300+ consultant",
    with: "AI rubric, unlimited",
  },
  {
    feature: "University",
    without: "68 schools blindly",
    with: "Matched by GPA & quota",
  },
];

function SlideWhyAI() {
  return (
    <SlideShell
      gradient="from-slate-950 via-indigo-950/30 to-slate-950"
      orb={{ color: "bg-indigo-500", position: "top-1/4 left-0" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-indigo-400">
            AI Integration
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            AI makes this{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              possible at scale
            </span>
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
                <th className="px-5 py-4 font-mono text-xs uppercase tracking-wider text-zinc-500">
                  Feature
                </th>
                <th className="px-5 py-4 font-mono text-xs uppercase tracking-wider text-red-400/80">
                  Without AI
                </th>
                <th className="px-5 py-4 font-mono text-xs uppercase tracking-wider text-emerald-400/80">
                  With AI
                </th>
              </tr>
            </thead>
            <tbody>
              {AI_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={
                    i < AI_ROWS.length - 1 ? "border-b border-zinc-800/30" : ""
                  }
                >
                  <td className="px-5 py-4 font-semibold">{row.feature}</td>
                  <td className="px-5 py-4 text-zinc-500">{row.without}</td>
                  <td className="px-5 py-4 text-emerald-300">{row.with}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6 text-center backdrop-blur-sm">
          <p className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
            &quot;Product couldn&apos;t exist without AI&quot;
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Claude analyzes essays against the actual GKS rubric — no human
            consultant can do this at scale for free.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 7 — Business Model                                          */
/* ------------------------------------------------------------------ */
const TIERS = [
  {
    name: "Free",
    price: "$0",
    features: ["Eligibility check", "Track recommendation", "GPA conversion"],
    gradient: "from-zinc-800/50 to-zinc-900/50",
    border: "border-zinc-700/50",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    features: [
      "Unlimited AI feedback",
      "PDF/DOCX auto-fill",
      "University matching",
    ],
    gradient: "from-blue-500/15 to-cyan-500/5",
    border: "border-blue-500/30",
    highlight: true,
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "/mo",
    features: [
      "AI study plan co-writing",
      "Competitiveness benchmark",
      "Priority support",
    ],
    gradient: "from-purple-500/15 to-pink-500/5",
    border: "border-purple-500/30",
  },
];

function SlideBusiness() {
  return (
    <SlideShell
      gradient="from-slate-950 via-emerald-950/15 to-slate-950"
      orb={{ color: "bg-emerald-500", position: "bottom-0 right-1/4" }}
    >
      <div className="space-y-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-emerald-400">
            Business Model
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Freemium +{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              expansion
            </span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border bg-gradient-to-br ${tier.gradient} ${tier.border} p-5 backdrop-blur-sm ${
                tier.highlight ? "ring-1 ring-blue-500/20" : ""
              }`}
            >
              <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                {tier.name}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {tier.price}
                {"period" in tier && (
                  <span className="text-sm font-normal text-zinc-500">
                    {tier.period}
                  </span>
                )}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-zinc-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Market Size
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">TAM</span>
                <span className="font-mono font-bold">400K–500K/yr</span>
              </div>
              <div className="h-px bg-zinc-800/50" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">SAM</span>
                <span className="font-mono font-bold">10K–15K/yr</span>
              </div>
              <div className="h-px bg-zinc-800/50" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">SOM (Y1)</span>
                <span className="font-mono font-bold text-emerald-400">
                  1K–3K
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Unit Economics
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">AI cost</span>
                <span className="font-mono font-bold">~$0.01</span>
              </div>
              <div className="h-px bg-zinc-800/50" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Margin</span>
                <span className="font-mono font-bold text-emerald-400">
                  ~90%+
                </span>
              </div>
              <div className="h-px bg-zinc-800/50" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Replaces</span>
                <span className="font-mono font-bold">$300–$2.4K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 8 — Expansion                                                */
/* ------------------------------------------------------------------ */
const ROADMAP = [
  { name: "GKS", country: "Korea", active: true, emoji: "🇰🇷" },
  { name: "MEXT", country: "Japan", active: false, emoji: "🇯🇵" },
  { name: "CSC", country: "China", active: false, emoji: "🇨🇳" },
  { name: "Chevening", country: "UK", active: false, emoji: "🇬🇧" },
  { name: "DAAD", country: "Germany", active: false, emoji: "🇩🇪" },
];

function SlideExpansion() {
  return (
    <SlideShell
      gradient="from-slate-950 via-blue-950/30 to-slate-950"
      orb={{ color: "bg-blue-500", position: "bottom-1/3 left-1/2 -translate-x-1/2" }}
    >
      <div className="space-y-10 text-center">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-blue-400">
            Expansion
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-5xl">
            Same engine,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              swap the rules
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {ROADMAP.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className={`rounded-2xl border px-6 py-4 text-center backdrop-blur-sm transition-all ${
                  item.active
                    ? "border-blue-500/40 bg-blue-500/15 ring-1 ring-blue-500/20"
                    : "border-zinc-700/50 bg-zinc-900/50"
                }`}
              >
                <p className="text-2xl">{item.emoji}</p>
                <p
                  className={`font-mono text-lg font-bold ${
                    item.active ? "text-blue-400" : "text-zinc-400"
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-xs text-zinc-500">{item.country}</p>
              </div>
              {i < ROADMAP.length - 1 && (
                <div className="hidden w-6 sm:block">
                  <div className="border-t border-dashed border-zinc-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mx-auto max-w-lg text-sm text-zinc-400">
          Every government scholarship has the same problem: complex PDFs,
          eligibility rules, document chains — and zero tooling.
        </p>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: "400K+", label: "applicants/yr" },
            { value: "6.9M", label: "students globally" },
            { value: "$129B", label: "market size" },
            { value: "$0", label: "B2C tools exist" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 backdrop-blur-sm"
            >
              <p className="font-mono text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          GKS-for-U
        </p>
      </div>
    </SlideShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide registry                                                     */
/* ------------------------------------------------------------------ */
const SLIDES = [
  SlideHook,
  SlideProblem1,
  SlideProblem2,
  SlideProblem3,
  SlideDemo,
  SlideWhyAI,
  SlideBusiness,
  SlideExpansion,
];

/* ------------------------------------------------------------------ */
/*  Main pitch page                                                    */
/* ------------------------------------------------------------------ */
export default function PitchPage() {
  const [current, setCurrent] = useState(0);
  const [entering, setEntering] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);

  const navigate = useCallback(
    (dir: "prev" | "next") => {
      if (isAnimating) return;
      const next =
        dir === "next"
          ? Math.min(current + 1, SLIDES.length - 1)
          : Math.max(current - 1, 0);
      if (next === current) return;
      setIsAnimating(true);
      setDirection(dir === "next" ? "right" : "left");
      setEntering(true);
      setCurrent(next);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [current, isAnimating],
  );

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating || idx === current) return;
      setIsAnimating(true);
      setDirection(idx > current ? "right" : "left");
      setEntering(true);
      setCurrent(idx);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [current, isAnimating],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        navigate("next");
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate("prev");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? "next" : "prev");
    }
  };

  useEffect(() => {
    if (entering) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntering(false));
      });
    }
  }, [entering]);

  const SlideComponent = SLIDES[current];

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div
        className="relative h-dvh w-full select-none overflow-hidden bg-slate-950"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={current}
          className={`transition-all duration-300 ease-in-out ${
            entering
              ? direction === "right"
                ? "translate-x-8 opacity-0"
                : "-translate-x-8 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <SlideComponent isActive={current === 0} />
        </div>

        {/* Progress dots */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 p-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-blue-400"
                  : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
          <span className="ml-3 font-mono text-[10px] text-zinc-600">
            {current + 1}/{SLIDES.length}
          </span>
        </div>

        {/* Click zones */}
        <button
          className="fixed left-0 top-0 h-full w-1/5 cursor-w-resize"
          onClick={() => navigate("prev")}
          aria-label="Previous slide"
        />
        <button
          className="fixed right-0 top-0 h-full w-1/5 cursor-e-resize"
          onClick={() => navigate("next")}
          aria-label="Next slide"
        />
      </div>
    </>
  );
}
