import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import { formatCurrency } from "../utils/formatters";

const LeaseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [formData, setFormData] = useState({
    propertyId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    depositAmount: "", // ✅ FIXED
    paymentDueDay: 1,
    terms: "",
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
    if (isEditMode) fetchLease();
  }, [id]);

  // ✅ FETCH PROPERTIES FIXED
  const fetchProperties = async () => {
    try {
      const res = await api.get("/properties");

      const availableProps = (res.data || []).filter(
        (p) => p.status === "available" && p.isAvailable !== false
      );

      setProperties(availableProps);
    } catch {
      setError("Failed to load properties");
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get("/auth/users");
      const tenantUsers = (res.data.users || []).filter(
        (u) => u.role === "tenant"
      );
      setTenants(tenantUsers);
    } catch {
      setError("Failed to load tenants");
    }
  };

  const fetchLease = async () => {
    try {
      const res = await api.get(`/leases/${id}`);
      const lease = res.data;

      setFormData({
        propertyId: lease.property._id || lease.property,
        tenantId: lease.tenant._id || lease.tenant,
        startDate: lease.startDate.split("T")[0],
        endDate: lease.endDate.split("T")[0],
        rentAmount: lease.rentAmount,
        depositAmount: lease.depositAmount, // ✅ FIXED
        paymentDueDay: lease.paymentDueDay,
        terms: lease.terms,
      });
    } catch {
      setError("Failed to fetch lease");
    } finally {
      setInitialLoading(false);
    }
  };

  // ✅ AUTO-FILL RENT
  useEffect(() => {
    if (formData.propertyId) {
      const selected = properties.find(
        (p) => p._id === formData.propertyId
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          rentAmount: selected.rentAmount || "",
        }));
      }
    }
  }, [formData.propertyId, properties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditMode) {
        await api.put(`/leases/${id}`, formData);
      } else {
        await api.post("/leases", formData);
      }

      navigate("/leases");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save lease");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">
              {isEditMode ? "Edit Lease" : "Create Lease"}
            </h1>
          </div>
          <button onClick={() => navigate("/leases")}>Cancel</button>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* PROPERTY */}
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* TENANT */}
            <select
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* DATES */}
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="input"
              required
            />

            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="input"
              required
            />

            {/* RENT */}
            <input
              type="number"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleChange}
              className="input"
              placeholder="Rent"
            />

            {/* DEPOSIT */}
            <input
              type="number"
              name="depositAmount"
              value={formData.depositAmount}
              onChange={handleChange}
              className="input"
              placeholder="Deposit"
            />

            {/* DUE DAY */}
            <input
              type="number"
              name="paymentDueDay"
              value={formData.paymentDueDay}
              onChange={handleChange}
              className="input"
              min="1"
              max="31"
            />
          </div>

          {/* TERMS */}
          <textarea
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            rows="5"
            className="input w-full"
            placeholder="Lease terms..."
          />

          {/* BUTTON */}
          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black py-3 rounded-lg"
          >
            {loading ? "Saving..." : "Create Lease"}
          </button>
        </form>
      </div>

      {/* ✅ SIMPLE UI STYLE */}
      <style>{`
        .input {
          width: 100%;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default LeaseForm;