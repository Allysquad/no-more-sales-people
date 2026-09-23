"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ViewMode = "home" | "business";
type Theme = "current" | "light" | "dark";

type Question = {
  id: string;
  prompt: string;
  helper: string;
  answers: { id: string; label: string; icon: string; tone?: string }[];
};

type BusinessUser = { id: string; name: string; email: string };
type SubscriptionType = "ONE_COUNTRY" | "MULTIPLE_COUNTRIES" | "ALL_COUNTRIES";
type SubscriptionCountry = "SCOTLAND" | "IRELAND" | "ENGLAND" | "WALES";
type SubscriptionRating = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
type LeadRating = "Bronze" | "Silver" | "Gold" | "Platinum";
type ActiveSubscription = {
  id: string;
  type: SubscriptionType;
  countries: SubscriptionCountry[];
  rating: SubscriptionRating;
  monthlyPricePence: number;
  acceptedAt: string;
};
type SubscriptionOptions = {
  countries: Array<{ value: SubscriptionCountry; label: string; basePricePence: number }>;
  ratings: Array<{ value: SubscriptionRating; multiplier: number }>;
  discounts: { multipleCountries: number; allCountries: number };
};

function ThemeSwitcher({ onChange }: { onChange: (theme: Theme) => void }) {
  return (
    <details className="theme-switcher relative z-40 rounded-full border border-white/10 bg-slate-900/60 text-xs text-slate-200">
      <summary className="cursor-pointer rounded-full px-3 py-2 font-medium outline-none transition hover:border-sky-400">Theme</summary>
      <div className="theme-switcher-menu absolute right-0 z-50 mt-2 min-w-32 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl">
        {[["current", "Standard"], ["light", "White"], ["dark", "Dark"]].map(([value, label]) => (
          <button key={value} type="button" onClick={(event) => { onChange(value as Theme); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="theme-switcher-option block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-white/10">
            {label}
          </button>
        ))}
      </div>
    </details>
  );
}

type AnalyticsSummary = {
  plan: { type: SubscriptionType; countries: SubscriptionCountry[]; ratings: string[]; monthlyPricePence: number };
  totalLeads: number;
  bookedConsults: number;
  averageOrderValue: number;
  urgentLeads: number;
  averageUrgentLeadValue: number;
  breakdowns: Record<string, Array<{ label: string; count: number }>>;
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    createdAt: string;
    completedAt: string;
    goal: string;
    postcode: string;
    responses: Record<string, string>;
    estimatedValue: number | null;
    rating: LeadRating;
  }>;
};

const questions: Question[] = [
  { id: "goal", prompt: "What are you looking to improve?", helper: "Choose the main reason for getting in touch.", answers: [
    { id: "windows", label: "Windows", icon: "🪟" }, { id: "doors", label: "Doors", icon: "🚪" }, { id: "both", label: "Both", icon: "🏠" }, { id: "conservatory", label: "Conservatory / extension", icon: "🌿" },
  ] },
  { id: "issue", prompt: "What is the biggest issue right now?", helper: "This helps us tailor the right product and approach.", answers: [
    { id: "drafts", label: "Drafts / heat loss", icon: "🌬️" }, { id: "security", label: "Security / break-ins", icon: "🛡️" }, { id: "appearance", label: "Looks / outdated style", icon: "✨" }, { id: "noise", label: "Noise / sound insulation", icon: "🔇" },
  ] },
  { id: "urgency", prompt: "How quickly do you need this sorted?", helper: "We’ll match your schedule and lead time.", answers: [
    { id: "asap", label: "Urgent - ASAP", icon: "⚡" }, { id: "months", label: "Within 1-3 months", icon: "📅" }, { id: "exploring", label: "Just researching", icon: "🔎" },
  ] },
  { id: "property", prompt: "What type of property do you have?", helper: "This helps recommend the best fit for your home.", answers: [
    { id: "house", label: "House", icon: "🏡" }, { id: "bungalow", label: "Bungalow", icon: "🌳" }, { id: "flat", label: "Flat / apartment", icon: "🏢" }, { id: "commercial", label: "Commercial property", icon: "🏬" },
  ] },
  { id: "area", prompt: "Which area are you based in?", helper: "We’ll check local coverage and stock availability.", answers: [
    { id: "scotland", label: "Scotland", icon: "🏴" }, { id: "ireland", label: "Ireland", icon: "🇮🇪" }, { id: "england", label: "England", icon: "🏴" }, { id: "wales", label: "Wales", icon: "🏴" },
  ] },
  { id: "budget", prompt: "What budget are you working with?", helper: "This helps us suggest the best value route.", answers: [
    { id: "low", label: "Under £3k", icon: "💷" }, { id: "mid", label: "£3k - £8k", icon: "💰" }, { id: "high", label: "£8k - £15k", icon: "📈" }, { id: "premium", label: "£15k+", icon: "⭐" },
  ] },
  { id: "customerDetails", prompt: "Input customer details", helper: "Add your details so the business can follow up with the right recommendation.", answers: [] },
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>("home");
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [subscriptionOptions, setSubscriptionOptions] = useState<SubscriptionOptions | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("ONE_COUNTRY");
  const [selectedCountries, setSelectedCountries] = useState<SubscriptionCountry[]>(["SCOTLAND"]);
  const [selectedRating, setSelectedRating] = useState<SubscriptionRating>("BRONZE");
  const [acceptSubscriptionPrice, setAcceptSubscriptionPrice] = useState(false);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "business@nomoresalespeople.com",
    password: "demo-password",
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedLead, setSelectedLead] = useState<AnalyticsSummary["recentLeads"][number] | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isExportingLeads, setIsExportingLeads] = useState(false);
  const [businessSection, setBusinessSection] = useState<"summary" | "dashboard" | "detailed" | "subscription">("summary");
  const [detailedRatingFilter, setDetailedRatingFilter] = useState<"ALL" | LeadRating>("ALL");
  const [detailedAreaFilter, setDetailedAreaFilter] = useState("ALL");
  const [detailedDateFilter, setDetailedDateFilter] = useState("");
  const [theme, setTheme] = useState<Theme>("current");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("nosp-theme");

    if (savedTheme !== "current" && savedTheme !== "light" && savedTheme !== "dark") return;

    const restoreTheme = window.setTimeout(() => setTheme(savedTheme), 0);

    return () => window.clearTimeout(restoreTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("nosp-theme", theme);
  }, [theme]);

  const currentQuestion = questions[currentIndex];
  const isCustomerDetailsStep = currentIndex === questions.length - 1;

  const progress = useMemo(() => {
    if (isCustomerDetailsStep) return 100;
    return (currentIndex / questions.length) * 100;
  }, [currentIndex, isCustomerDetailsStep]);

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
    setIsSubmitted(false);
    setSubmitMessage(null);
    form.reset();
    setCurrentView("home");
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);

    try {
      const response = await fetch("/api/customer/summary");
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

  const loadSubscription = async () => {
    const response = await fetch("/api/customer/subscription");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load lead subscriptions.");
    }

    setSubscriptionOptions(data.options);
    setSubscription(data.subscription);
    return data.subscription as ActiveSubscription | null;
  };

  const handleBusinessNav = async () => {
    if (businessUser) {
      setCurrentView("business");
      setBusinessSection("summary");
      try {
        const activeSubscription = await loadSubscription();
        if (activeSubscription) await loadAnalytics();
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Unable to load lead subscriptions.");
      }
      return;
    }

    setCurrentView("business");
    setLoginError(null);
    setAnalytics(null);
  };

  const handleRejectSubscription = async () => {
    setLoginError(null);

    if (!subscription) {
      resetHomeFlow();
      return;
    }

    setBusinessSection("summary");
    await loadAnalytics();
  };

  const subscriptionPricing = useMemo(() => {
    if (!subscriptionOptions) {
      return { basePricePence: 0, ratingPricePence: 0, discountRate: 0, discountPence: 0, monthlyPricePence: 0 };
    }
    const countries = subscriptionType === "ALL_COUNTRIES"
      ? subscriptionOptions.countries
      : subscriptionOptions.countries.filter((country) => selectedCountries.includes(country.value));
    const basePricePence = countries.reduce((total, country) => total + country.basePricePence, 0);
    const multiplier = subscriptionOptions.ratings.find((rating) => rating.value === selectedRating)?.multiplier ?? 1;
    const discountRate = subscriptionType === "MULTIPLE_COUNTRIES"
      ? subscriptionOptions.discounts.multipleCountries
      : subscriptionType === "ALL_COUNTRIES" ? subscriptionOptions.discounts.allCountries : 0;
    const ratingPricePence = Math.round(basePricePence * multiplier);
    const monthlyPricePence = Math.round(ratingPricePence * (1 - discountRate));

    return {
      basePricePence,
      ratingPricePence,
      discountRate,
      discountPence: ratingPricePence - monthlyPricePence,
      monthlyPricePence,
    };
  }, [selectedCountries, selectedRating, subscriptionOptions, subscriptionType]);

  const detailedLeads = useMemo(() => {
    const leads = analytics?.recentLeads ?? [];

    return leads.filter((lead) => {
      const area = String(lead.responses.area ?? "");
      const matchesRating = detailedRatingFilter === "ALL" || lead.rating === detailedRatingFilter;
      const matchesArea = detailedAreaFilter === "ALL" || area === detailedAreaFilter;
      const matchesDate = !detailedDateFilter || lead.completedAt.slice(0, 10) === detailedDateFilter;

      return matchesRating && matchesArea && matchesDate;
    });
  }, [analytics, detailedAreaFilter, detailedDateFilter, detailedRatingFilter]);

  const handleSubscriptionTypeChange = (type: SubscriptionType) => {
    setSubscriptionType(type);
    if (type === "ONE_COUNTRY") setSelectedCountries([selectedCountries[0] ?? "SCOTLAND"]);
    if (type === "MULTIPLE_COUNTRIES" && selectedCountries.length < 2) setSelectedCountries(["SCOTLAND", "WALES"]);
    if (type === "ALL_COUNTRIES") setSelectedCountries([]);
    setAcceptSubscriptionPrice(false);
  };

  const handleCountryToggle = (country: SubscriptionCountry) => {
    setAcceptSubscriptionPrice(false);

    if (subscriptionType === "ONE_COUNTRY") {
      setSelectedCountries((current) => current.includes(country) ? [] : [country]);
      return;
    }

    const nextCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((value) => value !== country)
      : [...selectedCountries, country];

    if (subscriptionType === "MULTIPLE_COUNTRIES" && nextCountries.length === 4) {
      setSubscriptionType("ALL_COUNTRIES");
    }

    setSelectedCountries(nextCountries);
  };

  const openSubscription = () => {
    if (subscription) {
      setSubscriptionType(subscription.type);
      setSelectedCountries(subscription.type === "ALL_COUNTRIES" ? [] : subscription.countries);
      setSelectedRating(subscription.rating);
    }
    setAcceptSubscriptionPrice(false);
    setBusinessSection("subscription");
  };

  const handleSaveSubscription = async () => {
    setIsSavingSubscription(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/customer/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: subscriptionType,
          countries: subscriptionType === "ALL_COUNTRIES" ? [] : selectedCountries,
          rating: selectedRating,
          acceptPrice: acceptSubscriptionPrice,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Unable to save subscription.");

      setSubscription(data.subscription);
      setBusinessSection("summary");
      await loadAnalytics();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to save subscription.");
    } finally {
      setIsSavingSubscription(false);
    }
  };

  const handleExportLeads = async () => {
    setIsExportingLeads(true);

    try {
      const response = await fetch("/api/customer/export");

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

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch("/api/customer/login", {
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
      const activeSubscription = await loadSubscription();
      if (activeSubscription) await loadAnalytics();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setLoginError(message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/customer/login", { method: "DELETE" });
    setBusinessUser(null);
    setSubscription(null);
    setAnalytics(null);
  };

  const handleAnswer = async (answerId: string) => {
    const selected = currentQuestion.answers.find((answer) => answer.id === answerId);

    if (!selected) {
      return;
    }

    setResponses((prev) => ({ ...prev, [currentQuestion.id]: selected.label }));

    if (currentIndex < questions.length - 1) {
      window.setTimeout(() => setCurrentIndex((index) => index + 1), 150);
      return;
    }
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
      setIsSubmitted(true);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your enquiry.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerDetailsForm = (
    <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      {([
        ["name", "Full name", "Alex Smith", "text"],
        ["email", "Email", "alex@email.com", "email"],
        ["phone", "Phone", "07700 900123", "text"],
        ["postcode", "Postcode", "M1 1AA", "text"],
      ] as const).map(([field, label, placeholder, type]) => (
        <div key={field}>
          <label htmlFor={field} className="mb-1 block text-sm text-slate-200">{label}</label>
          <input
            id={field}
            {...form.register(field)}
            type={type}
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none transition focus:border-emerald-400"
            placeholder={placeholder}
          />
          {form.formState.errors[field]?.message && (
            <p className="mt-1 text-xs text-rose-300">{String(form.formState.errors[field]?.message)}</p>
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <label htmlFor="notes" className="mb-1 block text-sm text-slate-200">Project notes</label>
        <textarea
          id="notes"
          {...form.register("notes")}
          rows={1}
          className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none transition focus:border-emerald-400"
          placeholder="Tell us more about the problem you're trying to solve..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
      >
        {isSubmitting ? "Sending..." : "Send my details"}
      </button>
    </form>
  );

  if (currentView === "business") {
    return (
      <main data-theme={theme} className="min-h-screen bg-[radial-gradient(circle_at_top,_#10253d,_#0f172a_45%,_#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="relative z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
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
                Dashboard
              </button>
            </div>

            {businessUser && (
              <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                {businessUser.name}
              </div>
            )}
            <ThemeSwitcher onChange={setTheme} />
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
          ) : businessSection === "subscription" || !subscription ? (
            <section className="mx-auto max-w-4xl space-y-6">
              <div
                role="alert"
                className="rounded-2xl border border-amber-300/50 bg-amber-500/10 px-5 py-4 text-amber-100"
              >
                <p className="font-semibold">You cannot receive or view leads yet</p>
                <p className="mt-1 text-sm text-amber-100/80">
                  Choose and accept a lead subscription below before you can access the dashboard or export leads.
                </p>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">Lead subscriptions</p>
                <h1 className="mt-4 text-3xl font-semibold text-white">Choose the leads you want to receive</h1>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Select a country scope and lead rating. Your monthly price is fixed by the subscription and must be accepted before lead access is enabled.
                </p>
              </div>

              {subscriptionOptions && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                    <h2 className="text-xl font-semibold text-white">Coverage</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {([
                        ["ONE_COUNTRY", "One country", "No discount"],
                        ["MULTIPLE_COUNTRIES", "Multiple countries", "10% discount"],
                        ["ALL_COUNTRIES", "All countries", "20% discount"],
                      ] as const).map(([type, label, detail]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleSubscriptionTypeChange(type)}
                          className={`rounded-2xl border p-4 text-left transition ${subscriptionType === type ? "border-emerald-300 bg-emerald-500/15" : "border-white/10 bg-white/5 hover:border-emerald-300/50"}`}
                        >
                          <span className="block font-medium text-white">{label}</span>
                          <span className="mt-1 block text-xs text-slate-400">{detail}</span>
                        </button>
                      ))}
                    </div>

                    <h2 className="mt-8 text-xl font-semibold text-white">Countries</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {subscriptionOptions.countries.map((country) => (
                        <label key={country.value} className={`flex items-center justify-between rounded-2xl border p-4 ${subscriptionType === "ALL_COUNTRIES" ? "border-white/5 bg-white/5 opacity-60" : "border-white/10 bg-white/5"}`}>
                          <span>
                            <span className="block font-medium text-white">{country.label}</span>
                            <span className="text-xs text-slate-400">{formatCurrency(country.basePricePence / 100)} / month at Bronze</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={subscriptionType === "ALL_COUNTRIES" || selectedCountries.includes(country.value)}
                            disabled={subscriptionType === "ALL_COUNTRIES"}
                            onChange={() => handleCountryToggle(country.value)}
                            className="h-5 w-5 accent-emerald-400"
                          />
                        </label>
                      ))}
                    </div>

                    <h2 className="mt-8 text-xl font-semibold text-white">Lead rating</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {subscriptionOptions.ratings.map((rating) => {
                        const ratingDescriptions: Record<SubscriptionRating, string> = {
                          BRONZE: "Lower budget or less urgent enquiries.",
                          SILVER: "Mid-range budget and/or nearer-term enquiries.",
                          GOLD: "Higher-value, urgent enquiries with a strong buying signal.",
                          PLATINUM: "£15k+ budget and urgent timing.",
                        };

                        return (
                        <button
                          key={rating.value}
                          type="button"
                          onClick={() => { setSelectedRating(rating.value); setAcceptSubscriptionPrice(false); }}
                          className={`rounded-2xl border p-4 text-left transition ${selectedRating === rating.value ? "border-emerald-300 bg-emerald-500/15" : "border-white/10 bg-white/5 hover:border-emerald-300/50"}`}
                        >
                          <span className="block font-medium text-white">{rating.value}</span>
                          <span className="mt-1 block text-xs text-slate-400">{Math.round((rating.multiplier - 1) * 100)}% over Bronze</span>
                          <span className="mt-2 block text-xs leading-5 text-slate-300">{ratingDescriptions[rating.value]}</span>
                        </button>
                        );
                      })}
                    </div>
                  </div>

                  <aside className="h-fit rounded-[30px] border border-emerald-300/30 bg-emerald-500/10 p-6">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Subscription total</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{formatCurrency(subscriptionPricing.monthlyPricePence / 100)}</p>
                    <p className="mt-1 text-sm text-emerald-100/80">per month</p>
                    <div className="mt-5 space-y-1 border-t border-emerald-300/20 pt-4 text-sm">
                      <p className="flex justify-between gap-4 text-slate-300">
                        <span>Price before discount</span>
                        <span>{formatCurrency(subscriptionPricing.ratingPricePence / 100)}</span>
                      </p>
                      <p className="flex justify-between gap-4 font-medium text-emerald-200">
                        <span>Discount ({Math.round(subscriptionPricing.discountRate * 100)}%)</span>
                        <span>-{formatCurrency(subscriptionPricing.discountPence / 100)}</span>
                      </p>
                    </div>
                    <p className="mt-5 text-sm text-slate-200">
                      {subscriptionType === "ALL_COUNTRIES" ? "All countries" : selectedCountries.length ? selectedCountries.join(", ") : "Choose at least one country"} · {selectedRating}
                    </p>
                    {loginError && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{loginError}</p>}
                    <label className="mt-6 flex gap-3 text-sm text-slate-200">
                      <input type="checkbox" checked={acceptSubscriptionPrice} onChange={(event) => setAcceptSubscriptionPrice(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-400" />
                      <span>I accept this fixed monthly subscription price.</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveSubscription}
                      disabled={isSavingSubscription || !acceptSubscriptionPrice || subscriptionPricing.monthlyPricePence === 0}
                      className="mt-6 w-full rounded-full bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingSubscription ? "Saving subscription..." : "Accept and view leads"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectSubscription}
                      className="mt-3 w-full rounded-full border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Reject and go back
                    </button>
                  </aside>
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Lead analytics</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {businessSection === "summary" ? "Lead summary view" : businessSection === "dashboard" ? "Analytics" : businessSection === "detailed" ? "Detailed view" : "Lead subscriptions"}
                  </h2>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={openSubscription}
                    className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    Lead subscriptions
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessSection((section) => section === "summary" ? "dashboard" : "summary")}
                    className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    {businessSection === "summary" ? "Analytics" : "Lead summary view"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessSection("detailed")}
                    className="rounded-full border border-violet-400/50 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/20"
                  >
                    Detailed view
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
                    onClick={handleLogout}
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
              ) : businessSection === "detailed" ? (
                <div className="space-y-6">
                  <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-violet-300">All available leads</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Detailed view</h3>
                      </div>
                      <p className="text-sm text-slate-400">{detailedLeads.length} matching leads</p>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <label className="text-sm text-slate-300">Rating
                        <select value={detailedRatingFilter} onChange={(event) => setDetailedRatingFilter(event.target.value as "ALL" | LeadRating)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                          <option value="ALL">All ratings</option>
                          {(["Bronze", "Silver", "Gold", "Platinum"] as LeadRating[]).map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                        </select>
                      </label>
                      <label className="text-sm text-slate-300">Area
                        <select value={detailedAreaFilter} onChange={(event) => setDetailedAreaFilter(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                          <option value="ALL">All areas</option>
                          {[...new Set((analytics?.recentLeads ?? []).map((lead) => String(lead.responses.area ?? "Not provided")))].map((area) => <option key={area} value={area}>{area}</option>)}
                        </select>
                      </label>
                      <label className="text-sm text-slate-300">Date completed
                        <input type="date" value={detailedDateFilter} onChange={(event) => setDetailedDateFilter(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {detailedLeads.length === 0 ? <p className="rounded-[30px] border border-dashed border-white/15 p-8 text-slate-400">No leads match these filters.</p> : detailedLeads.map((lead) => (
                      <article key={lead.id} className={`rounded-[26px] border p-5 ${getRatingStyles(lead.rating).panel}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2"><h3 className="text-lg font-semibold text-white">{lead.name}</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRatingStyles(lead.rating).badge}`}>{lead.rating}</span></div>
                            <p className="mt-1 text-sm text-slate-300">{lead.email} · {lead.phone} · {lead.postcode}</p>
                          </div>
                          <p className="text-sm text-slate-300">Completed {new Date(lead.completedAt).toLocaleString("en-GB")}</p>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-4">
                          <p><span className="block text-xs uppercase text-slate-400">Area</span>{String(lead.responses.area ?? "Not provided")}</p>
                          <p><span className="block text-xs uppercase text-slate-400">Goal</span>{lead.goal}</p>
                          <p><span className="block text-xs uppercase text-slate-400">Budget</span>{String(lead.responses.budget ?? "Not provided")}</p>
                          <p><span className="block text-xs uppercase text-slate-400">Urgency</span>{String(lead.responses.urgency ?? "Not provided")}</p>
                        </div>
                        <p className="mt-4 text-sm text-slate-300">{lead.notes || "No notes provided."}</p>
                        <dl className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
                          {Object.entries(lead.responses).map(([key, value]) => <div key={key}><dt className="uppercase text-slate-500">{key}</dt><dd className="mt-1 text-slate-200">{value}</dd></div>)}
                        </dl>
                      </article>
                    ))}
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

  if (isSubmitted) {
    return (
      <main data-theme={theme} className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <header className="relative z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={resetHomeFlow}
              className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-400"
            >
              Home
            </button>
            <ThemeSwitcher onChange={setTheme} />
          </header>

          <section className="rounded-[30px] border border-emerald-400/30 bg-emerald-500/10 p-8 text-center shadow-2xl shadow-emerald-950/30 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Details received</p>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Thank you for your information</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-200">
              One of our industry-leading professionals in your area will contact you soon.
            </p>
            <button
              type="button"
              onClick={resetHomeFlow}
              className="mt-8 rounded-full border border-sky-400/60 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
            >
              Begin another quote
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (false) {

    return (
      <main data-theme={theme} className="min-h-screen bg-[radial-gradient(circle_at_top,_#10253d,_#0f172a_45%,_#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="relative z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
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
                Dashboard
              </button>
            </div>
            <ThemeSwitcher onChange={setTheme} />
          </header>

          <section className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-lg sm:p-8">
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-300">
                <span>Progress</span>
                <span>100%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-emerald-300" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Question 7 of 7</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Input customer details</h2>
              <p className="mt-3 max-w-lg text-base leading-7 text-slate-300">
                Add your details so one of our industry-leading professionals can contact you soon.
              </p>

              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-slate-200">Full name</label>
                  <input
                    id="name"
                    {...form.register("name")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-emerald-400"
                    placeholder="Alex Smith"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-rose-300">{String(form.formState.errors.name?.message)}</p>
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
                    <p className="mt-1 text-xs text-rose-300">{String(form.formState.errors.email?.message)}</p>
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
                    <p className="mt-1 text-xs text-rose-300">{String(form.formState.errors.phone?.message)}</p>
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
                    <p className="mt-1 text-xs text-rose-300">{String(form.formState.errors.postcode?.message)}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="mb-2 block text-sm text-slate-200">Project notes</label>
                  <textarea
                    id="notes"
                    {...form.register("notes")}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="Tell us more about the problem you're trying to solve..."
                  />
                </div>

                {submitMessage && <p className="text-sm text-emerald-300 sm:col-span-2">{submitMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
                >
                  {isSubmitting ? "Sending..." : "Send my details"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main data-theme={theme} className="min-h-screen bg-[radial-gradient(circle_at_top,_#10253d,_#0f172a_45%,_#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="relative z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
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
              Dashboard
            </button>
          </div>
          <ThemeSwitcher onChange={setTheme} />
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
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-emerald-300 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
            Question {currentIndex + 1}
          </p>
          <h2 className={`${isCustomerDetailsStep ? "mt-2 text-2xl" : "mt-4 text-3xl sm:text-4xl"} font-semibold tracking-tight text-white`}>
            {currentQuestion.prompt}
          </h2>
          <p className={`${isCustomerDetailsStep ? "mt-2 text-sm leading-6" : "mt-3 text-base leading-7"} max-w-lg text-slate-300`}>
            {currentQuestion.helper}
          </p>

          {currentIndex === questions.length - 1 ? customerDetailsForm : (
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
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl leading-none"
                  >
                    {answer.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-slate-50">{answer.label}</span>
                    <span className="mt-2 block text-sm text-slate-400 group-hover:text-slate-300">
                      {answer.tone ?? "Recommended for your next step"}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => index - 1)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25"
              >
                Back
              </button>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}
