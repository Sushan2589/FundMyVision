import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import IdeaCard from '../components/IdeaCard';
import logo from '../assets/logo.png';
import './LandingPage.css';

export default function LandingPage() {
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => setIdeas(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-inner">
          <div className="hero-content animate-slide-up">
            <div className="hero-badge">The Future of Crowdfunding</div>
            <h1 className="hero-title">
              Where <span className="hero-highlight">Visionary Ideas</span> Meet
              <span className="hero-highlight"> Passionate Investors</span>
            </h1>
            <p className="hero-subtitle">
              FundMyVision connects innovative thinkers with forward-looking investors.
              Post your groundbreaking idea or discover the next big opportunity to fund.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">Learn More</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">50+</span>
                <span className="hero-stat-label">Ideas Funded</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">Rs.20K+</span>
                <span className="hero-stat-label">Total Invested</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">20+</span>
                <span className="hero-stat-label">Active Users</span>
              </div>
            </div>
          </div>
          <div className="hero-image animate-fade-in">
            <img src={logo} alt="FundMyVision Logo" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Three simple steps to bring your vision to life or invest in the future</p>
          </div>
          <div className="how-steps" role="list" aria-label="How It Works steps">
            <article className="how-step animate-slide-up" style={{ animationDelay: '0.08s' }} role="listitem">
              <div className="how-step-badge">01</div>
              {/* <div className="how-step-icon" aria-hidden>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div> */}
              <h3 className="how-step-title">Share Your Vision</h3>
              <p className="how-step-text">Sign up as an Ideator and post your project with clear funding requirements to attract interested investors.</p>
            </article>

            <article className="how-step animate-slide-up" style={{ animationDelay: '0.16s' }} role="listitem">
              <div className="how-step-badge">02</div>
              {/* <div className="how-step-icon" aria-hidden>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div> */}
              <h3 className="how-step-title">Discover & Connect</h3>
              <p className="how-step-text">Investors browse and express interest; ideators receive pitches and start private conversations.</p>
            </article>

            <article className="how-step animate-slide-up" style={{ animationDelay: '0.24s' }} role="listitem">
              <div className="how-step-badge">03</div>
              {/* <div className="how-step-icon" aria-hidden>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div> */}
              <h3 className="how-step-title">Fund & Grow</h3>
              <p className="how-step-text">Once offers are accepted, projects get funded and teams scale — with messaging and collaboration built in.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Featured Ideas */}
      <section id="featured" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Opportunities</span>
            <h2 className="section-title">Featured Ideas</h2>
            <p className="section-subtitle">Explore innovative ideas looking for investment</p>
          </div>
          {ideas.length > 0 ? (
            <div className="ideas-grid">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} showOwner />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">No Ideas</div>
              <h3>No ideas yet</h3>
              <p>Be the first to post your vision!</p>
              <Link to="/signup" className="btn btn-primary">Post Your Idea</Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section section-cta">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Make Your Vision a Reality?</h2>
            <p className="cta-text">Join thousands of innovators and investors on FundMyVision</p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                I Have an Idea
              </Link>
              <Link to="/signup" className="btn btn-secondary btn-lg" style={{ borderColor: '#fff', color: '#fff' }}>
                I Want to Invest
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="footer-logo">Fund<span style={{ opacity: 0.6 }}>My</span>Vision</span>
              <p className="footer-tagline">Connecting Ideas with Investment</p>
            </div>
            <div className="footer-links-group">
              <h4>Platform</h4>
              <Link to="/signup">Post an Idea</Link>
              <Link to="/signup">Invest</Link>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 FundMyVision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
