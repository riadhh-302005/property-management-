import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import SignaturePad from '../components/leases/SignaturePad';
import { formatCurrency, formatDate } from '../utils/formatters';

const Leases = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signingLease, setSigningLease] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeases();
  }, [filter]);

  const fetchLeases = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/leases', { params });
      setLeases(response.data.leases || []);
    } catch {
      setError('Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData) => {
    try {
      const role = isLandlord ? 'landlord' : 'tenant';
      await api.post(`/leases/${signingLease._id}/sign`, { signatureData, role });
      setSuccess('Lease signed successfully');
      setSigningLease(null);
      fetchLeases();
    } catch {
      setError('Failed to sign lease');
    }
  };

  const canSign = (lease) => {
    if (!lease.signatures) return false;
    if (isLandlord) return !lease.signatures.landlord?.signed;
    if (isTenant)
      return !lease.signatures.tenant?.signed && lease.tenant?._id === user.id;
    return false;
  };

  const isFullySigned = (lease) =>
    lease.signatures?.landlord?.signed &&
    lease.signatures?.tenant?.signed;

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Lease Agreements</h1>
          <p className="text-gray-400 mt-1">
            {isLandlord ? 'Manage your lease agreements' : 'Your lease agreements'}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* FILTERS */}
        <div className="flex gap-3 mb-10">
          {['all', 'draft', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full font-medium transition
                ${filter === f
                  ? 'bg-[#D4AF37] text-black shadow-lg'
                  : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20'}
              `}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {leases.length === 0 ? (
          <div className="lux-card text-center py-20">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-semibold gold">No Lease Agreements</h2>
          </div>
        ) : (
          <div className="grid gap-10">
            {leases.map((lease) => (
              <div
                key={lease._id}
                className="
                  bg-gradient-to-br from-black/70 to-black/40
                  backdrop-blur-xl
                  border border-[#D4AF37]/30
                  rounded-3xl
                  p-8
                  shadow-[0_0_40px_rgba(212,175,55,0.2)]
                  hover:shadow-[0_0_70px_rgba(212,175,55,0.35)]
                  transition-all
                "
              >
                {/* TOP */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{lease.property?.name}</h3>
                    <p className="text-gray-400 text-sm">
                      📍 {lease.property?.address?.street}, {lease.property?.address?.city}
                    </p>
                  </div>

                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border
                      ${
                        lease.status === 'active'
                          ? 'border-green-500 text-green-300 bg-green-500/10'
                          : lease.status === 'draft'
                          ? 'border-yellow-500 text-yellow-300 bg-yellow-500/10'
                          : 'border-red-500 text-red-300 bg-red-500/10'
                      }
                    `}
                  >
                    {lease.status.toUpperCase()}
                  </span>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 border-b border-white/10 pb-6 mb-6">
                  <Info label="Tenant" value={lease.tenant?.name} />
                  <Info label="Rent" value={`${formatCurrency(lease.rentAmount)}/month`} />
                  <Info label="Deposit" value={formatCurrency(lease.depositAmount)} />
                  <Info label="Start" value={formatDate(lease.startDate)} />
                  <Info label="End" value={formatDate(lease.endDate)} />
                </div>

                {/* SIGNATURE STATUS */}
                <div className="space-y-3 mb-6">
                  <SignatureStatus
                    label="Landlord"
                    isSigned={lease.signatures?.landlord?.signed}
                    date={lease.signatures?.landlord?.signedAt}
                  />
                  <SignatureStatus
                    label="Tenant"
                    isSigned={lease.signatures?.tenant?.signed}
                    date={lease.signatures?.tenant?.signedAt}
                  />
                </div>

                {/* ACTIVE BANNER */}
                {isFullySigned(lease) && (
                  <div className="
                    mb-6 p-4 rounded-xl
                    bg-green-600/15 border border-green-500/40
                    text-green-300 font-semibold text-sm
                  ">
                    ✓ Fully Signed — Agreement Active
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3">
                  <button
                    className="btn-outline"
                    onClick={() => navigate(`/leases/${lease._id}`)}
                  >
                    View Details
                  </button>

                  {canSign(lease) && (
                    <button
                      className="btn-gold"
                      onClick={() => setSigningLease(lease)}
                    >
                      Sign Lease
                    </button>
                  )}

                  {isFullySigned(lease) && lease.pdfUrl && (
                    <button
                      className="
                        px-6 py-2.5 rounded-xl
                        border border-[#D4AF37]
                        text-[#D4AF37]
                        hover:bg-[#D4AF37]
                        hover:text-black
                        transition
                      "
                      onClick={() =>
                        window.open(`https://property-management-mg0p.onrender.com${lease.pdfUrl}`, '_blank')
                      }
                    >
                      ⬇ Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SIGN MODAL */}
        {signingLease && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSigningLease(null)}
          >
            <div
              className="lux-card max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold mb-6">Sign Lease</h2>
              <SignaturePad onSave={handleSign} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-sm">{label}</p>
    <p className="text-white font-semibold">{value || '—'}</p>
  </div>
);

const SignatureStatus = ({ label, isSigned, date }) => (
  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
    <span className="text-gray-300 text-sm font-medium">{label}</span>
    {isSigned ? (
      <span className="text-green-400 text-sm">
        ✓ Signed on {formatDate(date)}
      </span>
    ) : (
      <span className="text-yellow-400 text-sm">⏳ Pending</span>
    )}
  </div>
);

export default Leases;
