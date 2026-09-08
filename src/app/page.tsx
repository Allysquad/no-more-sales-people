"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Question = {
  id: string;
  prompt: string;
  helper: string;
  answers: { id: string; label: string; tone?: string }[];
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
  if (responses.goal === "both" || responses.goal === "windows") {
    return "Full Home Upgrade Package";
  }

  if (responses.goal === "doors") {
    return "Secure Entry Upgrade";
  }

  if (responses.goal === "conservatory") {
    return "Conservatory Refurbishment";
  }

  return "Bespoke Home Improvement Quote";
}

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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
      form.reset();
      setResponses({});
      setCurrentIndex(0);
      setIsComplete(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your enquiry.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    const recommendation = getRecommendation(responses);

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="mb-8 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
            <span className="font-medium text-emerald-300">No More Sales People</span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
              Lead Match Ready
            </span>
          </section>

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
                  <label className="mb-2 block text-sm text-slate-200">Full name</label>
                  <input
                    {...form.register("name")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-emerald-400"
                    placeholder="Alex Smith"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-200">Email</label>
                  <input
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
                  <label className="mb-2 block text-sm text-slate-200">Phone</label>
                  <input
                    {...form.register("phone")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="07700 900123"
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-200">Postcode</label>
                  <input
                    {...form.register("postcode")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                    placeholder="M1 1AA"
                  />
                  {form.formState.errors.postcode && (
                    <p className="mt-1 text-xs text-rose-300">{form.formState.errors.postcode.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-200">Project notes</label>
                  <textarea
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
        <header className="mb-8 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Lead finder</p>
            <h1 className="mt-1 text-lg font-semibold text-white">No More Sales People</h1>
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">
            1 of {questions.length}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-lg sm:p-8">
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
                  onClick={() => handleAnswer(answer.id)}
                  className="group rounded-2xl border border-white/10 bg-slate-800/90 p-4 text-left transition duration-200 hover:border-sky-400 hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-500/10"
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
          </div>

          <aside className="rounded-[30px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-sky-500/10 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Business client view
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Live sales snapshot</h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Qualified leads</p>
                <p className="mt-2 text-3xl font-semibold text-white">128</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Booked consults</p>
                <p className="mt-2 text-3xl font-semibold text-white">24</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Average value</p>
                <p className="mt-2 text-3xl font-semibold text-white">£6.8k</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Current opportunity</p>
              <p className="mt-3 text-lg font-medium text-white">Window & door upgrades</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The strongest-performing enquiry type for this audience is homeowners seeking energy
                efficiency and style improvements with limited disruption.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
