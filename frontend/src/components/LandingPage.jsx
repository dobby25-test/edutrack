import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

const features = [
  {
    title: 'Role-aware Workspaces',
    copy: 'Students, teachers, and directors each get focused actions with zero clutter.'
  },
  {
    title: 'Live Progress Intelligence',
    copy: 'Track project velocity, pending reviews, and submission quality from one timeline.'
  },
  {
    title: 'Reliable Review Flow',
    copy: 'Assign, submit, grade, and export reports without spreadsheet overhead.'
  }
];

const workflow = [
  {
    title: 'Create + Assign',
    copy: 'Teachers publish structured tasks with due dates, rubrics, and language requirements.'
  },
  {
    title: 'Code + Submit',
    copy: 'Students build directly in the in-app editor and submit versioned solutions.'
  },
  {
    title: 'Review + Improve',
    copy: 'Faculty grade with feedback while directors monitor institutional performance.'
  }
];

function LandingPage() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.lp-reveal');
    if (!nodes.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.18 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-shell">
      <a className="lp-skip-link" href="#main-content">Skip to content</a>
      <div className="lp-noise" />
      <header className="lp-nav">
        <div className="lp-wrap">
          <Link className="lp-logo" to="/">
            EduTrack
          </Link>
          <nav className="lp-nav-links" aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <Link className="lp-btn lp-btn-ghost" to="/login">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="lp-wrap lp-main" id="main-content">
        <section className="lp-hero lp-reveal">
          <div className="lp-hero-copy lp-reveal">
            <p className="lp-eyebrow">Campus Project Operating System</p>
            <h1>
              Make academic project tracking feel
              <span> premium and effortless.</span>
            </h1>
            <p className="lp-lead">
              A modern platform for project creation, submissions, grading, and institutional analytics.
              Built for real classrooms and production-scale workflows.
            </p>
            <div className="lp-actions">
              <Link className="lp-btn lp-btn-primary" to="/login">
                Open Dashboard
              </Link>
              <a className="lp-btn lp-btn-ghost" href="#features">
                See Platform
              </a>
            </div>
          </div>

          <aside className="lp-hero-panel lp-reveal">
            <h3>Live Snapshot</h3>
            <p>Teams currently active on the platform.</p>
            <div className="lp-kpis">
              <article>
                <strong>148</strong>
                <span>Active Projects</span>
              </article>
              <article>
                <strong>92%</strong>
                <span>On-time Submissions</span>
              </article>
              <article>
                <strong>31</strong>
                <span>Pending Reviews</span>
              </article>
              <article>
                <strong>9</strong>
                <span>Departments</span>
              </article>
            </div>
          </aside>
        </section>

        <section id="features" className="lp-section lp-reveal">
          <h2>Everything your campus workflow needs</h2>
          <p className="lp-section-sub">
            Unified design for clarity, speed, and accountability.
          </p>
          <div className="lp-grid">
            {features.map((feature) => (
              <article className="lp-card lp-reveal" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="lp-section lp-reveal">
          <h2>How EduTrack runs daily operations</h2>
          <div className="lp-steps">
            {workflow.map((step, idx) => (
              <article className="lp-step lp-reveal" key={step.title}>
                <span>{idx + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-cta lp-reveal">
          <div>
            <h2>Ready to launch your next term with EduTrack?</h2>
            <p>Sign in and manage your project pipeline with a sharper workflow.</p>
          </div>
          <Link className="lp-btn lp-btn-light" to="/login">
            Continue to Login
          </Link>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
