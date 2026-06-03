import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import './IdeatorPages.css';

export default function IdeatorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
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
      setBio(data.bio || '');
      setSkills(data.skills || '');
      setLocation(data.location || '');
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
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, skills, location }),
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
      <DashboardLayout role="ideator">
        <div className="loading-state">Loading profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ideator">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your public profile information</p>
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
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="input-field"
                placeholder="Tell investors about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <div className="input-group">
              <label htmlFor="profile-skills">Skills</label>
              <input
                id="profile-skills"
                type="text"
                className="input-field"
                placeholder="e.g. JavaScript, Product Design, Marketing"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="profile-location">Location</label>
              <input
                id="profile-location"
                type="text"
                className="input-field"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
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
              <span className="profile-field-label">Bio</span>
              {profile?.bio ? (
                <span className="profile-field-value">{profile.bio}</span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Skills</span>
              {profile?.skills ? (
                <span className="profile-field-value">{profile.skills}</span>
              ) : (
                <span className="profile-field-empty">Not set yet</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Location</span>
              {profile?.location ? (
                <span className="profile-field-value">{profile.location}</span>
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
