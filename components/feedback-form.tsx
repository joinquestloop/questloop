"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function FeedbackForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();

    if (cleanMessage.length < 5) {
      setStatus("error");
      setError("Please tell us a little more.");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      if (website) {
        setStatus("success");
        return;
      }

      const { supabase } = await import("../lib/supabase");
      const { error: insertError } = await supabase.from("feedback").insert({
        message: cleanMessage,
        email: email.trim() || null,
        page_url: window.location.href,
      });

      if (insertError) throw insertError;

      setMessage("");
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("We couldn’t send that yet. Please try again.");
    }
  }

  return (
    <form className="feedback-form" onSubmit={submitFeedback}>
      <label htmlFor="feedback-message">Your feedback</label>
      <textarea id="feedback-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What should QuestLoop improve or build next?" maxLength={1200} required />

      <label htmlFor="feedback-email">Email <span>optional</span></label>
      <input id="feedback-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" maxLength={254} />

      <label className="feedback-honeypot" htmlFor="feedback-website">Website</label>
      <input className="feedback-honeypot" id="feedback-website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />

      <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending…" : "Send feedback →"}</button>
      <p className={`form-note ${status}`} role="status" aria-live="polite">
        {status === "success" ? "Thank you—your feedback is now in the loop." : error}
      </p>
    </form>
  );
}
