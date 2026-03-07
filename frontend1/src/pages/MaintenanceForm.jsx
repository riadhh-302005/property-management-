import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";

const MaintenanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [properties, setProperties] = useState([]);

  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    images: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const categories = [
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "hvac", label: "HVAC" },
    { value: "appliance", label: "Appliance" },
    { value: "structural", label: "Structural" },
    { value: "pest_control", label: "Pest Control" },
    { value: "cleaning", label: "Cleaning" },
    { value: "landscaping", label: "Landscaping" },
    { value: "security", label: "Security" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low", description: "Non-urgent" },
    { value: "medium", label: "Medium", description: "Should be addressed soon" },
    { value: "high", label: "High", description: "Needs attention quickly" },
    { value: "urgent", label: "Urgent", description: "Emergency" },
  ];

  useEffect(() => {
    fetchProperties();
    if (isEditMode) fetchMaintenanceRequest();
  }, [id]);

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      const userProps = response.data.filter(
        (prop) => prop.currentTenant?._id === user._id || prop.tenant?._id === user._id
      );
      setProperties(userProps);
    } catch {
      setError("Failed to load properties");
    }
  };

  const fetchMaintenanceRequest = async () => {
    try {
      const response = await api.get(`/maintenance/${id}`);
      const req = response.data;

      setFormData({
        propertyId: req.property._id,
        title: req.title,
        description: req.description,
        category: req.category,
        priority: req.priority,
      });

      setExistingImages(req.images || []);
    } catch {
      setError("Failed to load maintenance request");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("propertyId", formData.propertyId);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("priority", formData.priority);
      selectedFiles.forEach((file) => data.append("images", file));

      let response;

      if (isEditMode) {
        response = await api.put(`/maintenance/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/maintenance", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(isEditMode ? "Request updated!" : "Request submitted!");

      setTimeout(() => {
        navigate(`/maintenance/${response.data._id || id}`);
      }, 1200);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#D4AF37]">
            {isEditMode ? "Edit Request" : "New Maintenance Request"}
          </h2>
          <p className="text-gray-400 mt-2">
            {isEditMode
              ? "Update your maintenance issue details"
              : "Submit a maintenance request for your property"}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && <Alert type="success" message={success} />}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl space-y-10">

            {/* PROPERTY */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Property Information</h3>

              <label className="text-gray-300">Select Property *</label>
              <select
                name="propertyId"
                disabled={isEditMode}
                value={formData.propertyId}
                onChange={handleChange}
                required
                className="w-full mt-2 bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="" className="text-black">
                  Select a property
                </option>

                {properties.map((p) => (
                  <option key={p._id} value={p._id} className="text-black">
                    {p.name} - {p.address?.street}, {p.address?.city}
                  </option>
                ))}
              </select>
            </div>

            {/* DETAILS */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Request Details</h3>

              {/* Title */}
              <label className="text-gray-300">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the issue"
                className="w-full mt-2 mb-6 p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-[#D4AF37]"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="text-gray-300">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value} className="text-black">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-gray-300">Priority *</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value} className="text-black">
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-400 text-sm mt-1">
                    {priorities.find((p) => p.value === formData.priority)?.description}
                  </p>
                </div>
              </div>

              {/* Description */}
              <label className="text-gray-300 mt-6 block">Description *</label>
              <textarea
                name="description"
                rows="6"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the issue in detail..."
                className="w-full mt-2 bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* IMAGES */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Images (Optional)</h3>
              <p className="text-gray-400 mb-4">
                Upload clear photos of the issue for quicker diagnosis.
              </p>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-gray-300 mb-2">Current Images:</h4>
                  <div className="flex gap-3 flex-wrap">
                    {existingImages.map((img, i) => (
                      <img
                        key={i}
                        src={`https://property-management-mg0p.onrender.com${img}`}
                        alt=""
                        className="w-28 h-28 object-cover rounded-lg border border-white/20"
                      />
                    ))}
                  </div>
                </div>
              )}

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="text-gray-300"
              />

              {selectedFiles.length > 0 && (
                <p className="text-gray-400 mt-2">{selectedFiles.length} image(s) selected</p>
              )}

              <small className="text-gray-500 block mt-1">
                JPG, PNG — Max 5MB each.
              </small>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 mt-10">
            <Button type="button" variant="outline" onClick={() => navigate("/maintenance")}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : isEditMode ? "Update Request" : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
