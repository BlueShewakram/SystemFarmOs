import HeroSection from '../components/landing/HeroSection';
import ZigzagFeatures from '../components/landing/ZigzagFeatures';
import TabbedFeatures from '../components/landing/TabbedFeatures';
import farmvid from '../assets/farmvid.mp4';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <video className="landing-video-bg" autoPlay muted loop playsInline>
        <source src={farmvid} type="video/mp4" />
      </video>
      <div className="landing-video-overlay"></div>
      <nav className="landing-nav glass-panel">
        <div className="container nav-container">
          <div className="logo text-gradient-accent">FarmOS</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="/auth" className="btn btn-secondary btn-sm">Login</a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        
        <section id="features" className="section bg-secondary">
          <div className="container">
            <div className="section-header">
              <h2 className="text-gradient">Smart Farm Management</h2>
              <p className="text-secondary">Everything you need to run your farm efficiently.</p>
            </div>
            <ZigzagFeatures />
          </div>
        </section>

        <section className="section bg-primary">
          <div className="container">
            <div className="section-header">
              <h2 className="text-gradient">Automate Your Workflow</h2>
              <p className="text-secondary">Let the system handle the tedious tasks.</p>
            </div>
            <TabbedFeatures />
          </div>
        </section>
      </main>

      <footer className="landing-footer bg-primary border-t border-glass">
        <div className="container">
          <p className="text-secondary text-center">Copyright 2026 FarmOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

