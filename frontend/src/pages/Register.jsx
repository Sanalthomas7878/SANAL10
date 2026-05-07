import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, House, MapPin, Truck, UserPlus } from 'lucide-react';
import PasswordField from '../components/PasswordField';
import PhoneField from '../components/PhoneField';
import { useAuth } from '../context/useAuth';
import { api, getErrorMessage } from '../lib/api';
import { locationFallback, operatingModesFallback, serviceFallback } from '../lib/defaultData';
import { getIndianPhoneValidationMessage, isRepeatedDigitIndianPhone } from '../lib/phone';
import {
  buildServiceAreaAddress,
  findLocationByPinCode,
  getPinCodeStatus,
  normalizePinCode,
} from '../lib/locationLookup';

const MotionDiv = motion.div;
const getServiceGroup = (service) => service.serviceGroup || 'service';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [locations, setLocations] = useState(locationFallback);
  const [operatingModes, setOperatingModes] = useState(operatingModesFallback);
  const [services, setServices] = useState(serviceFallback);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    pinCode: '',
    operatingMode: operatingModesFallback[0],
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      api.get('/locations'),
      api.get('/services'),
    ])
      .then(([locationsResult, servicesResult]) => {
        if (ignore) {
          return;
        }

        if (locationsResult.status === 'fulfilled') {
          const { data } = locationsResult.value;

          if (Array.isArray(data.locations) && data.locations.length > 0) {
            setLocations(data.locations);
          }

          if (Array.isArray(data.operatingModes) && data.operatingModes.length > 0) {
            setOperatingModes(data.operatingModes);
            setFormData((current) => ({
              ...current,
              operatingMode: current.operatingMode || data.operatingModes[0],
            }));
          }
        }

        if (servicesResult.status === 'fulfilled' && Array.isArray(servicesResult.value.data) && servicesResult.value.data.length > 0) {
          setServices(servicesResult.value.data);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const normalizedPinCode = normalizePinCode(formData.pinCode);
  const selectedLocation = findLocationByPinCode(locations, normalizedPinCode);
  const pinCodeStatus = getPinCodeStatus(normalizedPinCode, selectedLocation);
  const detectedServiceArea = buildServiceAreaAddress(selectedLocation);
  const regularServices = services.filter((service) => getServiceGroup(service) !== 'homeService');
  const homeServices = services.filter((service) => getServiceGroup(service) === 'homeService');
  const repeatedPhoneWarning = isRepeatedDigitIndianPhone(formData.phone)
    ? 'Phone number cannot contain the same digit repeated 10 times.'
    : '';

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === 'pinCode' ? normalizePinCode(value) : value,
    }));
  };

  const handlePinCodeSelect = (pinCode) => {
    setFormData((current) => ({
      ...current,
      pinCode,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const phoneValidationMessage = getIndianPhoneValidationMessage(formData.phone);
    if (phoneValidationMessage) {
      setError(phoneValidationMessage);
      return;
    }

    if (pinCodeStatus !== 'serviceable' || !selectedLocation) {
      setError('Service is not available for this PIN code yet.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        ...formData,
        pinCode: normalizedPinCode,
        address: detectedServiceArea,
      });
      navigate('/login', {
        state: { message: 'Account created successfully. Please sign in.' },
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to create your account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <video
        className="auth-page__video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/media/auth-background.mp4" type="video/mp4" />
      </video>
      <div
        className="container auth-page__grid"
      >
        <MotionDiv
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel auth-panel auth-panel--hero"
          style={{ padding: '2rem' }}
        >
          <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Register page</span>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>Create your EcoScrap account</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your account stores your login details, phone number, PIN code, detected service area, and operating mode.
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{locations.length}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Serviceable pincodes ready</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{operatingModes.length}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Operating modes available</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{services.length}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Services currently available</div>
            </div>
            {pinCodeStatus === 'serviceable' && selectedLocation ? (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.7)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.35rem' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <strong>Detected service area</strong>
                </div>
                <div>{selectedLocation.areaName}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedLocation.city}, {selectedLocation.state}</div>
              </div>
            ) : null}
            {pinCodeStatus === 'serviceable' && selectedLocation ? (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.12)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                  <strong>Service is available here</strong>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Register with PIN code {selectedLocation.pinCode} to access scrap pickup and home service bookings in this area.
                </div>
              </div>
            ) : null}
            {pinCodeStatus === 'unavailable' ? (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--error)' }}>
                Service is not available for PIN code {normalizedPinCode}.
              </div>
            ) : null}
            {pinCodeStatus === 'serviceable' && selectedLocation ? (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.7)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                  <Truck size={16} color="var(--secondary)" />
                  <strong>Available services</strong>
                </div>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Services</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {regularServices.map((service) => (
                        <span key={service._id} className="pill">{service.name}</span>
                      ))}
                    </div>
                  </div>
                  {homeServices.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2" style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        <House size={14} color="var(--warning)" />
                        <span>Home Services</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {homeServices.map((service) => (
                          <span key={service._id} className="pill">{service.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel auth-panel auth-panel--form"
          style={{ width: '100%', maxWidth: '560px', justifySelf: 'center', padding: '2rem' }}
        >
          <div className="text-center mb-4">
            <UserPlus size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Enter your 6-digit PIN code to detect your service area</p>
          </div>

          {error ? (
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="fullName" className="form-input" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <PhoneField
                id="register-phone"
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
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordField name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                name="pinCode"
                className="form-input"
                value={formData.pinCode}
                onChange={handleChange}
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter 6-digit PIN code"
                required
              />
              {pinCodeStatus === 'partial' ? (
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Enter all 6 digits to detect your service area.
                </div>
              ) : null}
              {pinCodeStatus === 'serviceable' && selectedLocation ? (
                <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontSize: '0.875rem' }}>
                  Service is available for this PIN code.
                </div>
              ) : null}
              {pinCodeStatus === 'unavailable' ? (
                <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.875rem' }}>
                  Service is not available for this PIN code.
                </div>
              ) : null}
            </div>
            <div className="form-group">
              <label className="form-label">Service Available Codes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {locations.map((location) => {
                  const isSelected = location.pinCode === normalizedPinCode;

                  return (
                    <button
                      key={location.pinCode}
                      type="button"
                      className="pill"
                      onClick={() => handlePinCodeSelect(location.pinCode)}
                      title={`${location.areaName}, ${location.city}`}
                      style={{
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        background: isSelected ? 'rgba(16, 185, 129, 0.14)' : undefined,
                        color: isSelected ? 'var(--primary)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {location.pinCode}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Select any serviceable PIN code to auto-fill the field and detect the area.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Detected Service Area</label>
              <input
                type="text"
                className="form-input"
                value={detectedServiceArea || 'No service area detected yet'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label className="form-label">Operating Mode</label>
              <select name="operatingMode" className="form-input" value={formData.operatingMode} onChange={handleChange} required>
                {operatingModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || pinCodeStatus !== 'serviceable'}>
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>
            <div className="text-center mt-4">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login here</Link>
              </p>
            </div>
          </form>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Register;
