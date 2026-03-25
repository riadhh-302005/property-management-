import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import SignaturePad from "../components/leases/SignaturePad";
import { formatCurrency, formatDate } from "../utils/formatters";

const Leases = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signingLease, setSigningLease] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchLeases();
  }, [filter]);

  const fetchLeases = async () => {
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const response = await api.get("/leases", { params });
      setLeases(response.data.leases || []);
    } catch {
      setError("Failed to load leases");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData) => {
    try {
      const role = isLandlord ? "landlord" : "tenant";
      await api.post(`/leases/${signingLease._id}/sign`, {
        signatureData,
        role,
      });
      setSuccess("Lease signed successfully");
      setSigningLease(null);
      fetchLeases();
    } catch {
      setError("Failed to sign lease");
    }
  };

  const canSign = (lease) => {
    if (!lease.signatures) return false;
    if (isLandlord) return !lease.signatures.landlord?.signed;
    if (isTenant)
      return (
        !lease.signatures.tenant?.signed &&
        lease.tenant?._id === user.id
      );
    return false;
  };

  const isFullySigned = (lease) =>
    lease.signatures?.landlord?.signed &&
    lease.signatures?.tenant?.signed;

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="max-w-7xl mx-auto">

        {/* ✅ HEADER WITH BUTTON */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Lease Agreements</h1>
            <p className="text-gray-400 mt-1">
              {isLandlord
                ? "Manage your lease agreements"
                : "Your lease agreements"}
            </p>
          </div>

          {/* 🔥 CREATE LEASE BUTTON */}
          {isLandlord && (
            <button
              onClick={() => navigate("/leases/new")}
              className="
                px-6 py-3
                bg-[#D4AF37]
                text-black
                font-semibold
                rounded-xl
                hover:bg-[#c69d2f]
                transition
                shadow-lg
              "
            >
              + Create Lease
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* FILTERS */}
        <div className="flex gap-3 mb-10">
          {["all", "draft", "active", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full font-medium ${
                filter === f
                  ? "bg-[#D4AF37] text-black"
                  : "bg-white/10 text-gray-300"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {leases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-semibold">
              No Lease Agreements
            </h2>
          </div>
        ) : (
          <div className="grid gap-10">
            {leases.map((lease) => (
              <div key={lease._id} className="bg-black/60 border p-6 rounded-xl">

                {/* TOP */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {lease.property?.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {lease.property?.address?.street},{" "}
                      {lease.property?.address?.city}
                    </p>
                  </div>

                  <span className="text-yellow-400">
                    {lease.status.toUpperCase()}
                  </span>
                </div>

                {/* INFO */}
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <p>Tenant: {lease.tenant?.name}</p>
                  <p>Rent: {formatCurrency(lease.rentAmount)}</p>
                  <p>Start: {formatDate(lease.startDate)}</p>
                  <p>End: {formatDate(lease.endDate)}</p>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 mt-6">

                  <button
                    onClick={() => navigate(`/leases/${lease._id}`)}
                    className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded"
                  >
                    View Details
                  </button>

                  {canSign(lease) && (
                    <button
                      onClick={() => setSigningLease(lease)}
                      className="px-4 py-2 bg-[#D4AF37] text-black rounded"
                    >
                      Sign Lease
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SIGN MODAL */}
        {signingLease && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-black p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl mb-4">Sign Lease</h2>
              <SignaturePad onSave={handleSign} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leases;