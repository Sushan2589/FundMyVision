import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';

export default function InvestorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [industries, setIndustries] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [maxInvestment, setMaxInvestment] = useState("");
  const [verified, setVerified] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  function fetchProfile() {
    setLoading(true);
    fetch('/api/investor-profile')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setCompanyName(data.company_name || "");
          setBio(data.bio || "");
          setIndustries(data.industries || "");
          setMinInvestment(data.min_investment || "");
          setMaxInvestment(data.max_investment || "");
          setVerified(data.verified || 0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    fetch('/api/investor-profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName,
        bio: bio,
        industries: industries,
        min_investment: parseFloat(minInvestment) || 0,
        max_investment: parseFloat(maxInvestment) || 0
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage({ text: "Profile updated successfully!", type: "success" });
        } else {
          setMessage({ text: "Failed to update profile: " + (data.error || ""), type: "error" });
        }
        setSaving(false);
      })
      .catch(err => {
        console.error(err);
        setMessage({ text: "A network error occurred.", type: "error" });
        setSaving(false);
      });
  }

  function renderKYCBadge() {
    switch (verified) {
      case 1:
        return <span className="badge badge-pending" style={{ padding: '4px 10px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid rgba(227,116,0,0.2)', borderRadius: '12px' }}>Pending KYC Approval</span>;
      case 2:
        return <span className="badge badge-approved" style={{ padding: '4px 10px', background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(7,83,39,0.2)', borderRadius: '12px' }}>KYC Verified</span>;
      case 3:
        return <span className="badge badge-rejected" style={{ padding: '4px 10px', background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(217,48,37,0.2)', borderRadius: '12px' }}>KYC Rejected</span>;
      default:
        return <span className="badge badge-unsubmitted" style={{ padding: '4px 10px', background: 'var(--color-text-secondary)', color: '#fff', borderRadius: '12px' }}>KYC Not Submitted</span>;
    }
  }

  return (
    <DashboardLayout role="investor">
      <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Investor Profile</h1>
            <p className="page-subtitle">Configure your investment preferences and company information</p>
          </div>
          <div>
            {renderKYCBadge()}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading investor profile...</div>
        ) : (
          <div className="card" style={{ padding: 'var(--space-6)', background: 'var(--surface-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            {message.text && (
              <div
                className={`alert alert-${message.type}`}
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="profile-form">
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Company / Fund Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Apex Capital"
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Industries of Interest (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={industries}
                  onChange={e => setIndustries(e.target.value)}
                  placeholder="BioTech, AI, SaaS, Web3"
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Minimum Ticket (Rs.)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minInvestment}
                    onChange={e => setMinInvestment(e.target.value)}
                    placeholder="10000"
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Maximum Ticket (Rs.)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={maxInvestment}
                    onChange={e => setMaxInvestment(e.target.value)}
                    placeholder="1000000"
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Venture / Angel Investment Bio</label>
                <textarea
                  className="form-control"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Share details about your portfolio, focus and track record..."
                  rows="5"
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '100%', padding: 'var(--space-3)' }}
              >
                {saving ? "Saving Preferences..." : "Save Profile Preferences"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
