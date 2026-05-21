import { Check, ArrowRight, Star } from 'lucide-react';
import './PricingTiers.css';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'For small farms getting started with digital management.',
    features: [
      'Up to 5 workers',
      'Basic task board',
      'Manual irrigation logging',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'PHP 2,490',
    period: '/mo',
    desc: 'Full automation suite for growing farm operations.',
    features: [
      'Up to 50 workers',
      'Smart task assignment',
      'Weather-based irrigation',
      'Automated payroll',
      'Priority email support',
      'Activity log & audit trail',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: 'PHP 9,990',
    period: '/mo',
    desc: 'Enterprise features for large-scale agriculture.',
    features: [
      'Unlimited workers',
      'Multi-farm management',
      'Custom automation rules',
      'Advanced API access',
      'Dedicated account manager',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  }
];

const PricingTiers = () => {
  return (
    <div className="tiers-grid">
      {tiers.map((t, i) => (
        <div key={i} className={`tier glass ${t.highlighted ? 'tier-pop' : ''}`}>
          {t.highlighted && (
            <div className="tier-badge">
              <Star size={12} /> Most Popular
            </div>
          )}

          <div className="tier-top">
            <h3 className="tier-name">{t.name}</h3>
            <div className="tier-price-row">
              <span className="tier-price">{t.price}</span>
              {t.period && <span className="tier-period">{t.period}</span>}
            </div>
            <p className="tier-desc">{t.desc}</p>
          </div>

          <ul className="tier-list">
            {t.features.map((f, j) => (
              <li key={j}><Check size={16} className="tier-check" />{f}</li>
            ))}
          </ul>

          <button className={`btn ${t.highlighted ? 'btn-primary' : 'btn-outline'} tier-cta`}>
            {t.cta}
            <ArrowRight size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default PricingTiers;
