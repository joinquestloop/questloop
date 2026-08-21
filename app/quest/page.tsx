"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import AccountMenu from "../../components/account-menu";
import ThemeToggle from "../../components/theme-toggle";

type Quest = {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  proof_rhythm: string;
};

type Membership = {
  id: string;
  quest_id: string;
  started_on: string;
};

type Proof = {
  id: string;
  quest_day: number;
  progress_text: string;
  proof_url: string | null;
  image_path: string | null;
  visibility: string;
  submitted_at: string;
};

export default function QuestDashboardPage() {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const { supabase } = await import("../../lib/supabase");
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;

      if (!authData.user) {
        setLoading(false);
        return;
      }

      setUserId(authData.user.id);
      const { data: membershipData, error: membershipError } = await supabase
        .from("quest_memberships")
        .select("id, quest_id, started_on")
        .eq("user_id", authData.user.id)
        .eq("status", "active")
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membershipData) {
        setLoading(false);
        return;
      }

      const [{ data: questData, error: questError }, { data: proofData, error: proofError }] = await Promise.all([
        supabase.from("quests").select("id, title, description, duration_days, proof_rhythm").eq("id", membershipData.quest_id).single(),
        supabase.from("proofs").select("id, quest_day, progress_text, proof_url, image_path, visibility, submitted_at").eq("membership_id", membershipData.id).order("quest_day", { ascending: false }),
      ]);

      if (questError) throw questError;
      if (proofError) throw proofError;
      if (!active) return;

      setMembership(membershipData);
      setQuest(questData);
      setProofs(proofData ?? []);
      const imageProofs = (proofData ?? []).filter((proof) => proof.image_path);
      if (imageProofs.length) {
        const signedEntries = await Promise.all(imageProofs.map(async (proof) => {
          const { data } = await supabase.storage.from("proof-images").createSignedUrl(proof.image_path!, 3600);
          return [proof.id, data?.signedUrl ?? ""] as const;
        }));
        if (active) setImageUrls(Object.fromEntries(signedEntries.filter((entry) => entry[1])));
      }
      setLoading(false);
    }

    loadDashboard().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "We couldn’t open this quest.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const currentDay = useMemo(() => {
    if (!membership || !quest) return 1;
    const start = new Date(`${membership.started_on}T00:00:00`);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
    return Math.min(elapsed + 1, quest.duration_days);
  }, [membership, quest]);

  const todayProof = proofs.find((proof) => proof.quest_day === currentDay);
  const completion = quest ? Math.round((proofs.length / quest.duration_days) * 100) : 0;

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership || !userId || !quest || todayProof) return;

    setSubmitting(true);
    setMessage("Sharing your progress…");
    let uploadedPath: string | null = null;

    try {
      const { supabase } = await import("../../lib/supabase");
      if (proofImage) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(proofImage.type)) throw new Error("Upload a PNG, JPEG or WebP image.");
        if (proofImage.size > 5 * 1024 * 1024) throw new Error("The progress image must be 5 MB or smaller.");
        const extension = proofImage.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedPath = `${userId}/${membership.id}/day-${currentDay}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("proof-images").upload(uploadedPath, proofImage, { contentType: proofImage.type, upsert: false });
        if (uploadError) throw uploadError;
      }

      const { data, error } = await supabase
        .from("proofs")
        .insert({
          membership_id: membership.id,
          user_id: userId,
          quest_id: quest.id,
          quest_day: currentDay,
          progress_text: progressText.trim(),
          proof_url: proofUrl.trim() || null,
          image_path: uploadedPath,
          visibility,
        })
        .select("id, quest_day, progress_text, proof_url, image_path, visibility, submitted_at")
        .single();

      if (error) throw error;
      setProofs((current) => [data, ...current]);
      if (uploadedPath) {
        const { data: signedImage } = await supabase.storage.from("proof-images").createSignedUrl(uploadedPath, 3600);
        if (signedImage?.signedUrl) setImageUrls((current) => ({ ...current, [data.id]: signedImage.signedUrl }));
      }
      setProgressText("");
      setProofUrl("");
      setProofImage(null);
      setMessage(`Day ${currentDay} complete. Your update is now part of your progress.`);
    } catch (error) {
      if (uploadedPath) {
        const { supabase } = await import("../../lib/supabase");
        await supabase.storage.from("proof-images").remove([uploadedPath]);
      }
      setMessage(error instanceof Error ? error.message : "Your progress update could not be shared.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="quest-dashboard loading-screen">Opening your quest…</main>;
  }

  if (!userId) {
    return <main className="quest-dashboard empty-dashboard"><h1>Sign in to open your quest.</h1><a className="auth-submit link-button" href="/signup">Go to sign in →</a></main>;
  }

  if (!quest || !membership) {
    return <main className="quest-dashboard empty-dashboard"><h1>Choose your first quest.</h1><p>Your quest dashboard will appear here after you join.</p><a className="auth-submit link-button" href="/quests">Explore quests →</a></main>;
  }

  return (
    <main className="quest-dashboard">
      <header className="dashboard-header">
        <a className="brand" href="/"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <nav><a href="/profile">My profile</a><a href="/community">Community</a><a href="/quests">Discover quests</a><AccountMenu /><ThemeToggle /></nav>
      </header>

      <section className="dashboard-hero">
        <div>
          <p className="eyebrow"><span /> Active quest</p>
          <h1>{quest.title}</h1>
          <p>{quest.description}</p>
        </div>
        <div className="day-orbit"><small>Today</small><strong>Day {currentDay}</strong><span>of {quest.duration_days}</span></div>
      </section>

      <section className="dashboard-stats">
        <div><strong>{completion}%</strong><span>complete</span></div>
        <div><strong>{proofs.length}</strong><span>updates shared</span></div>
        <div><strong>{quest.proof_rhythm.replace(/proof/gi, "check-in")}</strong><span>commitment</span></div>
        <div><strong>Day 1</strong><span>personal start</span></div>
      </section>

      <section className="dashboard-grid">
        <div className="proof-panel">
          <p className="panel-kicker">Today’s check-in</p>
          <h2>{todayProof ? `Day ${currentDay} is complete.` : `Share your Day ${currentDay} progress.`}</h2>
          {todayProof ? (
            <article className="submitted-proof">
              <span>✓ Progress shared</span>
              <p>{todayProof.progress_text}</p>
              {imageUrls[todayProof.id] && <img className="proof-image" src={imageUrls[todayProof.id]} alt={`Day ${todayProof.quest_day} progress update`} />}
              {todayProof.proof_url && <a href={todayProof.proof_url} target="_blank" rel="noreferrer">Open progress link ↗</a>}
            </article>
          ) : (
            <form className="proof-form" onSubmit={submitProof}>
              <label htmlFor="progress">What progress did you make?</label>
              <textarea id="progress" value={progressText} onChange={(event) => setProgressText(event.target.value)} placeholder="Today I learned, built, solved or improved…" maxLength={1000} required />
              <label htmlFor="proof-url">Progress link <span>optional</span></label>
              <input id="proof-url" type="url" value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="https://github.com/…" />
              <label htmlFor="proof-image">Progress image <span>optional · PNG, JPEG or WebP · max 5 MB</span></label>
              <input id="proof-image" className="proof-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProofImage(event.target.files?.[0] ?? null)} />
              <label htmlFor="visibility">Who can see this?</label>
              <select id="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                <option value="public">Public — shown on my profile</option>
                <option value="private">Private — only me</option>
              </select>
              <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Submitting…" : `Complete Day ${currentDay} →`}</button>
            </form>
          )}
          <p className="dashboard-message" aria-live="polite">{message}</p>
        </div>

        <aside className="quest-rules-panel">
          <p className="panel-kicker">Simple rules</p>
          <h2>Keep the loop honest.</h2>
          <ol>
            <li><span>01</span>Make meaningful progress.</li>
            <li><span>02</span>Share progress from your own work.</li>
            <li><span>03</span>Respect copyright and privacy.</li>
            <li><span>04</span>Missed a day? Return without shame.</li>
          </ol>
        </aside>
      </section>
    </main>
  );
}
