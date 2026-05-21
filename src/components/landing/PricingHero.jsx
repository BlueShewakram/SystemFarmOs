import React from 'react';
import { CheckCircle2, ArrowRight, Crown } from 'lucide-react';
import './PricingHero.css';

const PricingHero = () => {
  return (
    <div className="ph-wrapper">
      <div className="ph-glow"></div>
      <div className="ph-card glass float-slow">
        <div className="ph-top">
          <div className="ph-crown-badge">
            <Crown size={16} />
            <span>Enterprise</span>
          </div>
          <h3 className="ph-title">FarmOS Unlimited</h3>
          <p className="ph-desc">The complete operating system for large-scale agricultural enterprises. Custom everything.</p>
          
          <div className="ph-price-block">
            <span className="ph-price">Custom</span>
            <span className="ph-note">Tailored to your operation size</span>
          </div>

          <a href="/auth" className="btn btn-primary btn-lg ph-cta">
            Contact Enterprise Sales
            <ArrowRight size={18} />
          </a>
        </div>

        <div className="ph-divider"></div>

        <div className="ph-bottom">
          <h4 className="ph-feat-title">Everything in Business, plus:</h4>
          <div className="ph-feat-grid">
            <ul>
              <li><CheckCircle2 size={16} className="ph-check" /> Unlimited Farm Workers</li>
              <li><CheckCircle2 size={16} className="ph-check" /> Multi-Farm Dashboard</li>
              <li><CheckCircle2 size={16} className="ph-check" /> AI-Powered Analytics</li>
              <li><CheckCircle2 size={16} className="ph-check" /> Custom Hardware Integrations</li>
            </ul>
            <ul>
              <li><CheckCircle2 size={16} className="ph-check" /> White-Label Reports</li>
              <li><CheckCircle2 size={16} className="ph-check" /> Dedicated Account Manager</li>
              <li><CheckCircle2 size={16} className="ph-check" /> 99.99% SLA Guarantee</li>
              <li><CheckCircle2 size={16} className="ph-check" /> 24/7 Priority Phone Support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingHero;
