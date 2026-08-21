import FeedbackForm from "../components/feedback-form";

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
          <a href="#how-it-works">How it works</a>
          <a href="#quests">Quests</a>
          <a href="#community-preview">Community</a>
          <a href="/signup?mode=signin">Sign in</a>
          <a className="nav-cta" href="/signup">Sign up</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Social accountability for real progress</p>
          <h1>Turn intentions into<br /><em>visible progress.</em></h1>
          <p className="hero-lede">
            Join people working toward the same goal, share proof of what you did, and build momentum one meaningful day at a time.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/signup">Create free account <span>↗</span></a>
            <a className="text-link" href="#community-preview">See the community <span>↓</span></a>
          </div>
          <p className="hero-trust">Free for early members <span>·</span> No follower race <span>·</span> Your progress stays yours</p>
        </div>

        <div className="hero-visual" aria-label="Example QuestLoop progress card">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="progress-card">
            <div className="card-topline">
              <span className="live-dot">100 Days of Code</span>
              <span>Day 24 of 100</span>
            </div>
            <div className="card-community-row"><span className="mini-avatar">A</span><span className="mini-avatar">J</span><span className="mini-avatar">M</span><p>A quest community showing up together</p></div>
            <div className="card-icon" aria-hidden="true">⌁</div>
            <p className="card-label">TODAY’S PROGRESS</p>
            <h2>Built the first<br />working prototype.</h2>
            <div className="progress-track"><span /></div>
            <div className="progress-meta"><span>24% complete</span><span>24 day streak 🔥</span></div>
          </div>
          <div className="proof-chip proof-one"><span>✓</span> Proof shared</div>
          <div className="proof-chip proof-two"><span>♥</span> Community cheer</div>
        </div>
      </section>

      <section className="proof-bar" aria-label="How QuestLoop works">
        <p>Join a quest</p><span>→</span><p>Do the work</p><span>→</span><p>Share proof</p><span>→</span><p>Cheer progress</p><span>→</span><p>Keep going</p>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading how-heading">
          <div><p className="eyebrow"><span /> Designed for follow-through</p><h2>A social network where<br />progress is the content.</h2></div>
          <p>QuestLoop replaces passive scrolling with small commitments, visible work, and encouragement from people on the same path.</p>
        </div>
        <div className="how-grid">
          <article><span>01</span><div className="how-icon">◎</div><h3>Choose one quest</h3><p>Make one clear commitment instead of collecting goals you never start.</p></article>
          <article><span>02</span><div className="how-icon">✓</div><h3>Share meaningful proof</h3><p>Post what you built, learned, practiced, or improved—without chasing vanity metrics.</p></article>
          <article><span>03</span><div className="how-icon">♥</div><h3>Progress with people</h3><p>See members on the same journey, cheer their work, and return for your next day.</p></article>
        </div>
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

          <article className="quest-card upcoming">
            <div className="quest-number">NEXT</div>
            <div className="quest-symbol" aria-hidden="true">＋</div>
            <h3>More quests coming soon.</h3>
            <p>New paths for health, creativity, learning, building, and personal growth are on the way.</p>
            <div className="quest-details"><span>In progress</span><span>Stay tuned</span></div>
            <a href="/signup">Join QuestLoop <span>→</span></a>
          </article>

          <article className="quest-card suggestion">
            <div className="quest-number">YOUR TURN</div>
            <div className="quest-symbol" aria-hidden="true">?</div>
            <h3>What quest do you want?</h3>
            <p>Tell us what you would commit to completing next and help shape QuestLoop.</p>
            <div className="quest-details"><span>Your idea</span><span>Community-led</span></div>
            <a href="#feedback">Suggest a quest <span>↓</span></a>
          </article>
        </div>
      </section>

      <section className="community-preview-section" id="community-preview">
        <div className="community-preview-copy">
          <p className="eyebrow light"><span /> Built around encouragement</p>
          <h2>Your work becomes<br /><em>your social profile.</em></h2>
          <p>Every public proof adds to a portfolio of consistency. Community posts connect back to real people, real quests, and visible progress.</p>
          <a href="/signup">Join the community <span>→</span></a>
        </div>
        <div className="social-preview" aria-label="Example QuestLoop community posts">
          <article className="social-preview-card featured">
            <div className="social-preview-meta"><span className="preview-avatar lime">A</span><div><strong>Alex</strong><small>100 Days of Code · Day 18</small></div><b>Preview</b></div>
            <p>Finished the responsive dashboard and documented what I learned about grid layouts.</p>
            <div className="preview-proof">✓ Proof shared <span>♡ Cheer</span></div>
          </article>
          <article className="social-preview-card offset">
            <div className="social-preview-meta"><span className="preview-avatar violet">M</span><div><strong>Maya</strong><small>Build Your First SaaS · Week 2</small></div></div>
            <p>Spoke with the first three potential users today. Two problems came up repeatedly.</p>
            <div className="preview-proof">↗ Research notes <span>♥ Cheered</span></div>
          </article>
          <article className="social-preview-card compact">
            <div className="social-preview-meta"><span className="preview-avatar coral">J</span><div><strong>Jordan</strong><small>30 Days of DSA · Day 7</small></div></div>
            <p>Solved sliding-window practice and explained the pattern in my own words.</p>
          </article>
        </div>
      </section>

      <section className="feedback-section" id="feedback">
        <div className="feedback-copy">
          <p className="eyebrow"><span /> Help shape QuestLoop</p>
          <h2>What would make your progress easier?</h2>
          <p>Found something confusing? Have a feature idea? Send it directly to the team.</p>
        </div>
        <FeedbackForm />
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
