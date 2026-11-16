import Link from "next/link";

const features = [
  { icon: "⌕", title: "Discover opportunities", description: "Explore job opportunities by role, location, workplace type, and compensation." },
  { icon: "◎", title: "Connect with employers", description: "Build your professional profile and apply to opportunities that match your skills." },
  { icon: "↗", title: "Hire with confidence", description: "Give employers a clear foundation to publish vacancies and manage applications." },
];

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Global Employment Platform home">
            <span className="brand-mark" aria-hidden="true">G</span>
            <span>Global Employment</span>
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/jobs">Find a job</Link>
            <a href="#employers">For employers</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/login">Sign in</Link>
            <Link className="button button-secondary" href="/register">Create account</Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="hero" id="opportunities">
          <div className="container hero-content">
            <span className="eyebrow">A world of work opportunities</span>
            <h1>Find work that moves you forward.</h1>
            <p>A new place to discover opportunities, share your skills, and connect with employers across the world.</p>
            <div className="hero-actions" id="get-started">
              <a className="button" href="/register">Find a job</a>
              <Link className="button button-secondary" href="/register">I&apos;m hiring</Link>
            </div>
          </div>
        </section>
        <section className="section" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <h2>Better connections. More possibilities.</h2>
              <p>One platform designed for candidates and employers.</p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section" id="employers">
          <div className="container">
            <div className="section-heading">
              <h2>For people and businesses everywhere</h2>
              <p>Candidate profiles, employer tools, vacancy publishing, and personalized job alerts are part of the product roadmap.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container">Global Employment Platform · Early development preview</div>
      </footer>
    </>
  );
}
