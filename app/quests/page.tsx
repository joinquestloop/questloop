"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";
import AccountMenu from "../../components/account-menu";

type Quest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_days: number;
  proof_rhythm: string;
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [joinedQuestIds, setJoinedQuestIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQuests() {
      const { supabase } = await import("../../lib/supabase");
      const [{ data: authData }, { data: questData, error: questError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("quests").select("id, slug, title, description, duration_days, proof_rhythm").order("duration_days"),
      ]);

      if (!active) return;
      setUserId(authData.user?.id ?? null);

      if (questError) {
        setMessage(questError.message);
        setLoading(false);
        return;
      }

      setQuests(questData ?? []);

      if (authData.user) {
        const { data: memberships } = await supabase
          .from("quest_memberships")
          .select("quest_id")
          .eq("user_id", authData.user.id);

        if (!active) return;
        setJoinedQuestIds(new Set((memberships ?? []).map((membership) => membership.quest_id)));
      }

      setLoading(false);
    }

    loadQuests().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "We couldn’t load the quests.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function joinQuest(quest: Quest) {
    if (joinedQuestIds.has(quest.id)) {
      window.location.assign("/quest");
      return;
    }

    if (!userId) {
      setMessage("Sign in before joining a quest.");
      return;
    }

    setJoiningId(quest.id);
    setMessage(`Joining ${quest.title}…`);

    try {
      const { supabase } = await import("../../lib/supabase");
      const { error } = await supabase.from("quest_memberships").insert({
        user_id: userId,
        quest_id: quest.id,
        started_on: new Date().toISOString().slice(0, 10),
      });

      if (error && error.code !== "23505") throw error;

      setJoinedQuestIds((current) => new Set(current).add(quest.id));
      setMessage(`You joined ${quest.title}. Your journey starts at Day 1.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t join that quest. Please try again.");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <main className="choose-quest-page">
      <header className="quest-picker-header">
        <a className="brand" href="/" aria-label="QuestLoop home">
          <span className="brand-mark" aria-hidden="true">Q</span>
          <span>QuestLoop</span>
        </a>
        <div className="quest-picker-account"><span>Step 3 of 3</span><AccountMenu /></div>
      </header>

      <section className="quest-picker-intro">
        <p className="eyebrow"><span /> Choose your starting point</p>
        <h1>What will you<br /><em>show up for?</em></h1>
        <p>Start with one quest. Your progress begins at Day 1, no matter when you join.</p>
      </section>

      {loading ? (
        <p className="quest-picker-status">Loading the first quests…</p>
      ) : !userId ? (
        <section className="quest-picker-empty">
          <h2>Sign in to choose your quest.</h2>
          <a className="auth-submit link-button" href="/signup">Go to sign in →</a>
        </section>
      ) : (
        <section className="quest-picker-grid" aria-label="Available quests">
          {quests.map((quest, index) => {
            const joined = joinedQuestIds.has(quest.id);
            const colors = ["coral", "violet", "lime"];
            return (
              <article className={`picker-card ${colors[index % colors.length]}`} key={quest.id}>
                <div className="picker-card-top"><span>0{index + 1}</span><span>{quest.duration_days} days</span></div>
                <div className="picker-symbol" aria-hidden="true">{index === 0 ? "{ }" : index === 1 ? "↗" : "#"}</div>
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <div className="picker-details"><span>{quest.proof_rhythm}</span><span>Start at Day 1</span></div>
                <span className="picker-action-text" aria-hidden="true">
                  {joined ? "Open quest →" : joiningId === quest.id ? "Joining…" : "Choose this quest →"}
                </span>
                <button
                  className="picker-card-action"
                  type="button"
                  onClick={() => joinQuest(quest)}
                  disabled={joiningId === quest.id}
                  aria-label={joined ? `Open ${quest.title}` : `Choose ${quest.title}`}
                >
                  <span className="visually-hidden">{joined ? `Open ${quest.title}` : `Choose ${quest.title}`}</span>
                </button>
              </article>
            );
          })}
        </section>
      )}

      <p className="quest-picker-message" aria-live="polite">{message}</p>
      <p className="quest-picker-note">You can discover more quests later. For now, consistency beats collecting commitments.</p>
    </main>
  );
}
