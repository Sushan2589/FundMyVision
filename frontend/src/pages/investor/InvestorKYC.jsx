import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';

export default function InvestorKYC() {
  const { user, refreshUser } = useAuth();
  const [kycStatus, setKycStatus] = useState(user?.verified || 0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [bio, setBio] = useState("");
  const [industries, setIndustries] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [maxInvestment, setMaxInvestment] = useState("");

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  function fetchKYCStatus() {
    setLoading(true);
    fetch('/api/kyc/status')
      .then(res => res.json())
      .then(data => {
        setKycStatus(data.verified);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // 1. Update investor profile
      const profileRes = await fetch('/api/investor-profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          bio: bio,
          industries: industries,
          min_investment: parseFloat(minInvestment) || 0,
          max_investment: parseFloat(maxInvestment) || 0
        })
      });

      if (!profileRes.ok) throw new Error("Failed to update investor profile");

      // 2. Submit KYC
      const kycRes = await fetch('/api/kyc/submit', { method: 'POST' });
      const kycData = await kycRes.json();

      if (kycRes.ok && kycData.success) {
        setSuccess(true);
        setKycStatus(1);
        await refreshUser(); // Update global auth context status
      } else {
        throw new Error(kycData.error || "Failed to submit KYC status");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSuccess(false);
    setKycStatus(0);
  }

  return (
    <DashboardLayout role="investor">
      <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">KYC Identity Verification</h1>
            <p className="page-subtitle">Verify your identity to unlock investment features and view idea detail records</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Checking verification status...</div>
        ) : (
          <div>
            {kycStatus === 1 && (
              <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--surface-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                <span style={{ fontSize: '48px', color: 'var(--color-warning)' }}>⏳</span>
                <h2 style={{ marginTop: 'var(--space-4)', color: 'var(--color-primary-dark)' }}>KYC Review Pending</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-4) 0', lineHeight: 'var(--leading-relaxed)' }}>
                  Thank you! Your verification profile has been submitted and is currently under review by our administration team.
                  This process usually takes less than 24 hours. You will receive full access once approved.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                  <Link to="/investor/dashboard" className="btn btn-ghost">Return to Dashboard</Link>
                  <Link to="/investor/browse" className="btn btn-primary">Browse Ideas (Restricted Mode)</Link>
                </div>
              </div>
            )}

            {kycStatus === 2 && (
              <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-success-bg)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-xl)' }}>
                <span style={{ fontSize: '48px', color: 'var(--color-primary)' }}>✅</span>
                <h2 style={{ marginTop: 'var(--space-4)', color: 'var(--color-primary-dark)' }}>Identity Verified</h2>
                <p style={{ color: 'var(--color-primary-dark)', margin: 'var(--space-4) 0', lineHeight: 'var(--leading-relaxed)' }}>
                  Your account is fully verified! You now have full access to view all vision campaigns, request meetings with vision creators, and submit investment offers.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                  <Link to="/investor/browse" className="btn btn-primary">Browse All Vision Campaigns</Link>
                  <Link to="/investor/profile" className="btn btn-ghost">View Investment Profile</Link>
                </div>
              </div>
            )}

            {kycStatus === 3 && (
              <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-xl)' }}>
                <span style={{ fontSize: '48px', color: 'var(--color-error)' }}>❌</span>
                <h2 style={{ marginTop: 'var(--space-4)', color: 'var(--color-error)' }}>Verification Declined</h2>
                <p style={{ color: 'var(--color-text)', margin: 'var(--space-4) 0', lineHeight: 'var(--leading-relaxed)' }}>
                  Unfortunately, our compliance team could not verify your details. Please check that all submitted information is accurate and matches your official legal documents.
                </p>
                <button onClick={handleReset} className="btn btn-primary">
                  Restart Verification Submission
                </button>
              </div>
            )}

            {kycStatus === 0 && (
              <div className="card" style={{ padding: 'var(--space-6)', background: 'var(--surface-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)' }}>Submit KYC Application</h2>
                
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Full Legal Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Company / Fund Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      placeholder="e.g. Apex Ventures"
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Official ID Document Number (Passport / Driver's License)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      required
                      placeholder="e.g. P1234567A"
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Target Industries (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={industries}
                      onChange={e => setIndustries(e.target.value)}
                      placeholder="e.g. FinTech, AI, Green Energy, Health"
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
                        placeholder="e.g. 10000"
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
                        placeholder="e.g. 500000"
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Professional Bio / Investor Profile</label>
                    <textarea
                      className="form-control"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      required
                      placeholder="Briefly describe your venture firm or angel investment profile..."
                      rows="4"
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  >
                    {submitting ? "Submitting Verification..." : "Submit Profile & Request Verification"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
