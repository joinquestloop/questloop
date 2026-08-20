"use client";

import { FormEvent, useState } from "react";

const quests = [
  {
    number: "01",
    title: "100 Days of Code",
    description: "Build a daily coding habit and share one small win every day.",
    duration: "100 days",
    rhythm: "Daily proof",
    color: "coral",
  },
  {
    number: "02",
    title: "Build Your First SaaS",
    description: "Go from idea to a useful product people can actually try.",
    duration: "6 weeks",
    rhythm: "Weekly ships",
    color: "violet",
  },
  {
    number: "03",
    title: "30 Days of DSA",
    description: "Practice core patterns, solve consistently, and make progress visible.",
    duration: "30 days",
    rhythm: "Daily problem",
    color: "lime",
  },
];

const LOOPS_FORM_ENDPOINT =
  "https://app.loops.so/api/newsletter-form/cmt1vkcz7030g0j0btod9r9ck";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) return;

    setStatus("submitting");
    setMessage("Adding you to the loop…");

    try {
      const body = new URLSearchParams({
        email: email.trim(),
        source: "QuestLoop landing page",
        userGroup: "Early access",
      });
      const response = await fetch(LOOPS_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Subscription failed");
      }

      setStatus("success");
      setMessage("You’re in — we’ll let you know when the first quests open.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("That didn’t go through. Please wait a moment and try again.");
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="QuestLoop home">
          <span className="brand-mark" aria-hidden="true">Q</span>
          <span>QuestLoop</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#quests">Explore quests</a>
          <a className="nav-cta" href="#early-access">Join early access</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Progress is better together</p>
          <h1>Start something.<br /><em>Keep going.</em></h1>
          <p className="hero-lede">
            Join a quest. Make progress. Share proof. Repeat.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#early-access">Join early access <span>↗</span></a>
            <a className="text-link" href="#quests">See the first quests <span>↓</span></a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Example QuestLoop progress card">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="progress-card">
            <div className="card-topline">
              <span className="live-dot">Live quest</span>
              <span>Day 24 of 100</span>
            </div>
            <div className="card-icon" aria-hidden="true">⌁</div>
            <p className="card-label">TODAY’S QUEST</p>
            <h2>Build. Learn.<br />Share the proof.</h2>
            <div className="progress-track"><span /></div>
            <div className="progress-meta"><span>24% complete</span><span>24 day streak 🔥</span></div>
          </div>
          <div className="proof-chip proof-one"><span>✓</span> Proof shared</div>
          <div className="proof-chip proof-two"><span>+1</span> day complete</div>
        </div>
      </section>

      <section className="proof-bar" aria-label="How QuestLoop works">
        <p>Pick a quest</p><span>→</span><p>Show up</p><span>→</span><p>Share proof</p><span>→</span><p>Build momentum</p>
      </section>

      <section className="quests-section" id="quests">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Choose your starting point</p>
            <h2>Three quests.<br />One simple promise.</h2>
          </div>
          <p>Small, visible steps create real momentum. Pick a direction and keep your loop moving.</p>
        </div>

        <div className="quest-grid">
          {quests.map((quest) => (
            <article className={`quest-card ${quest.color}`} key={quest.title}>
              <div className="quest-number">{quest.number}</div>
              <div className="quest-symbol" aria-hidden="true">
                {quest.number === "01" ? "{ }" : quest.number === "02" ? "↗" : "#"}
              </div>
              <h3>{quest.title}</h3>
              <p>{quest.description}</p>
              <div className="quest-details">
                <span>{quest.duration}</span><span>{quest.rhythm}</span>
              </div>
              <a href="#early-access" aria-label={`Get early access to ${quest.title}`}>I’m in <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="waitlist-section" id="early-access">
        <div className="waitlist-orbit" />
        <div className="waitlist-copy">
          <p className="eyebrow light"><span /> Be there from day one</p>
          <h2>Your next chapter<br />starts with <em>day one.</em></h2>
          <p>Join the early-access list. We’ll only email when there’s something worth showing up for.</p>
        </div>
        <form className="waitlist-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="form-row">
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Joining…" : "Join the loop"} <span>↗</span>
            </button>
          </div>
          <p className={`form-note ${status}`} aria-live="polite">
            {message || "No spam. No noise. Just progress."}
          </p>
        </form>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <p>Start small. Stay consistent. Make it visible.</p>
        <a href="https://www.instagram.com/joinquestloop" target="_blank" rel="noreferrer">@joinquestloop ↗</a>
      </footer>
    </main>
  );
}
