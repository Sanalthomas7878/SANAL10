import React, { useEffect, useRef, useState } from 'react';
import { Building2, LogOut, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api, getAuthConfig, getErrorMessage } from '../lib/api';
import { formatIndianPhoneForDisplay } from '../lib/phone';

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

const getPartnerStatusStyles = (status) => {
  if (status === 'Partnered') {
    return { background: 'rgba(16, 185, 129, 0.14)', color: 'var(--success)' };
  }

  if (status === 'Contacted') {
    return { background: 'rgba(59, 130, 246, 0.12)', color: 'var(--secondary)' };
  }

  return { background: 'rgba(245, 158, 11, 0.14)', color: 'var(--warning)' };
};

const getCatalogItemKey = (type, id) => `${type}:${id}`;
const formatServiceGroupLabel = (serviceGroup) => (serviceGroup === 'homeService' ? 'Home Service' : 'Service');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const usersSectionRef = useRef(null);
  const partnersSectionRef = useRef(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalPartners: 0,
    pendingPartners: 0,
  });
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [catalog, setCatalog] = useState({ categories: [], services: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPartnerId, setUpdatingPartnerId] = useState('');
  const [updatingCatalogKey, setUpdatingCatalogKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeDetail, setActiveDetail] = useState('users');

  useEffect(() => {
    let ignore = false;

    const loadAdminData = async () => {
      setIsLoading(true);
      setError('');
      setSuccess('');

      try {
        const config = getAuthConfig(token);
        const [statsResponse, usersResponse, bookingsResponse, partnersResponse, catalogResponse] = await Promise.all([
          api.get('/admin/stats', config),
          api.get('/admin/users', config),
          api.get('/admin/bookings', config),
          api.get('/admin/partners', config),
          api.get('/admin/catalog', config),
        ]);

        if (ignore) {
          return;
        }

        setStats(statsResponse.data);
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
        setPartners(Array.isArray(partnersResponse.data) ? partnersResponse.data : []);
        setCatalog({
          categories: Array.isArray(catalogResponse.data?.categories) ? catalogResponse.data.categories : [],
          services: Array.isArray(catalogResponse.data?.services) ? catalogResponse.data.services : [],
        });
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError, 'Unable to load admin data.'));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    if (token) {
      loadAdminData();
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const updatePartnerStatus = async (id, status) => {
    setError('');
    setSuccess('');
    setUpdatingPartnerId(id);

    const currentPartner = partners.find((partner) => partner._id === id);
    const previousStatus = currentPartner?.status;

    try {
      const config = getAuthConfig(token);
      const { data } = await api.put(`/admin/partners/${id}/status`, { status }, config);

      setPartners((currentPartners) =>
        currentPartners.map((partner) => (partner._id === id ? { ...partner, ...data } : partner))
      );

      setStats((currentStats) => ({
        ...currentStats,
        pendingPartners:
          currentStats.pendingPartners
          + (previousStatus === 'Pending' && status !== 'Pending' ? -1 : 0)
          + (previousStatus !== 'Pending' && status === 'Pending' ? 1 : 0),
      }));
      setSuccess(`Partner status updated to ${status}.`);
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update partner status.'));
    } finally {
      setUpdatingPartnerId('');
    }
  };

  const handleCatalogFieldChange = (collection, itemId, field, value) => {
    setCatalog((currentCatalog) => ({
      ...currentCatalog,
      [collection]: currentCatalog[collection].map((item) => (
        item._id === itemId
          ? {
              ...item,
              [field]: field === 'basePrice' ? value.replace(/[^\d.]/g, '') : value,
            }
          : item
      )),
    }));
  };

  const saveCatalogItem = async (type, item) => {
    setError('');
    setSuccess('');

    const collection = type === 'scrap' ? 'categories' : 'services';
    const updatingKey = getCatalogItemKey(type, item._id);
    setUpdatingCatalogKey(updatingKey);

    try {
      const config = getAuthConfig(token);
      const endpoint = type === 'scrap'
        ? `/admin/catalog/scrap/${item._id}`
        : `/admin/catalog/services/${item._id}`;

      const { data } = await api.put(endpoint, {
        basePrice: Number(item.basePrice),
        imageUrl: item.imageUrl,
      }, config);

      setCatalog((currentCatalog) => ({
        ...currentCatalog,
        [collection]: currentCatalog[collection].map((currentItem) => (
          currentItem._id === item._id ? data : currentItem
        )),
      }));
      setSuccess(`${item.name} updated successfully.`);
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update catalog item.'));
    } finally {
      setUpdatingCatalogKey('');
    }
  };

  const jumpToDetail = (detailKey) => {
    setActiveDetail(detailKey);

    const targetRef = detailKey === 'users'
      ? usersSectionRef
      : partnersSectionRef;

    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visiblePartners = activeDetail === 'pendingPartners'
    ? partners.filter((partner) => partner.status === 'Pending')
    : partners;
  const editableServices = catalog.services.filter((service) => service.serviceGroup !== 'homeService');

  const partnersHeading = activeDetail === 'pendingPartners' ? 'Pending Partner Details' : 'Partner Applications';
  const partnersDescription = activeDetail === 'pendingPartners'
    ? 'Showing only partner applications that still need follow-up.'
    : 'Review partner signups, selected services, scrap categories, company scrap details, and whether the company usually books loads above 15 kg.';
  const summaryCards = [
    {
      key: 'users',
      value: stats.totalUsers,
      label: 'Total Users',
      icon: <Users color="var(--secondary)" />,
      iconBackground: 'rgba(59, 130, 246, 0.1)',
    },
    {
      key: 'partners',
      value: stats.totalPartners,
      label: 'Partner Applications',
      icon: <Building2 color="var(--secondary)" />,
      iconBackground: 'rgba(59, 130, 246, 0.1)',
    },
    {
      key: 'pendingPartners',
      value: stats.pendingPartners,
      label: 'Pending Partners',
      icon: <Building2 color="var(--success)" />,
      iconBackground: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
      <div className="flex justify-between items-start" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Admin Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review user counts, booking counts, partner applications, and pending requests from the shared operations database.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline flex items-center gap-2" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {summaryCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`glass-panel admin-summary-card ${activeDetail === card.key ? 'admin-summary-card--active' : ''}`}
            onClick={() => jumpToDetail(card.key)}
          >
            <div style={{ padding: '1rem', background: card.iconBackground, borderRadius: '50%' }}>{card.icon}</div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.7rem', lineHeight: 1 }}>{card.value}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div ref={usersSectionRef} className="glass-panel admin-detail-section" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>User Details</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          All registered users with their contact number, service area, operating mode, and account role.
        </p>
        {users.length === 0 ? (
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.06)', color: 'var(--text-secondary)' }}>
            No user data available yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '880px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>User</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Area</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Mode</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{user.fullName || 'Unknown user'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email || 'No email'}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>{formatIndianPhoneForDisplay(user.phone) || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{user.areaName || user.pinCode || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{user.operatingMode || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem', textTransform: 'capitalize' }}>{user.role || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div ref={partnersSectionRef} className="glass-panel admin-detail-section" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{partnersHeading}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {partnersDescription}
        </p>
        {visiblePartners.length === 0 ? (
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.06)', color: 'var(--text-secondary)' }}>
            No partner applications match this view.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {visiblePartners.map((partner) => (
              <div
                key={partner._id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.64)',
                }}
              >
                <div className="flex justify-between items-center" style={{ gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{partner.companyName}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {partner.contactPerson || 'Unknown contact'} • {partner.email || 'No email'} • {partner.phone ? formatIndianPhoneForDisplay(partner.phone) : 'No phone'}
                    </p>
                  </div>
                  <span style={{ padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 600, ...getPartnerStatusStyles(partner.status) }}>
                    {partner.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div className="form-label">Expected monthly volume</div>
                    <div>{partner.expectedMonthlyVolumeKg || 0} kg</div>
                  </div>
                  <div>
                    <div className="form-label">Scrap above 15 kg</div>
                    <div>{partner.hasOver15KgScrap ? 'Yes, bulk loads expected' : 'No, mostly lighter loads'}</div>
                  </div>
                  <div>
                    <div className="form-label">Applied on</div>
                    <div>{new Date(partner.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="form-label">Selected services</div>
                  {partner.selectedServices?.length ? (
                    <div className="detail-chip-list">
                      {partner.selectedServices.map((service) => (
                        <span key={service} className="detail-chip">{service}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No service options selected.</p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="form-label">Selected scrap categories</div>
                  {partner.selectedScrapCategories?.length ? (
                    <div className="detail-chip-list">
                      {partner.selectedScrapCategories.map((category) => (
                        <span key={category} className="detail-chip">{category}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No scrap categories selected.</p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="form-label">Company scraps</div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {partner.companyScrapDescription || 'Company scrap details were not provided.'}
                  </p>
                </div>

                {partner.message ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="form-label">Additional requirements</div>
                    <p style={{ color: 'var(--text-secondary)' }}>{partner.message}</p>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2" style={{ flexWrap: 'wrap' }}>
                  {partner.status !== 'Pending' ? (
                    <button
                      onClick={() => updatePartnerStatus(partner._id, 'Pending')}
                      className="btn btn-outline"
                      disabled={updatingPartnerId === partner._id}
                    >
                      {updatingPartnerId === partner._id ? 'Updating...' : 'Move to Pending'}
                    </button>
                  ) : null}
                  {partner.status !== 'Contacted' ? (
                    <button
                      onClick={() => updatePartnerStatus(partner._id, 'Contacted')}
                      className="btn btn-primary"
                      disabled={updatingPartnerId === partner._id}
                      style={{ background: 'var(--secondary)' }}
                    >
                      {updatingPartnerId === partner._id ? 'Updating...' : 'Mark Contacted'}
                    </button>
                  ) : null}
                  {partner.status !== 'Partnered' ? (
                    <button
                      onClick={() => updatePartnerStatus(partner._id, 'Partnered')}
                      className="btn btn-primary"
                      disabled={updatingPartnerId === partner._id}
                      style={{ background: 'var(--success)' }}
                    >
                      {updatingPartnerId === partner._id ? 'Updating...' : 'Mark Partnered'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="glass-panel admin-detail-section" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Catalog Control</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Admin can change scrap prices, service prices, and image URLs from here. This includes scrap categories and regular services only.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Scrap Categories</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {catalog.categories.map((category) => {
                const updateKey = getCatalogItemKey('scrap', category._id);

                return (
                  <div
                    key={category._id}
                    style={{
                      padding: '1rem',
                      borderRadius: '1rem',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.64)',
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{category.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{category.description}</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                      <label className="form-label">Price per kg</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={category.basePrice}
                        onChange={(event) => handleCatalogFieldChange('categories', category._id, 'basePrice', event.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                      <label className="form-label">Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        value={category.imageUrl || ''}
                        onChange={(event) => handleCatalogFieldChange('categories', category._id, 'imageUrl', event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={updatingCatalogKey === updateKey}
                      onClick={() => saveCatalogItem('scrap', category)}
                    >
                      {updatingCatalogKey === updateKey ? 'Saving...' : 'Save Scrap'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>Services</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {editableServices.map((service) => {
                const updateKey = getCatalogItemKey('service', service._id);

                return (
                  <div
                    key={service._id}
                    style={{
                      padding: '1rem',
                      borderRadius: '1rem',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.64)',
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{service.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {formatServiceGroupLabel(service.serviceGroup)} • {service.description}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                      <label className="form-label">Base Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={service.basePrice}
                        onChange={(event) => handleCatalogFieldChange('services', service._id, 'basePrice', event.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                      <label className="form-label">Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        value={service.imageUrl || ''}
                        onChange={(event) => handleCatalogFieldChange('services', service._id, 'imageUrl', event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={updatingCatalogKey === updateKey}
                      onClick={() => saveCatalogItem('service', service)}
                    >
                      {updatingCatalogKey === updateKey ? 'Saving...' : 'Save Service'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
