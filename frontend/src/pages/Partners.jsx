import React from 'react';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';

const MotionDiv = motion.div;

const Partners = () => {
  const partners = [
    { name: 'TechCorp IT', role: 'E-Waste Provider', desc: 'Sustaining electronic lifecycles by routing obsolete servers to our facility.' },
    { name: 'Global Manufacturing', role: 'Metal Scrap Partner', desc: 'Providing hundreds of tons of raw industrial metal scrap monthly.' },
    { name: 'City Hospital', role: 'Medical Electronics Recycler', desc: 'Safely disposing batteries, old monitors, and machinery.' },
  ];

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Corporate Partners</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          We collaborate with businesses to handle mass-scale scrap and waste disposal. Partner with us to seamlessly schedule bulk pickups.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        {partners.map((partner, idx) => (
          <MotionDiv
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel"
            style={{ padding: '2rem' }}
          >
            <Building size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{partner.name}</h3>
            <p style={{ fontWeight: '600', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{partner.role}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{partner.desc}</p>
          </MotionDiv>
        ))}
      </div>

      <div style={{ marginTop: '5rem', background: 'var(--surface)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
         <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Become a Partner</h2>
         <form style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" required />
            </div>
            <div className="form-group">
                <label className="form-label">Expected Scrap Volume (Monthly)</label>
                <input type="text" className="form-input" required />
            </div>
            <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input type="email" className="form-input" required />
            </div>
            <button type="submit" className="btn btn-primary w-full">Submit Partner Application</button>
         </form>
      </div>
    </div>
  );
};

export default Partners;
