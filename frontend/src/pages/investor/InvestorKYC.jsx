import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';
import './InvestorPages.css';

export default function InvestorKYC() {
  const { user, checkSession } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkKYCStatus();
  }, []);

  async function checkKYCStatus() {
    try {
      const res = await fetch('/api/kyc/status');
      const data = await res.json();
      setKycStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          id_number: idNumber,
          company_name: companyName,
          phone,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('KYC submitted successfully! Awaiting admin approval.');
        checkKYCStatus();
        checkSession();
      } else {
        setError(data.error || 'Failed to submit KYC');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <DashboardLayout role="investor">
        <div className="loading-state">Checking KYC status...</div>
      </DashboardLayout>
    );
  }

  // Already approved
  if (kycStatus?.verified === 2) {
    return (
      <DashboardLayout role="investor">
        <div className="page-header">
          <div>
            <h1 className="page-title">KYC Verification</h1>
            <p className="page-subtitle">Your identity verification status</p>
          </div>
        </div>
        <div className="kyc-status-card kyc-approved">
          <div className="kyc-status-icon">✓</div>
          <h2>KYC Approved</h2>
          <p>Your identity has been verified. You have full access to all investment opportunities.</p>
          <Link to="/investor/browse" className="btn btn-primary" style={{ marginTop: 'var(--space-5)' }}>
            Browse Ideas
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Pending approval
  if (kycStatus?.verified === 1) {
    return (
      <DashboardLayout role="investor">
        <div className="page-header">
          <div>
            <h1 className="page-title">KYC Verification</h1>
            <p className="page-subtitle">Your identity verification status</p>
          </div>
        </div>
        <div className="kyc-status-card kyc-pending">
          <div className="kyc-status-icon">⏳</div>
          <h2>KYC Under Review</h2>
          <p>Your documents have been submitted and are being reviewed by our admin team. This usually takes 1-2 business days.</p>
          <div className="kyc-info-note">
            <strong>While you wait:</strong> You can browse a limited selection of featured ideas on the Browse page.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Rejected - can resubmit
  if (kycStatus?.verified === 3) {
    return (
      <DashboardLayout role="investor">
        <div className="page-header">
          <div>
            <h1 className="page-title">KYC Verification</h1>
            <p className="page-subtitle">Your identity verification status</p>
          </div>
        </div>
        <div className="kyc-status-card kyc-rejected">
          <div className="kyc-status-icon">✗</div>
          <h2>KYC Rejected</h2>
          <p>Unfortunately, your KYC submission was not approved. Please resubmit with valid documents.</p>
        </div>

        <div className="form-card" style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-xl)' }}>Resubmit KYC</h3>
          {renderForm()}
        </div>
      </DashboardLayout>
    );
  }

  // Not submitted
  function renderForm() {
    return (
      <>
        {error && (
          <div className="auth-error" style={{ marginBottom: 'var(--space-5)' }}>
            <span>Warning:</span> {error}
          </div>
        )}

        {success && (
          <div className="auth-success" style={{ marginBottom: 'var(--space-5)' }}>
            <span>Success:</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="kyc-fullname">Full Legal Name *</label>
            <input
              id="kyc-fullname"
              type="text"
              className="input-field"
              placeholder="Enter your full legal name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="kyc-id">Government ID Number *</label>
            <input
              id="kyc-id"
              type="text"
              className="input-field"
              placeholder="e.g. Passport, Aadhar, National ID"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="kyc-company">Company/Organization Name</label>
            <input
              id="kyc-company"
              type="text"
              className="input-field"
              placeholder="Enter your company name (if applicable)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="kyc-phone">Phone Number *</label>
            <input
              id="kyc-phone"
              type="tel"
              className="input-field"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit KYC'}
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <DashboardLayout role="investor">
      <div className="page-header">
        <div>
          <h1 className="page-title">KYC Verification</h1>
          <p className="page-subtitle">Complete your identity verification to unlock full platform access</p>
        </div>
      </div>

      <div className="kyc-info-banner">
        <div className="kyc-info-banner-icon">🔒</div>
        <div>
          <strong>Why is KYC required?</strong>
          <p>KYC verification ensures a secure platform for both investors and ideators. Once approved, you'll have full access to all ideas, investment tools, and direct messaging with ideators.</p>
        </div>
      </div>

      <div className="form-card">
        <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-xl)' }}>Identity Verification Form</h3>
        {renderForm()}
      </div>
    </DashboardLayout>
  );
}
