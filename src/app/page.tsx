"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ViewMode = "home" | "business";

type Question = {
  id: string;
  prompt: string;
  helper: string;
  answers: { id: string; label: string; tone?: string }[];
};

type BusinessUser = {
  id: string;
  name: string;
  email: string;
};

type LeadRating = "Bronze" | "Silver" | "Gold" | "Platinum";

type AnalyticsSummary = {
  totalLeads: number;
  bookedConsults: number;
  averageOrderValue: number;
  urgentLeads: number;
  averageUrgentLeadValue: number;
  breakdowns: {
    goals: Array<{ label: string; count: number }>;
    urgency: Array<{ label: string; count: number }>;
    budgets: Array<{ label: string; count: number }>;
    areas: Array<{ label: string; count: number }>;
    ratings: Array<{ label: string; count: number }>;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    createdAt: string;
    goal: string;
    postcode: string;
    responses: Record<string, string>;
    estimatedValue: number | null;
    rating: LeadRating;
  }>;
};

const questions: Question[] = [
  {
    id: "goal",
    prompt: "What are you looking to improve?",
    helper: "Choose the main reason for getting in touch.",
    answers: [
      { id: "windows", label: "Windows" },
      { id: "doors", label: "Doors" },
      { id: "both", label: "Both" },
      { id: "conservatory", label: "Conservatory / extension" },
    ],
  },
  {
    id: "issue",
    prompt: "What is the biggest issue right now?",
    helper: "This helps us tailor the right product and approach.",
    answers: [
      { id: "drafts", label: "Drafts / heat loss" },
      { id: "security", label: "Security / break-ins" },
      { id: "appearance", label: "Looks / outdated style" },
      { id: "noise", label: "Noise / sound insulation" },
    ],
  },
  {
    id: "urgency",
    prompt: "How quickly do you need this sorted?",
    helper: "We’ll match your schedule and lead time.",
    answers: [
      { id: "asap", label: "Urgent - ASAP" },
      { id: "months", label: "Within 1-3 months" },
      { id: "exploring", label: "Just researching" },
    ],
  },
  {
    id: "property",
    prompt: "What type of property do you have?",
    helper: "This helps recommend the best fit for your home.",
    answers: [
      { id: "house", label: "House" },
      { id: "bungalow", label: "Bungalow" },
      { id: "flat", label: "Flat / apartment" },
      { id: "commercial", label: "Commercial property" },
    ],
  },
  {
    id: "area",
    prompt: "Which area are you based in?",
    helper: "We’ll check local coverage and stock availability.",
    answers: [
      { id: "north", label: "North of England" },
      { id: "midlands", label: "Midlands" },
      { id: "south", label: "South of England" },
      { id: "online", label: "Not sure yet" },
    ],
  },
  {
    id: "budget",
    prompt: "What budget are you working with?",
    helper: "This helps us suggest the best value route.",
    answers: [
      { id: "low", label: "Under £3k" },
      { id: "mid", label: "£3k - £8k" },
      { id: "high", label: "£8k - £15k" },
      { id: "premium", label: "£15k+" },
    ],
  },
  {
    id: "consultation",
    prompt: "Would you like to book a consultation?",
    helper: "A quick consultation helps us confirm the best next step for your home improvement project.",
    answers: [
      { id: "yes", label: "Yes, book a consultation" },
      { id: "no", label: "No thanks, just show my recommendation" },
    ],
  },
];

const leadSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(8, "Please enter a valid phone number."),
  postcode: z.string().min(4, "Please enter your postcode."),
  notes: z.string().max(500).optional(),
});

type LeadValues = z.infer<typeof leadSchema>;

function getRecommendation(responses: Record<string, string>) {
  if (responses.goal === "Both" || responses.goal === "Windows") {
    return "Full Home Upgrade Package";
  }

  if (responses.goal === "Doors") {
    return "Secure Entry Upgrade";
  }

  if (responses.goal === "Conservatory / extension") {
    return "Conservatory Refurbishment";
  }

  return "Bespoke Home Improvement Quote";
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const getRatingStyles = (rating: LeadRating) => {
  switch (rating) {
    case "Platinum":
      return {
        badge: "border-fuchsia-300/70 bg-fuchsia-400/20 text-fuchsia-100 shadow-lg shadow-fuchsia-950/30",
        row: "border-fuchsia-300/60 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-950/20 hover:border-fuchsia-200",
        panel: "border-fuchsia-300/45 bg-fuchsia-500/10",
      };
    case "Gold":
      return {
        badge: "border-amber-300/70 bg-amber-400/20 text-amber-100 shadow-md shadow-amber-950/20",
        row: "border-amber-300/50 bg-amber-500/10 shadow-md shadow-amber-950/15 hover:border-amber-200",
        panel: "border-amber-300/35 bg-amber-500/10",
      };
    case "Silver":
      return {
        badge: "border-slate-300/50 bg-slate-300/15 text-slate-100",
        row: "border-slate-300/30 bg-slate-400/5 hover:border-slate-200/70",
        panel: "border-slate-300/25 bg-slate-400/5",
      };
    default:
      return {
        badge: "border-orange-300/40 bg-orange-400/10 text-orange-200",
        row: "border-orange-300/20 bg-orange-500/5 hover:border-orange-200/60",
        panel: "border-orange-300/20 bg-orange-500/5",
      };
  }
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>("home");
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedLead, setSelectedLead] = useState<AnalyticsSummary["recentLeads"][number] | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isExportingLeads, setIsExportingLeads] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);
  const [businessSection, setBusinessSection] = useState<"summary" | "dashboard">("summary");

  const currentQuestion = questions[currentIndex];

  const progress = useMemo(() => {
    if (isComplete) return 100;
    return (currentIndex / questions.length) * 100;
  }, [currentIndex, isComplete]);

  const form = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      postcode: "",
      notes: "",
    },
  });

  const resetHomeFlow = () => {
    setCurrentIndex(0);
    setResponses({});
    setIsComplete(false);
    setSubmitMessage(null);
    form.reset();
    setCurrentView("home");
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);

    try {
      const response = await fetch("/api/business/summary");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load business analytics.");
      }

      setAnalytics(data.summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load business analytics.";
      setLoginError(message);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleBusinessNav = async () => {
    if (businessUser) {
      setCurrentView("business");
      await loadAnalytics();
      return;
    }

    setCurrentView("business");
    setLoginError(null);
    setAnalytics(null);
  };

  const handleExportLeads = async () => {
    setIsExportingLeads(true);

    try {
      const response = await fetch("/api/business/export");

      if (!response.ok) {
        throw new Error("Unable to export leads.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "leads.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export leads.";
      setLoginError(message);
    } finally {
      setIsExportingLeads(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead || !window.confirm(`Delete the lead for ${selectedLead.name}?`)) {
      return;
    }

    setIsDeletingLead(true);

    try {
      const response = await fetch(`/api/business/leads/${selectedLead.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete lead.");
      }

      setSelectedLead(null);
      await loadAnalytics();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete lead.";
      setLoginError(message);
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch("/api/business/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }

      setBusinessUser(data.user);
      setCurrentView("business");
      await loadAnalytics();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setLoginError(message);
    }
  };

  const handleAnswer = (answerId: string) => {
    const selected = currentQuestion.answers.find((answer) => answer.id === answerId);

    if (!selected) {
      return;
    }

    setResponses((prev) => ({ ...prev, [currentQuestion.id]: selected.label }));

    if (currentIndex < questions.length - 1) {
      window.setTimeout(() => setCurrentIndex((index) => index + 1), 150);
      return;
    }

    window.setTimeout(() => setIsComplete(true), 150);
  };

  const onSubmit = async (values: LeadValues) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          responses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit your enquiry.");
      }

      setSubmitMessage("Your enquiry has been submitted successfully.");
      setResponses({});
      setCurrentIndex(0);
      setIsComplete(false);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your enquiry.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentView === "business") {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetHomeFlow}
                className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-400"
              >
                Home
              </button>
              <button
                type="button"
                onClick={handleBusinessNav}
                className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Business analytics
              </button>
            </div>

            {businessUser ? (
              <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                {businessUser.name}
              </div>
            ) : (
              <div className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
                Business login
              </div>
            )}
          </header>

          {!businessUser ? (
            <section className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Business access</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Sign in to view analytics</h1>
              <p className="mt-3 text-slate-300">
                This view is only available for registered business users already stored in the database.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="business-email" className="mb-2 block text-sm text-slate-200">
                    Business email
                  </label>
                  <input
                    id="business-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400"
                    placeholder="business@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="business-password" className="mb-2 block text-sm text-slate-200">
                    Password
                  </label>
                  <input
                    id="business-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && (
                  <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Sign in
                </button>
              </form>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Lead analytics</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {businessSection === "summary" ? "Lead summary view" : "Analytics dashboard"}
                  </h2>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessSection((section) => section === "summary" ? "dashboard" : "summary")}
                    className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    {businessSection === "summary" ? "Analytics dashboard" : "Lead summary view"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportLeads}
                    disabled={isExportingLeads}
                    className="rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isExportingLeads ? "Exporting..." : "Export CSV"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessUser(null)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25"
                  >
                    Log out
                  </button>
                </div>
              </div>

              {businessSection === "dashboard" ? (
                <div className="space-y-6">
                  <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Pipeline shape</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">What your leads are asking for</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      A simple view of demand, timing, budget, and coverage across all captured leads.
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {[
                      ["Product goals", analytics?.breakdowns.goals ?? [], "bg-sky-400"],
                      ["Urgency", analytics?.breakdowns.urgency ?? [], "bg-amber-400"],
                      ["Budget bands", analytics?.breakdowns.budgets ?? [], "bg-emerald-400"],
                      ["Areas", analytics?.breakdowns.areas ?? [], "bg-rose-400"],
                      ["Lead ratings", analytics?.breakdowns.ratings ?? [], "bg-violet-400"],
                    ].map(([title, breakdown, barColor]) => {
                      const items = breakdown as Array<{ label: string; count: number }>;
                      const maximum = Math.max(...items.map((item) => item.count), 1);

                      return (
                        <div key={title as string} className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                          <h3 className="text-lg font-semibold text-white">{title as string}</h3>
                          <div className="mt-5 space-y-4">
                            {items.map((item) => (
                              <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                  <span className="truncate text-slate-200">{item.label}</span>
                                  <span className="font-medium text-white">{item.count}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={`h-full rounded-full ${barColor as string}`}
                                    style={{ width: `${(item.count / maximum) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lead volume</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{analytics?.totalLeads ?? 0}</p>
                      <p className="mt-2 text-sm text-slate-400">All captured enquiries</p>
                    </div>
                    <div className="rounded-[26px] border border-amber-400/30 bg-amber-500/10 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Hot lead share</p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {analytics && analytics.totalLeads > 0
                          ? `${Math.round((analytics.urgentLeads / analytics.totalLeads) * 100)}%`
                          : "0%"}
                      </p>
                      <p className="mt-2 text-sm text-amber-100/80">Marked urgent</p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Consultation rate</p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {analytics && analytics.totalLeads > 0
                          ? `${Math.round((analytics.bookedConsults / analytics.totalLeads) * 100)}%`
                          : "0%"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">Leads requesting a call</p>
                    </div>
                  </div>
                </div>
              ) : isLoadingAnalytics ? (
                <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
                  Loading analytics...
                </div>
              ) : analytics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Qualified leads</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{analytics.totalLeads}</p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Booked consults</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{analytics.bookedConsults}</p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Average value</p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {formatCurrency(analytics.averageOrderValue)}
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-amber-400/30 bg-amber-500/10 p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Hot leads</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{analytics.urgentLeads}</p>
                      <p className="mt-2 text-sm text-amber-100/80">
                        {formatCurrency(analytics.averageUrgentLeadValue)} average value
                      </p>
                    </div>
                  </div>

                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                    <div className="min-w-0 rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-white">Recent leads</h3>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Updated live
                        </span>
                      </div>

                      <div className="space-y-3">
                        {analytics.recentLeads.length === 0 ? (
                          <p className="text-slate-300">No leads have been captured yet.</p>
                        ) : (
                          analytics.recentLeads.map((lead) => (
                            <button
                              key={lead.id}
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              aria-label={`Open details for ${lead.name}`}
                              className={`flex min-h-24 w-full flex-col gap-2 rounded-2xl border p-4 text-left transition md:flex-row md:items-center md:justify-between ${
                                selectedLead?.id === lead.id
                                  ? "border-emerald-400/70 bg-emerald-500/10"
                                  : getRatingStyles(lead.rating).row
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-medium text-white">{lead.name}</p>
                                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getRatingStyles(lead.rating).badge}`}>
                                    {lead.rating}
                                  </span>
                                </div>
                                <p className="truncate text-sm text-slate-300">{lead.email}</p>
                              </div>
                              <div className="shrink-0 text-sm text-slate-300 md:text-right">
                                <p>{lead.goal}</p>
                                <p>{lead.postcode}</p>
                                <p>{new Date(lead.createdAt).toLocaleDateString("en-GB")}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedLead ? (
                    <div className={`min-w-0 rounded-[30px] border p-6 ${getRatingStyles(selectedLead.rating).panel}`}>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Lead details</p>
                          <h3 className="mt-2 text-2xl font-semibold text-white">{selectedLead.name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLead(null)}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/25"
                        >
                          Close
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeleteLead}
                        disabled={isDeletingLead}
                        className="mb-5 w-full rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeletingLead ? "Deleting..." : "Delete lead"}
                      </button>

                      <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                          <p className="mt-1">{selectedLead.email}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
                          <p className="mt-1">{selectedLead.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Postcode</p>
                          <p className="mt-1">{selectedLead.postcode}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Captured</p>
                          <p className="mt-1">{new Date(selectedLead.createdAt).toLocaleString("en-GB")}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimated value</p>
                          <p className="mt-1">
                            {selectedLead.estimatedValue === null
                              ? "Not provided"
                              : formatCurrency(selectedLead.estimatedValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recommendation</p>
                          <p className="mt-1">{getRecommendation(selectedLead.responses)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lead rating</p>
                          <p className={`mt-1 font-semibold ${getRatingStyles(selectedLead.rating).badge.split(" ").find((style) => style.startsWith("text-")) ?? "text-white"}`}>
                            {selectedLead.rating}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project notes</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                          {selectedLead.notes || "No notes provided."}
                        </p>
                      </div>

                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Questionnaire responses</p>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                          {Object.entries(selectedLead.responses).map(([question, answer]) => (
                            <div key={question}>
                              <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">{question}</dt>
                              <dd className="mt-1 text-sm text-slate-200">{answer}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                    ) : (
                      <div className="min-h-64 rounded-[30px] border border-dashed border-white/15 bg-slate-900/40 p-6 text-slate-400">
                        Select a recent lead to view its details.
                      </div>
                    )}
                    </div>
                </>
              ) : (
                <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
                  No analytics available yet.
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    );
  }

  if (isComplete) {
    const recommendation = getRecommendation(responses);

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetHomeFlow}
                className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-400"
              >
                Home
              </button>
              <button
                type="button"
                onClick={handleBusinessNav}
                className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Business analytics
              </button>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
              Lead Match Ready
            </span>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm sm:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                Your recommendation
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {recommendation}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Based on your answers, this is the most appropriate route for your property and
                timeline. We&apos;ve prepared a lead summary so your sales team can follow up with the
                right offer and next steps.
              </p>

              <div className="mt-8 space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {question.prompt}
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-100">
                      {responses[question.id] ?? "Not answered yet"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-sky-500/10 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Book a consultation
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Tell us about your project</h2>

              <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-slate-200">Full name</label>
                  <input
                    id="name"
                    {...form.register("name")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-emerald-400"
                    placeholder="Alex Smith"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-slate-200">Email</label>
                  <input
                    id="email"
                    {...form.register("email")}
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="alex@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm text-slate-200">Phone</label>
                  <input
                    id="phone"
                    {...form.register("phone")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="07700 900123"
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="postcode" className="mb-2 block text-sm text-slate-200">Postcode</label>
                  <input
                    id="postcode"
                    {...form.register("postcode")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="M1 1AA"
                  />
                  {form.formState.errors.postcode && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.postcode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="mb-2 block text-sm text-slate-200">Project notes</label>
                  <textarea
                    id="notes"
                    {...form.register("notes")}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="Tell us more about the problem you're trying to solve..."
                  />
                </div>

                {submitMessage && <p className="text-sm text-emerald-300">{submitMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send my enquiry"}
                </button>
              </form>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#10253d,_#0f172a_45%,_#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetHomeFlow}
              className="rounded-full border border-sky-400/60 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleBusinessNav}
              className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Business analytics
            </button>
          </div>
        </header>

        {submitMessage && (
          <p
            aria-live="polite"
            className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          >
            {submitMessage}
          </p>
        )}

        <section className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-lg sm:p-8">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-300">
              <span>Qualification flow</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-emerald-300 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
            Question {currentIndex + 1}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {currentQuestion.prompt}
          </h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-slate-300">
            {currentQuestion.helper}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {currentQuestion.answers.map((answer) => (
              <button
                key={answer.id}
                type="button"
                aria-pressed={responses[currentQuestion.id] === answer.label}
                onClick={() => handleAnswer(answer.id)}
                className={`group rounded-2xl border p-4 text-left transition duration-200 hover:border-sky-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-500/10 ${
                  responses[currentQuestion.id] === answer.label
                    ? "border-sky-400 bg-sky-500/15 shadow-lg shadow-sky-500/10"
                    : "border-white/10 bg-slate-800/90"
                }`}
              >
                <span className="block text-base font-medium text-slate-50">{answer.label}</span>
                <span className="mt-2 block text-sm text-slate-400 group-hover:text-slate-300">
                  {answer.tone ?? "Recommended for your next step"}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => currentIndex > 0 && setCurrentIndex((index) => index - 1)}
              disabled={currentIndex === 0}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            <p className="text-sm text-slate-300">
              {Object.keys(responses).length} of {questions.length} answered
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
