import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, CheckCircle2, Factory, Phone, ShieldCheck, Truck } from 'lucide-react';
import PhoneField from '../components/PhoneField';
import { api, getErrorMessage } from '../lib/api';
import { scrapCategoryFallback, serviceFallback } from '../lib/defaultData';
import {
  formatIndianPhoneForDisplay,
  getIndianPhoneValidationMessage,
  isRepeatedDigitIndianPhone,
} from '../lib/phone';

const MotionDiv = motion.div;

const partneredFallback = [
  {
    _id: 'partner-techcorp',
    companyName: 'TechCorp IT',
    companyScrapDescription: 'Used servers, desktop systems, cables, routers, and structured office e-waste.',
    selectedServices: ['E-Waste Pickup Drive'],
    selectedScrapCategories: ['E-Waste Devices'],
    expectedMonthlyVolumeKg: 280,
    hasOver15KgScrap: true,
    phone: '9876543210',
  },
  {
    _id: 'partner-global',
    companyName: 'Global Manufacturing',
    companyScrapDescription: 'Factory-grade iron, steel offcuts, aluminium sections, and mixed fabrication scrap.',
    selectedServices: ['Business Bulk Clearance', 'Factory Scrap Segregation'],
    selectedScrapCategories: ['Iron & Steel Scrap', 'Aluminium Scrap', 'Mixed Metal Scrap'],
    expectedMonthlyVolumeKg: 1200,
    hasOver15KgScrap: true,
    phone: '9988776655',
  },
  {
    _id: 'partner-hospital',
    companyName: 'City Hospital',
    companyScrapDescription: 'Old monitors, medical electronics, UPS batteries, wires, and controlled e-waste loads.',
    selectedServices: ['E-Waste Pickup Drive'],
    selectedScrapCategories: ['E-Waste Devices', 'Copper Wire Scrap'],
    expectedMonthlyVolumeKg: 160,
    hasOver15KgScrap: true,
    phone: '9123456780',
  },
];

const getServiceGroup = (service) => service.serviceGroup || 'service';

const Partners = () => {
  const [partners, setPartners] = useState(partneredFallback);
  const [services, setServices] = useState(serviceFallback);
  const [categories, setCategories] = useState(scrapCategoryFallback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    selectedServices: [],
    selectedScrapCategories: [],
    companyScrapDescription: '',
    expectedMonthlyVolumeKg: '15',
    hasOver15KgScrap: 'true',
    message: '',
  });

  useEffect(() => {
    let ignore = false;

    Promise.all([
      api.get('/partners'),
      api.get('/services'),
      api.get('/scrap/categories'),
    ])
      .then(([partnersResponse, servicesResponse, categoriesResponse]) => {
        if (ignore) {
          return;
        }

        if (Array.isArray(partnersResponse.data) && partnersResponse.data.length > 0) {
          setPartners(partnersResponse.data);
        }

        if (Array.isArray(servicesResponse.data) && servicesResponse.data.length > 0) {
          setServices(servicesResponse.data);
        }

        if (Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0) {
          setCategories(categoriesResponse.data);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const regularServices = services.filter((service) => getServiceGroup(service) !== 'homeService');
  const repeatedPhoneWarning = isRepeatedDigitIndianPhone(formData.phone)
    ? 'Phone number cannot contain the same digit repeated 10 times.'
    : '';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const toggleSelection = (field, value) => {
    setFormData((current) => {
      const currentValues = current[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const expectedMonthlyVolumeKg = Number(formData.expectedMonthlyVolumeKg || 0);

    const phoneValidationMessage = getIndianPhoneValidationMessage(formData.phone);
    if (phoneValidationMessage) {
      setError(phoneValidationMessage);
      return;
    }

    if (formData.selectedServices.length === 0 && formData.selectedScrapCategories.length === 0) {
      setError('Choose at least one service or scrap category for the partner request.');
      return;
    }

    if (Number.isNaN(expectedMonthlyVolumeKg) || expectedMonthlyVolumeKg < 15) {
      setError('Partner bookings require at least 15 kg of scrap volume.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/partners/apply', {
        ...formData,
        expectedMonthlyVolumeKg,
        hasOver15KgScrap: formData.hasOver15KgScrap === 'true',
      });

      setSuccess('Partner application submitted. Our team will review it and contact you soon.');
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        selectedServices: [],
        selectedScrapCategories: [],
        companyScrapDescription: '',
        expectedMonthlyVolumeKg: '15',
        hasOver15KgScrap: 'true',
        message: '',
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to submit the partner application right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="text-center mb-4">
        <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
          Corporate scrap and service partnerships
        </span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Corporate Partners</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          We collaborate with businesses to handle mass-scale scrap, waste pickup, and business service support. Partner applications require at least 15 kg of scrap volume.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', margin: '2rem 0 3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <Truck size={28} color="var(--primary)" />
          <h3 style={{ margin: '0.9rem 0 0.45rem' }}>Business booking options</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Partners can select from the business service options and scrap categories during the application itself.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <Factory size={28} color="var(--secondary)" />
          <h3 style={{ margin: '0.9rem 0 0.45rem' }}>Company scrap details</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Share the scrap your company handles so the admin panel shows the right business context.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <ShieldCheck size={28} color="var(--warning)" />
          <h3 style={{ margin: '0.9rem 0 0.45rem' }}>15 kg+ support</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Flagging loads above 15 kg helps us route the request to the bulk-clearance workflow sooner.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        {partners.map((partner, idx) => (
          <MotionDiv
            key={partner._id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel"
            style={{ padding: '2rem' }}
          >
            <Building size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <div className="pill" style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.12)' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              Partnered company
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{partner.companyName}</h3>
            {partner.phone ? (
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <Phone size={15} color="var(--primary)" />
                <span>{formatIndianPhoneForDisplay(partner.phone)}</span>
              </div>
            ) : null}
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {partner.companyScrapDescription || 'Partnered with us for recurring corporate scrap support.'}
            </p>
            {partner.selectedServices?.length ? (
              <div style={{ marginBottom: '0.85rem' }}>
                <div className="form-label">Services</div>
                <div className="detail-chip-list">
                  {partner.selectedServices.map((service) => (
                    <span key={service} className="detail-chip">{service}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {partner.selectedScrapCategories?.length ? (
              <div style={{ marginBottom: '0.85rem' }}>
                <div className="form-label">Scrap categories</div>
                <div className="detail-chip-list">
                  {partner.selectedScrapCategories.map((category) => (
                    <span key={category} className="detail-chip">{category}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Estimated volume: <strong style={{ color: 'var(--text-primary)' }}>{partner.expectedMonthlyVolumeKg || 0} kg/month</strong>
            </p>
          </MotionDiv>
        ))}
      </div>

      <div style={{ marginTop: '5rem', background: 'var(--surface)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
         <div className="text-center" style={{ marginBottom: '2rem' }}>
           <h2 style={{ marginBottom: '0.75rem' }}>Become a Partner</h2>
           <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto' }}>
             Fill in your company details, choose the scrap or business service options you want, and submit at least 15 kg of scrap volume for partner approval.
           </p>
         </div>

         {error ? (
           <div style={{ maxWidth: '900px', margin: '0 auto 1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
             {error}
           </div>
         ) : null}

         {success ? (
           <div style={{ maxWidth: '900px', margin: '0 auto 1rem', padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', borderRadius: '0.75rem' }}>
             {success}
           </div>
         ) : null}

         <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" name="companyName" className="form-input" value={formData.companyName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input type="text" name="contactPerson" className="form-input" value={formData.contactPerson} onChange={handleChange} required />
              </div>
              <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <PhoneField
                    id="partner-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {repeatedPhoneWarning ? (
                    <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.875rem' }}>
                      {repeatedPhoneWarning}
                    </div>
                  ) : null}
              </div>
            </div>

            <div className="form-group">
                <label className="form-label">Company Scraps</label>
                <textarea
                  name="companyScrapDescription"
                  className="form-input"
                  rows="4"
                  placeholder="Example: iron cuttings, used motors, wiring, paper cartons, e-waste devices..."
                  value={formData.companyScrapDescription}
                  onChange={handleChange}
                  required
                />
            </div>

            <div className="form-group">
                <label className="form-label">Expected Scrap Volume (Monthly in kg)</label>
                <input
                  type="number"
                  min="15"
                  step="1"
                  name="expectedMonthlyVolumeKg"
                  className="form-input"
                  value={formData.expectedMonthlyVolumeKg}
                  onChange={handleChange}
                  required
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Minimum required for partner bookings: 15 kg.
                </p>
            </div>

            <div className="form-group">
              <label className="form-label">Do you usually want pickup for scrap above 15 kg?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <label className={`selection-card ${formData.hasOver15KgScrap === 'true' ? 'selection-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="hasOver15KgScrap"
                    value="true"
                    checked={formData.hasOver15KgScrap === 'true'}
                    onChange={handleChange}
                  />
                  <div className="selection-card__meta">
                    <strong>Yes, above 15 kg</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Use the bulk-ready flow for heavier company scrap loads.
                    </p>
                  </div>
                </label>
                <label className={`selection-card ${formData.hasOver15KgScrap === 'false' ? 'selection-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="hasOver15KgScrap"
                    value="false"
                    checked={formData.hasOver15KgScrap === 'false'}
                    onChange={handleChange}
                  />
                  <div className="selection-card__meta">
                    <strong>No, mostly lighter loads</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Good for smaller recurring pickups and standard scheduling.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Choose Service Options</label>
              <div className="selection-grid">
                {regularServices.map((service) => (
                  <label
                    key={service._id || service.name}
                    className={`selection-card ${formData.selectedServices.includes(service.name) ? 'selection-card--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedServices.includes(service.name)}
                      onChange={() => toggleSelection('selectedServices', service.name)}
                    />
                    <div className="selection-card__meta">
                      <strong>{service.name}</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{service.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Choose Scrap Categories</label>
              <div className="selection-grid">
                {categories.map((category) => (
                  <label
                    key={category._id || category.name}
                    className={`selection-card ${formData.selectedScrapCategories.includes(category.name) ? 'selection-card--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedScrapCategories.includes(category.name)}
                      onChange={() => toggleSelection('selectedScrapCategories', category.name)}
                    />
                    <div className="selection-card__meta">
                      <strong>{category.name}</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{category.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Requirements</label>
              <textarea
                name="message"
                className="form-input"
                rows="4"
                placeholder="Share pickup frequency, scheduling needs, on-site support requests, or admin notes."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting application...' : 'Submit Partner Application'}
            </button>
         </form>
      </div>
    </div>
  );
};

export default Partners;
