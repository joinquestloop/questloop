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

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="QuestLoop home">
          <span className="brand-mark" aria-hidden="true">Q</span>
          <span>QuestLoop</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#quests">Explore quests</a>
          <a href="/signup?mode=signin">Sign in</a>
          <a className="nav-cta" href="/signup">Start a quest</a>
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
            <a className="button button-primary" href="/signup">Start your first quest <span>↗</span></a>
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
              <a href="/signup" aria-label={`Start ${quest.title}`}>Start this quest <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="waitlist-section" id="get-started">
        <div className="waitlist-orbit" />
        <div className="waitlist-copy">
          <p className="eyebrow light"><span /> Your Day 1 is ready</p>
          <h2>Your next chapter<br />starts with <em>day one.</em></h2>
          <p>Create a free account, choose one quest, and make your first piece of progress visible today.</p>
        </div>
        <div className="launch-actions">
          <a href="/signup">Create free account <span>↗</span></a>
          <a href="/signup?mode=signin">Already a member? Sign in</a>
          <p>No endless feed. No follower race. Just progress.</p>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">Q</span><span>QuestLoop</span></a>
        <p>Start small. Stay consistent. Make it visible.</p>
        <a href="https://www.instagram.com/joinquestloop" target="_blank" rel="noreferrer">@joinquestloop ↗</a>
      </footer>
    </main>
  );
}
