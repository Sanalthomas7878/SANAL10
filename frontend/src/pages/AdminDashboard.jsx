import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Users, XCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { api, getAuthConfig, getErrorMessage } from '../lib/api';

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

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, pendingBookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadAdminData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const config = getAuthConfig(token);
        const [statsResponse, bookingsResponse] = await Promise.all([
          api.get('/admin/stats', config),
          api.get('/admin/bookings', config),
        ]);

        if (ignore) {
          return;
        }

        setStats(statsResponse.data);
        setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
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

  const updateStatus = async (id, status) => {
    setError('');

    try {
      const config = getAuthConfig(token);
      const { data } = await api.put(`/admin/bookings/${id}/status`, { status }, config);

      setBookings((currentBookings) =>
        currentBookings.map((booking) => (booking._id === id ? { ...booking, ...data } : booking))
      );

      setStats((currentStats) => ({
        ...currentStats,
        pendingBookings: status === 'Pending'
          ? currentStats.pendingBookings
          : Math.max(currentStats.pendingBookings - 1, 0),
      }));
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update booking status.'));
    }
  };

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
      <h1 style={{ marginBottom: '0.5rem' }}>Admin Control Panel</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Review user counts, booking counts, and pending requests from the shared booking database.
      </p>

      {error ? (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}><Users color="var(--secondary)" /></div>
          <div>
            <h3 style={{ fontSize: '1.7rem', lineHeight: 1 }}>{stats.totalUsers}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Total Users</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><BookOpen color="var(--success)" /></div>
          <div>
            <h3 style={{ fontSize: '1.7rem', lineHeight: 1 }}>{stats.totalBookings}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Total Bookings</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}><CheckCircle color="var(--warning)" /></div>
          <div>
            <h3 style={{ fontSize: '1.7rem', lineHeight: 1 }}>{stats.pendingBookings}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Pending Ops</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Manage Bookings</h2>
        {bookings.length === 0 ? (
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.06)', color: 'var(--text-secondary)' }}>
            No booking data available yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '860px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Booking</th>
                  <th style={{ padding: '1rem 0.5rem' }}>User</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Item</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Area</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Mode</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                      #{String(booking._id).slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>{booking.user?.fullName || 'Unknown user'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{booking.item?.name || booking.itemModel}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{booking.areaName || booking.pinCode}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{booking.operatingMode}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{new Date(booking.scheduledAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{ padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 600, ...getStatusStyles(booking.status) }}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      {booking.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(booking._id, 'Completed')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--success)' }}>
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => updateStatus(booking._id, 'Rejected')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--error)' }}>
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
