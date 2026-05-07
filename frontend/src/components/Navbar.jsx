import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const brandTarget = isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/services';

  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.94)', position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(16px)' }}>
      <div className="container flex items-center justify-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <Link to={brandTarget} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
          <Recycle color="var(--primary)" size={28} />
          EcoScrap Pro
        </Link>
        <nav style={{ marginLeft: 'auto' }}>
          <ul className="flex gap-4 items-center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!isAdmin ? (
              <>
                <li><Link to="/services#scrap-categories">Scrap Category</Link></li>
                <li><Link to="/services#services">Services</Link></li>
                <li><Link to="/services#home-services">Home Services</Link></li>
                <li><Link to="/partners">Partner</Link></li>
              </>
            ) : null}
            {isAuthenticated ? (
              <>
                {!isAdmin ? (
                  <li>
                    <Link to="/dashboard" className="btn btn-outline">
                      {user?.fullName?.split(' ')[0] || 'Dashboard'}
                    </Link>
                  </li>
                ) : null}
                {isAdmin ? (
                  <li><Link to="/admin" className="btn btn-outline">Admin</Link></li>
                ) : null}
                <li>
                  <button type="button" className="btn btn-primary" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/register" className="btn btn-outline">Register</Link></li>
                <li><Link to="/login" className="btn btn-primary">Login</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
