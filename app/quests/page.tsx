"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useRef, useState } from "react";
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
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);
  const [blockedQuest, setBlockedQuest] = useState<Quest | null>(null);
  const [message, setMessage] = useState("");
  const [questSuggestion, setQuestSuggestion] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingQuest && !blockedQuest) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPendingQuest(null);
        setBlockedQuest(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    confirmButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingQuest, blockedQuest]);

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
      setUserEmail(authData.user?.email ?? null);

      if (questError) {
        setMessage(questError.message);
        setLoading(false);
        return;
      }

      setQuests(questData ?? []);

      if (authData.user) {
        const { data: memberships } = await supabase
          .from("quest_memberships")
          .select("quest_id, joined_at")
          .eq("user_id", authData.user.id)
          .eq("status", "active")
          .order("joined_at", { ascending: false });

        if (!active) return;
        setJoinedQuestIds(new Set((memberships ?? []).map((membership) => membership.quest_id)));
        setActiveQuestId(memberships?.[0]?.quest_id ?? null);
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
      setActiveQuestId(quest.id);
      setMessage(`You joined ${quest.title}. Your journey starts at Day 1.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t join that quest. Please try again.");
    } finally {
      setJoiningId(null);
    }
  }

  function selectQuest(quest: Quest) {
    if (activeQuestId === quest.id) {
      window.location.assign("/quest");
      return;
    }

    if (activeQuestId) {
      setBlockedQuest(quest);
      return;
    }

    setPendingQuest(quest);
  }

  function confirmQuest() {
    if (!pendingQuest) return;
    const quest = pendingQuest;
    setPendingQuest(null);
    void joinQuest(quest);
  }

  async function submitQuestSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const suggestion = questSuggestion.trim();
    if (suggestion.length < 3) {
      setSuggestionMessage("Please enter a quest idea.");
      return;
    }

    setSuggesting(true);
    setSuggestionMessage("Sending your idea…");

    try {
      const { supabase } = await import("../../lib/supabase");
      const { error } = await supabase.from("feedback").insert({
        message: `Quest suggestion: ${suggestion}`,
        email: userEmail,
        page_url: `${window.location.origin}/quests`,
      });
      if (error) throw error;

      setQuestSuggestion("");
      setSuggestionMessage("Thanks—your quest idea is in the loop!");
    } catch {
      setSuggestionMessage("We couldn’t send that idea. Please try again.");
    } finally {
      setSuggesting(false);
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
            const joined = activeQuestId === quest.id;
            const anotherQuestIsActive = Boolean(activeQuestId && !joined);
            const colors = ["coral", "violet", "lime"];
            return (
              <article className={`picker-card ${colors[index % colors.length]}`} key={quest.id}>
                <div className="picker-card-top"><span>0{index + 1}</span><span>{quest.duration_days} days</span></div>
                <div className="picker-symbol" aria-hidden="true">{index === 0 ? "{ }" : index === 1 ? "↗" : "#"}</div>
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <div className="picker-details"><span>{quest.proof_rhythm.replace(/proof/gi, "check-in")}</span><span>Start at Day 1</span></div>
                <span className="picker-action-text" aria-hidden="true">
                  {joined ? "Open quest →" : joiningId === quest.id ? "Joining…" : anotherQuestIsActive ? "One active quest at a time →" : "Choose this quest →"}
                </span>
                <button
                  className="picker-card-action"
                  type="button"
                  onClick={() => selectQuest(quest)}
                  disabled={joiningId === quest.id}
                  aria-label={joined ? `Open ${quest.title}` : `Choose ${quest.title}`}
                >
                  <span className="visually-hidden">{joined ? `Open ${quest.title}` : `Choose ${quest.title}`}</span>
                </button>
              </article>
            );
          })}

          <article className="picker-card picker-coming-soon">
            <div className="picker-card-top"><span>Next</span><span>In progress</span></div>
            <div className="picker-symbol" aria-hidden="true">＋</div>
            <h2>More quests coming soon.</h2>
            <p>New paths for learning, building, health, creativity, and personal growth are being prepared.</p>
            <div className="picker-coming-label">Stay in the loop ✦</div>
          </article>

          <article className="picker-card picker-suggestion-card">
            <div className="picker-card-top"><span>Your turn</span><span>Shape QuestLoop</span></div>
            <div className="picker-symbol" aria-hidden="true">?</div>
            <h2>What quest do you want?</h2>
            <p>Tell us what you would commit to completing next.</p>
            <form className="quest-suggestion-form" onSubmit={submitQuestSuggestion}>
              <label className="visually-hidden" htmlFor="quest-suggestion">Your quest idea</label>
              <input id="quest-suggestion" value={questSuggestion} onChange={(event) => setQuestSuggestion(event.target.value)} maxLength={200} placeholder="e.g. 30 Days of Fitness" required />
              <button type="submit" disabled={suggesting}>{suggesting ? "Sending…" : "Suggest this quest →"}</button>
            </form>
            <p className="quest-suggestion-message" aria-live="polite">{suggestionMessage}</p>
          </article>
        </section>
      )}

      <p className="quest-picker-message" aria-live="polite">{message}</p>
      <p className="quest-picker-note">You can discover more quests later. For now, consistency beats collecting commitments.</p>

      {pendingQuest && (
        <div className="quest-confirm-backdrop">
          <button className="quest-confirm-dismiss" type="button" aria-label="Close confirmation" tabIndex={-1} onClick={() => setPendingQuest(null)} />
          <section
            className="quest-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quest-confirm-title"
          >
            <p className="panel-kicker">Ready for Day 1?</p>
            <h2 id="quest-confirm-title">Join {pendingQuest.title}?</h2>
            <p>Your journey will start at Day 1 today. You can move at your own pace and share progress along the way.</p>
            <div className="quest-confirm-actions">
              <button type="button" onClick={() => setPendingQuest(null)}>Not now</button>
              <button ref={confirmButtonRef} type="button" onClick={confirmQuest}>Yes, join this quest →</button>
            </div>
          </section>
        </div>
      )}

      {blockedQuest && (
        <div className="quest-confirm-backdrop">
          <button className="quest-confirm-dismiss" type="button" aria-label="Close message" tabIndex={-1} onClick={() => setBlockedQuest(null)} />
          <section className="quest-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="active-quest-title">
            <p className="panel-kicker">One commitment at a time</p>
            <h2 id="active-quest-title">You already have an active quest.</h2>
            <p>Finish or leave {quests.find((quest) => quest.id === activeQuestId)?.title || "your current quest"} before joining {blockedQuest.title}.</p>
            <div className="quest-confirm-actions">
              <button type="button" onClick={() => setBlockedQuest(null)}>Not now</button>
              <button ref={confirmButtonRef} type="button" onClick={() => window.location.assign("/quest")}>Open current quest →</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
