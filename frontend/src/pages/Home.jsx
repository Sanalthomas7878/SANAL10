import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Factory, Leaf, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../lib/api';
import { locationFallback, operatingModesFallback } from '../lib/defaultData';

const floatingScrap = [
  { label: 'Copper Wire', top: '8%', left: '10%', delay: 0 },
  { label: 'E-Waste', top: '20%', right: '4%', delay: 0.2 },
  { label: 'Paper Bundles', bottom: '18%', left: '4%', delay: 0.35 },
  { label: 'Steel Mix', bottom: '10%', right: '8%', delay: 0.5 },
];

const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionHeading = motion.h1;
const MotionParagraph = motion.p;

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [locations, setLocations] = useState(locationFallback);
  const [operatingModes, setOperatingModes] = useState(operatingModesFallback);

  useEffect(() => {
    let ignore = false;

    api.get('/locations')
      .then(({ data }) => {
        if (ignore) {
          return;
        }

        if (Array.isArray(data.locations) && data.locations.length > 0) {
          setLocations(data.locations);
        }

        if (Array.isArray(data.operatingModes) && data.operatingModes.length > 0) {
          setOperatingModes(data.operatingModes);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const heroLocations = locations.slice(0, 6);

  return (
    <div>
      <section
        style={{
          padding: '5rem 0 4rem',
          background: 'linear-gradient(135deg, #f3f8f4 0%, #eef7ff 45%, #fff4e8 100%)',
          overflow: 'hidden',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div>
            <MotionSpan
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="pill"
              style={{ marginBottom: '1rem', display: 'inline-flex' }}
            >
              Live registration, booking database, and pincode service coverage
            </MotionSpan>
            <MotionHeading
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: '1.05', marginBottom: '1rem' }}
            >
              Scrap pickup built for <span style={{ color: 'var(--primary)' }}>Mangalore</span> and nearby towns
            </MotionHeading>
            <MotionParagraph
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '620px', marginBottom: '2rem' }}
            >
              Register users, log in, book pickups, and manage serviceable areas with pin codes for Mangaluru, Jadkal, Kundapura, Byndoor, and nearby locations.
            </MotionParagraph>

            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex gap-4"
              style={{ flexWrap: 'wrap', marginBottom: '1.5rem' }}
            >
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary" style={{ padding: '1rem 1.75rem' }}>
                {isAuthenticated ? 'Open Dashboard' : 'Create Account'}
                <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
              </Link>
              <Link to="/services" className="btn btn-outline" style={{ padding: '1rem 1.75rem' }}>
                View Services
              </Link>
            </MotionDiv>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {heroLocations.map((location) => (
                <span key={location.pinCode} className="pill">
                  {location.areaName} {location.pinCode}
                </span>
              ))}
            </div>
          </div>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              position: 'relative',
              minHeight: '420px',
              borderRadius: '2rem',
              background: 'radial-gradient(circle at top, rgba(16,185,129,0.2), rgba(255,255,255,0.8) 46%, rgba(255,255,255,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.12)',
              overflow: 'hidden',
            }}
          >
            <MotionDiv
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: '12% 16%',
                borderRadius: '999px',
                border: '1px dashed rgba(15, 23, 42, 0.12)',
              }}
            />
            <MotionDiv
              animate={{ rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: '22% 24%',
                borderRadius: '999px',
                border: '1px dashed rgba(16, 185, 129, 0.18)',
              }}
            />

            {floatingScrap.map((item) => (
              <MotionDiv
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
                transition={{ delay: item.delay, duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass-panel"
                style={{
                  position: 'absolute',
                  padding: '0.85rem 1rem',
                  fontWeight: 600,
                  ...item,
                }}
              >
                {item.label}
              </MotionDiv>
            ))}

            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                inset: '26% 18%',
                padding: '2rem',
                display: 'grid',
                gap: '1rem',
              }}
            >
              <span className="pill" style={{ width: 'fit-content' }}>Simple scrap animation</span>
              <h2 style={{ fontSize: '2rem' }}>Bookings flow into one place</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                User registration, login, booking requests, service areas, and operating modes are now connected to the app structure.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>9</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Seeded pincodes</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>2</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Operating modes</div>
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.3rem', marginBottom: '0.75rem' }}>Why this setup is useful</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto' }}>
              The platform now supports real user onboarding, booking storage, and pincode-based coverage checks for your target area.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <Leaf size={38} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>User Database</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Stores user details, address, pincode, operating mode, and service area.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <Truck size={38} color="var(--secondary)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Booking Database</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Handles scrap bookings and service bookings in one collection with statuses.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <ShieldCheck size={38} color="var(--warning)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Pincode Validation</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Only serviceable areas can register and create booking requests.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 4rem' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.3rem', marginBottom: '0.75rem' }}>Two operating modes</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              These two booking flows are available throughout registration and dashboard booking.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {operatingModes.map((mode, index) => (
              <MotionDiv
                key={mode}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel"
                style={{ padding: '1.75rem' }}
              >
                {index === 0 ? <Truck size={32} color="var(--primary)" /> : <Factory size={32} color="var(--secondary)" />}
                <h3 style={{ margin: '1rem 0 0.5rem' }}>{mode}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {index === 0
                    ? 'Best for homes and small pickups where the team comes directly to the customer address.'
                    : 'Designed for companies and bulk scrap handling with larger quantity requests.'}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 5rem' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.3rem', marginBottom: '0.75rem' }}>Serviceable pincodes</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Seeded areas include Mangalore, Jadkal, Kundapura, Byndoor, and nearby Mangaluru zones.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {locations.map((location) => (
              <div key={location.pinCode} className="glass-panel" style={{ padding: '1.25rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                  <MapPin size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 700 }}>{location.pinCode}</span>
                </div>
                <h3 style={{ marginBottom: '0.25rem' }}>{location.areaName}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{location.city}, {location.state}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
