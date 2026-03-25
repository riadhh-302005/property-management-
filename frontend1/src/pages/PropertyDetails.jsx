import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import { formatCurrency } from "../utils/formatters";
import { HomeIcon } from "@heroicons/react/24/outline";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLandlord } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 NEW STATES
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchProperty();
    fetchTenants();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data.property || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch property");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get("/users/tenants");
      setTenants(res.data.tenants || []);
    } catch (err) {
      console.error("Failed to load tenants");
    }
  };

  const handleAssignTenant = async () => {
    if (!tenantId) {
      alert("Please select a tenant");
      return;
    }

    try {
      setAssigning(true);

      await api.put(`/properties/${id}/tenant`, {
        tenantId,
      });

      alert("Tenant assigned successfully");

      setTenantId("");
      fetchProperty();

    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign tenant");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error) return <Alert type="error" message={error} />;

  if (!property) return <div className="text-white">Property not found</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">{property.name}</h1>

      {/* PROPERTY INFO */}
      <div className="mb-6">
        <p>Bedrooms: {property.bedrooms}</p>
        <p>Bathrooms: {property.bathrooms}</p>
        <p>Rent: {formatCurrency(property.rentAmount)}</p>
      </div>

      {/* CURRENT TENANT */}
      {property.currentTenant && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Current Tenant</h2>
          <p>{property.currentTenant.name}</p>
          <p>{property.currentTenant.email}</p>
        </div>
      )}

      {/* 🔥 ASSIGN TENANT */}
      {isLandlord && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Assign Tenant</h2>

          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          >
            <option value="">Select Tenant</option>

            {tenants.map((tenant) => (
              <option key={tenant._id} value={tenant._id}>
                {tenant.name} ({tenant.email})
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignTenant}
            disabled={assigning}
            className="w-full py-2 bg-yellow-500 text-black font-semibold rounded"
          >
            {assigning ? "Assigning..." : "Assign Tenant"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;