import React, { useEffect, useState } from 'react';
import { CalendarClock, LogOut, MapPin, Package, Recycle, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api, getAuthConfig, getErrorMessage } from '../lib/api';
import {
  locationFallback,
  operatingModesFallback,
  scrapCategoryFallback,
  serviceFallback,
} from '../lib/defaultData';
import {
  buildServiceAreaAddress,
  findLocationByPinCode,
  getPinCodeStatus,
  normalizePinCode,
} from '../lib/locationLookup';

const getServiceGroup = (service) => service.serviceGroup || 'service';

const buildDefaultSchedule = () => {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);
  return next.toISOString().slice(0, 16);
};

const getBookingCode = (booking) => `#${String(booking?._id || '').slice(-6).toUpperCase() || 'NEW'}`;

const getStatusStyles = (status) => {
  if (status === 'Completed') {
    return { background: 'rgba(16, 185, 129, 0.14)', color: 'var(--success)' };
  }

  if (status === 'Rejected') {
    return { background: 'rgba(239, 68, 68, 0.12)', color: 'var(--error)' };
  }

  if (status === 'Accepted') {
    return { background: 'rgba(59, 130, 246, 0.12)', color: 'var(--secondary)' };
  }

  return { background: 'rgba(245, 158, 11, 0.14)', color: 'var(--warning)' };
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { token, user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [categories, setCategories] = useState(scrapCategoryFallback);
  const [services, setServices] = useState(serviceFallback);
  const [locations, setLocations] = useState(locationFallback);
  const [operatingModes, setOperatingModes] = useState(operatingModesFallback);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    bookingType: 'scrap',
    itemId: '',
    weightOrQuantity: '10',
    scheduledAt: buildDefaultSchedule(),
    address: '',
    pinCode: user?.pinCode || '',
    operatingMode: user?.operatingMode || operatingModesFallback[0],
    notes: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const config = getAuthConfig(token);
        const [profileResponse, categoriesResponse, servicesResponse, locationsResponse, bookingsResponse] = await Promise.all([
          api.get('/auth/profile', config),
          api.get('/scrap/categories'),
          api.get('/services'),
          api.get('/locations'),
          api.get('/scrap/mybookings', config),
        ]);

        if (ignore) {
          return;
        }

        setProfile(profileResponse.data);
        updateUser(profileResponse.data);

        if (Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0) {
          setCategories(categoriesResponse.data);
        }

        if (Array.isArray(servicesResponse.data) && servicesResponse.data.length > 0) {
          setServices(servicesResponse.data);
        }

        if (Array.isArray(locationsResponse.data.locations) && locationsResponse.data.locations.length > 0) {
          setLocations(locationsResponse.data.locations);
        }

        if (Array.isArray(locationsResponse.data.operatingModes) && locationsResponse.data.operatingModes.length > 0) {
          setOperatingModes(locationsResponse.data.operatingModes);
        }

        if (Array.isArray(bookingsResponse.data)) {
          setBookings(bookingsResponse.data);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError, 'Unable to load your dashboard data.'));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    if (token) {
      loadDashboard();
    }

    return () => {
      ignore = true;
    };
  }, [token, updateUser]);

  useEffect(() => {
    setFormData((current) => {
      const availableItems = current.bookingType === 'scrap' ? categories : services;
      const nextPinCode = current.pinCode || profile?.pinCode || '';
      const nextLocation = findLocationByPinCode(locations, nextPinCode);

      return {
        ...current,
        itemId: availableItems.some((item) => item._id === current.itemId) ? current.itemId : availableItems[0]?._id || '',
        address: buildServiceAreaAddress(nextLocation),
        pinCode: nextPinCode,
        operatingMode: current.operatingMode || profile?.operatingMode || operatingModes[0] || operatingModesFallback[0],
      };
    });
  }, [categories, services, locations, operatingModes, profile, formData.bookingType]);

  const normalizedPinCode = normalizePinCode(formData.pinCode);
  const selectedLocation = findLocationByPinCode(locations, normalizedPinCode);
  const pinCodeStatus = getPinCodeStatus(normalizedPinCode, selectedLocation);
  const detectedServiceArea = buildServiceAreaAddress(selectedLocation);
  const selectedItems = formData.bookingType === 'scrap' ? categories : services;
  const regularServices = services.filter((service) => getServiceGroup(service) !== 'homeService');
  const homeServices = services.filter((service) => getServiceGroup(service) === 'homeService');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'pinCode' ? normalizePinCode(value) : value,
      itemId: name === 'bookingType'
        ? ''
        : current.itemId,
      weightOrQuantity: name === 'bookingType'
        ? (value === 'scrap' ? '10' : '1')
        : current.weightOrQuantity,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (pinCodeStatus !== 'serviceable' || !selectedLocation) {
      setError('Service is not available for this PIN code yet.');
      return;
    }

    setIsSubmitting(true);

    try {
      const config = getAuthConfig(token);
      const commonPayload = {
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        address: detectedServiceArea,
        pinCode: normalizedPinCode,
        notes: formData.notes,
        operatingMode: formData.operatingMode,
      };

      const request =
        formData.bookingType === 'scrap'
          ? api.post(
              '/scrap/book',
              {
                ...commonPayload,
                categoryId: formData.itemId,
                weight: Number(formData.weightOrQuantity),
              },
              config
            )
          : api.post(
              '/services/book',
              {
                ...commonPayload,
                serviceId: formData.itemId,
                quantity: Number(formData.weightOrQuantity),
              },
              config
            );

      const { data } = await request;
      setBookings((current) => [data, ...current]);
      setSuccess('Booking request created successfully.');
      setFormData((current) => ({
        ...current,
        weightOrQuantity: current.bookingType === 'scrap' ? '10' : '1',
        scheduledAt: buildDefaultSchedule(),
        notes: '',
      }));
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to create the booking.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {profile?.fullName || 'Customer'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create a new booking, review serviceable pincodes, and manage your recent requests.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: '0.5rem' }} />
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{bookings.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Total bookings</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{locations.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Serviceable areas</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{operatingModes.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Operating modes</div>
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', borderRadius: '0.75rem' }}>
          {success}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
              <Recycle size={20} color="var(--primary)" />
              <h2>Schedule New Booking</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Select the booking type, enter a 6-digit PIN code, and let the app detect the service area automatically.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Booking Type</label>
                <select name="bookingType" className="form-input" value={formData.bookingType} onChange={handleChange}>
                  <option value="scrap">Scrap Collection</option>
                  <option value="service">Area Service Booking</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{formData.bookingType === 'scrap' ? 'Scrap Category' : 'Service'}</label>
                <select name="itemId" className="form-input" value={formData.itemId} onChange={handleChange} required>
                  {formData.bookingType === 'scrap'
                    ? selectedItems.map((item) => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                      ))
                    : (
                        <>
                          <optgroup label="Services">
                            {regularServices.map((item) => (
                              <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Home Services">
                            {homeServices.map((item) => (
                              <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                </select>
              </div>

              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 220px' }}>
                  <label className="form-label">{formData.bookingType === 'scrap' ? 'Weight (kg)' : 'Quantity'}</label>
                  <input name="weightOrQuantity" type="number" min="1" className="form-input" value={formData.weightOrQuantity} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: '1 1 220px' }}>
                  <label className="form-label">Preferred Time</label>
                  <input name="scheduledAt" type="datetime-local" className="form-input" value={formData.scheduledAt} onChange={handleChange} required />
                </div>
              </div>

              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 220px' }}>
                  <label className="form-label">Pincode</label>
                  <input
                    name="pinCode"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    className="form-input"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit PIN code"
                    required
                  />
                  {pinCodeStatus === 'partial' ? (
                    <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Enter all 6 digits to detect the service area.
                    </div>
                  ) : null}
                  {pinCodeStatus === 'unavailable' ? (
                    <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.875rem' }}>
                      Service is not available for this PIN code.
                    </div>
                  ) : null}
                </div>
                <div className="form-group" style={{ flex: '1 1 220px' }}>
                  <label className="form-label">Operating Mode</label>
                  <select name="operatingMode" className="form-input" value={formData.operatingMode} onChange={handleChange} required>
                    {operatingModes.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detected Service Area</label>
                <input type="text" className="form-input" value={detectedServiceArea || 'No service area detected yet'} readOnly />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="form-input" rows="3" value={formData.notes} onChange={handleChange} placeholder="Add landmark, preferred contact time, or extra service details." />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || pinCodeStatus !== 'serviceable'}>
                {isSubmitting ? 'Submitting booking...' : 'Request Booking'}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <Package size={20} color="var(--secondary)" />
              <h2>Your Recent Requests</h2>
            </div>

            {bookings.length === 0 ? (
              <div style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.06)', color: 'var(--text-secondary)' }}>
                No bookings yet. Create your first request using the form above.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Booking</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Area</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Time</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Mode</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{getBookingCode(booking)}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div>{booking.item?.name || booking.itemModel}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{booking.bookingType}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{booking.areaName || booking.pinCode}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(booking.scheduledAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{booking.operatingMode}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 600, ...getStatusStyles(booking.status) }}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem' }}>
              {(profile?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <h3>{profile?.fullName}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{profile?.email}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{profile?.phone}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <User size={18} color="var(--primary)" />
              <h3>Profile details</h3>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>Pincode:</strong> {profile?.pinCode}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Area:</strong> {profile?.areaName}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>City:</strong> {profile?.city}, {profile?.state}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Operating mode:</strong> {profile?.operatingMode}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <MapPin size={18} color="var(--secondary)" />
              <h3>Selected service area</h3>
            </div>
            {pinCodeStatus === 'serviceable' && selectedLocation ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700 }}>{selectedLocation.areaName}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedLocation.city}, {selectedLocation.state}</div>
                <div className="pill" style={{ width: 'fit-content' }}>{selectedLocation.pinCode}</div>
              </div>
            ) : pinCodeStatus === 'unavailable' ? (
              <p style={{ color: 'var(--error)' }}>Service is not available for this PIN code.</p>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Enter a PIN code in the booking form.</p>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <ul style={{ display: 'grid', gap: '0.85rem' }}>
              <li className="flex items-center gap-2"><CalendarClock size={18} /> Scheduling support</li>
              <li className="flex items-center gap-2"><Settings size={18} /> Operating mode selection</li>
              <li className="flex items-center gap-2"><Package size={18} /> Request tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
