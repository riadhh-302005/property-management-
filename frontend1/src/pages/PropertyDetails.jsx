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

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data.property || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch property details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      await api.delete(`/properties/${id}`);
      navigate("/properties");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete property");
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Property not found
      </div>
    );
  }

  const statusStyles = {
    available: "bg-green-500/20 text-green-400",
    occupied: "bg-blue-500/20 text-blue-400",
    maintenance: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black py-10 px-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => navigate("/properties")}
            className="text-gray-400 hover:text-[#D4AF37]"
          >
            ← Back to Properties
          </button>

          {isLandlord && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/properties/${id}/edit`)}
                className="px-5 py-2.5 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#e5c56a]"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-10">

            {/* IMAGE */}
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30
                            shadow-[0_0_30px_rgba(212,175,55,0.15)] bg-black/60">
              {property.images?.length ? (
                <img
                  src={`https://property-management-mg0p.onrender.com${property.images[0]}`}
                  alt={property.name}
                  className="w-full h-[450px] object-cover"
                />
              ) : (
                <div className="h-[450px] flex flex-col items-center justify-center">
                  <HomeIcon className="h-20 w-20 text-gray-500" />
                  <p className="text-gray-400 mt-2">No image available</p>
                </div>
              )}

              <span
                className={`absolute top-5 right-5 px-4 py-1.5 rounded-full 
                            text-sm font-semibold ${statusStyles[property.status]}`}
              >
                {property.status}
              </span>
            </div>

            {/* INFO */}
            <GlassCard title="Property Information">
              <Detail label="Property Name" value={property.name} />
              <Detail label="Type" value={property.type?.toUpperCase()} />
              <Detail label="Bedrooms" value={`${property.bedrooms || 0}`} />
              <Detail label="Bathrooms" value={`${property.bathrooms || 0}`} />
              <Detail label="Square Feet" value={`${property.squareFeet || "N/A"}`} />
              <Detail label="Year Built" value={property.yearBuilt || "N/A"} />
              <div>
                <p className="text-sm text-gray-400">Monthly Rent</p>
                <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                  {formatCurrency(property.rentAmount || property.rent)}
                </p>
              </div>
            </GlassCard>

            {/* ADDRESS */}
            <GlassCard title="Address">
              <p className="text-white font-medium">{property.address.street}</p>
              <p className="text-gray-400">
                {property.address.city}, {property.address.state}{" "}
                {property.address.zipCode}
              </p>
              <p className="text-gray-400">{property.address.country}</p>
            </GlassCard>

            {/* DESCRIPTION */}
            {property.description && (
              <GlassCard title="Description">
                <p className="text-gray-300 leading-relaxed">
                  {property.description}
                </p>
              </GlassCard>
            )}

            {/* AMENITIES */}
            {property.amenities?.length > 0 && (
              <GlassCard title="Amenities">
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-white/10 
                                 text-gray-300 text-sm"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-8">

            {isLandlord && (
              <GlassCard title="Landlord">
                <Field label="Name" value={property.landlord?.name} />
                <Field label="Email" value={property.landlord?.email} />
                <Field label="Phone" value={property.landlord?.phone || "N/A"} />
              </GlassCard>
            )}

            {(property.tenant || property.currentTenant) && (
              <GlassCard title="Current Tenant">
                <Field label="Name" value={(property.tenant || property.currentTenant).name} />
                <Field label="Email" value={(property.tenant || property.currentTenant).email} />
                <Field label="Phone" value={(property.tenant || property.currentTenant).phone || "N/A"} />
              </GlassCard>
            )}

            <GlassCard title="Quick Actions">
              <ActionButton label="View Payments" onClick={() => navigate("/payments")} />
              <ActionButton label="Maintenance Requests" onClick={() => navigate("/maintenance")} />
              <ActionButton label="View Lease" onClick={() => navigate("/leases")} />
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Reusable Components ---------- */

const GlassCard = ({ title, children }) => (
  <div className="relative bg-black/60 backdrop-blur-xl 
                  border border-[#D4AF37]/30 rounded-2xl p-6
                  shadow-[0_0_25px_rgba(212,175,55,0.15)]">
    <h2 className="text-xl font-semibold text-[#D4AF37] mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-white font-medium mt-1">{value}</p>
  </div>
);

const Field = ({ label, value }) => (
  <p className="text-sm text-gray-300">
    <span className="text-gray-400">{label}: </span>
    <span className="text-white font-medium">{value}</span>
  </p>
);

const ActionButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-2.5 bg-white/10 hover:bg-white/20 
               rounded-lg text-white transition"
  >
    {label}
  </button>
);

export default PropertyDetails;
