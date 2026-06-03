import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';
import './InvestorPages.css';

export default function InvestorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [industries, setIndustries] = useState('');
  const [minInvestment, setMinInvestment] = useState('');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data);
      setCompanyName(data.company_name || '');
      setBio(data.bio || '');
      setIndustries(data.industries || '');
      setMinInvestment(data.min_investment || '');
      setMaxInvestment(data.max_investment || '');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');

    try {
      const res = await fetch('/api/profile/update-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          bio,
          industries,
          min_investment: Number(minInvestment) || null,
          max_investment: Number(maxInvestment) || null,
        }),
      });

      if (res.ok) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        loadProfile();
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <DashboardLayout role="investor">
        <div className="loading-state">Loading profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="investor">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your investor profile information</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn btn-secondary">
            Edit Profile
          </button>
        )}
      </div>

      {success && (
        <div className="auth-success" style={{ maxWidth: 640, marginBottom: 'var(--space-5)' }}>
          <span>Success:</span> {success}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{profile?.username || user?.username}</div>
            <div className="profile-email">{profile?.email || user?.email}</div>
            <span className={`badge ${profile?.verified === 2 ? 'badge-success' : profile?.verified === 1 ? 'badge-warning' : 'badge-error'}`} style={{ marginTop: 'var(--space-2)' }}>
              {profile?.verified === 2 ? 'KYC Verified' : profile?.verified === 1 ? 'KYC Pending' : 'KYC Not Submitted'}
            </span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label htmlFor="inv-company">Company/Organization</label>
              <input
                id="inv-company"
                type="text"
                className="input-field"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="inv-bio">Bio</label>
              <textarea
                id="inv-bio"
                className="input-field"
                placeholder="Tell ideators about yourself and your investment interests..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <div className="input-group">
              <label htmlFor="inv-industries">Industries of Interest</label>
              <input
                id="inv-industries"
                type="text"
                className="input-field"
                placeholder="e.g. Technology, Healthcare, Finance"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
              />
            </div>
            <div className="profile-investment-range">
              <div className="input-group">
                <label htmlFor="inv-min">Min Investment ($)</label>
                <input
                  id="inv-min"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 1000"
                  value={minInvestment}
                  onChange={(e) => setMinInvestment(e.target.value)}
                  min="0"
                />
              </div>
              <div className="input-group">
                <label htmlFor="inv-max">Max Investment ($)</label>
                <input
                  id="inv-max"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 100000"
                  value={maxInvestment}
                  onChange={(e) => setMaxInvestment(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field-label">Company</span>
              {profile?.company_name ? (
                <span className="profile-field-value">{profile.company_name}</span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Bio</span>
              {profile?.bio ? (
                <span className="profile-field-value">{profile.bio}</span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Industries</span>
              {profile?.industries ? (
                <span className="profile-field-value">{profile.industries}</span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Investment Range</span>
              {profile?.min_investment || profile?.max_investment ? (
                <span className="profile-field-value">
                  ${(profile.min_investment || 0).toLocaleString()} — ${(profile.max_investment || 0).toLocaleString()}
                </span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
