import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, House, MapPin, Recycle, Trash2, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../lib/api';
import {
  locationFallback,
  operatingModesFallback,
  scrapCategoryFallback,
  serviceFallback,
} from '../lib/defaultData';

const MotionDiv = motion.div;

const getServiceGroup = (service) => service.serviceGroup || 'service';

const getFallbackMediaStyle = (kind) => ({
  width: '100%',
  height: '100%',
  background: kind === 'scrap'
    ? 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(59,130,246,0.16))'
    : 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(245,158,11,0.16))',
});

const ServicesSection = ({ sectionId, title, description, items, isAuthenticated }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section id={sectionId} style={{ marginTop: '3rem', scrollMarginTop: '110px' }}>
      <div className="text-center mb-4">
        <h2 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '760px', margin: '0 auto' }}>
          {description}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
        {items.map((item, index) => (
          <MotionDiv
            key={`${item.kind}-${item._id || item.name}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel"
            style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', height: '190px', overflow: 'hidden' }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={getFallbackMediaStyle(item.kind)} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.55))' }} />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.92)' }}>
                  {item.label}
                </span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: '1rem',
                  bottom: '1rem',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.16)',
                }}
              >
                {item.icon}
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{item.name}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', flexGrow: 1 }}>{item.description}</p>
              <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>{item.priceLabel}</p>
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-outline w-full">
                Book Now
              </Link>
            </div>
          </MotionDiv>
        ))}
      </div>
    </section>
  );
};

const Services = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [services, setServices] = useState(serviceFallback);
  const [categories, setCategories] = useState(scrapCategoryFallback);
  const [locations, setLocations] = useState(locationFallback);
  const [operatingModes, setOperatingModes] = useState(operatingModesFallback);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      api.get('/services'),
      api.get('/scrap/categories'),
      api.get('/locations'),
    ])
      .then(([servicesResponse, categoriesResponse, locationsResponse]) => {
        if (ignore) {
          return;
        }

        if (Array.isArray(servicesResponse.data) && servicesResponse.data.length > 0) {
          setServices(servicesResponse.data);
        }

        if (Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0) {
          setCategories(categoriesResponse.data);
        }

        if (Array.isArray(locationsResponse.data.locations) && locationsResponse.data.locations.length > 0) {
          setLocations(locationsResponse.data.locations);
        }

        if (Array.isArray(locationsResponse.data.operatingModes) && locationsResponse.data.operatingModes.length > 0) {
          setOperatingModes(locationsResponse.data.operatingModes);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace('#', '');
    const scrollToSection = () => {
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const timerId = window.setTimeout(scrollToSection, 120);
    return () => window.clearTimeout(timerId);
  }, [location.hash, services, categories]);

  const serviceCards = services.map((service) => ({
    ...service,
    kind: 'service',
    icon: getServiceGroup(service) === 'homeService'
      ? <House size={30} color="var(--warning)" />
      : <Truck size={30} color="var(--secondary)" />,
    label: getServiceGroup(service) === 'homeService' ? 'Home Service' : 'Service',
    priceLabel: `From Rs ${service.basePrice}`,
  }));

  const scrapCards = categories.map((category) => ({
    ...category,
    kind: 'scrap',
    icon: <Trash2 size={30} color="var(--primary)" />,
    label: 'Scrap',
    priceLabel: `Approx Rs ${category.basePrice}/kg`,
  }));
  const mainServiceCards = serviceCards.filter((service) => getServiceGroup(service) !== 'homeService');
  const homeServiceCards = serviceCards.filter((service) => getServiceGroup(service) === 'homeService');

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="text-center mb-4">
        <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Area services and booking catalog</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', marginBottom: '1rem' }}>Services, scrap types, and pincodes</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '760px', margin: '0 auto' }}>
          Browse the available scrap categories, service offerings, operating modes, and pincode coverage before creating a booking.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', margin: '2rem 0 3rem' }}>
        {operatingModes.map((mode, index) => (
          <div key={mode} className="glass-panel" style={{ padding: '1.5rem' }}>
            {index === 0 ? <Truck size={30} color="var(--primary)" /> : <Factory size={30} color="var(--secondary)" />}
            <h3 style={{ margin: '1rem 0 0.5rem' }}>{mode}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {index === 0
                ? 'For home pickups, apartments, and regular customer bookings.'
                : 'For business and bulk scrap operations with larger quantities.'}
            </p>
          </div>
        ))}
      </div>

      <ServicesSection
        sectionId="scrap-categories"
        title="Scrap Categories"
        description="Choose the type of scrap you want to sell or schedule for pickup."
        items={scrapCards}
        isAuthenticated={isAuthenticated}
      />

      <ServicesSection
        sectionId="services"
        title="Services"
        description="These are the regular scrap, pickup, and business support services."
        items={mainServiceCards}
        isAuthenticated={isAuthenticated}
      />

      <ServicesSection
        sectionId="home-services"
        title="Home Services"
        description="All cleaning, plumbing, electrical, and labour support services are grouped here under home services."
        items={homeServiceCards}
        isAuthenticated={isAuthenticated}
      />

      <div style={{ marginTop: '4rem' }}>
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>Serviceable area pincodes</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Register and book using one of these enabled locations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {locations.map((location) => (
            <div key={location.pinCode} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <MapPin size={16} color="var(--primary)" />
                <strong>{location.pinCode}</strong>
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>{location.areaName}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{location.city}, {location.state}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '4rem', padding: '2rem', display: 'grid', gap: '0.75rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Recycle size={36} color="var(--primary)" />
        </div>
        <h2>Ready to book in your area?</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Choose your pincode, select a service or scrap type, and submit from the dashboard.
        </p>
        <div>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-primary">
            {isAuthenticated ? 'Open Booking Dashboard' : 'Login to Continue'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
