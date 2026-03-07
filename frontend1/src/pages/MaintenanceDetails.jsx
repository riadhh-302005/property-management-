import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import { formatDateTime } from "../utils/formatters";

const MaintenanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLandlord } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/${id}`);
      setRequest(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch maintenance request");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/maintenance/${id}`, { status: newStatus });
      fetchRequest();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/maintenance/${id}/comments`, {
        text: comment,
        author: user.id,
      });
      setComment("");
      fetchRequest();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this maintenance request? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/maintenance/${id}`);
      navigate("/maintenance");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete request");
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error && !request) {
    return (
      <div className="min-h-screen bg-black px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <Alert type="error" message={error} />
          <div className="mt-6">
            <Button onClick={() => navigate("/maintenance")}>Back to Maintenance</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-black px-4 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Request not found</h1>
          <div className="mt-6">
            <Button onClick={() => navigate("/maintenance")}>Back to Maintenance</Button>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "emergency":
        return "#EF4444";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#6366F1";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#6366F1";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Main content */}
        <div className="lg:col-span-2 space-y-6">
          {error && <Alert type="error" message={error} onClose={() => setError("")} />}

          {/* Top controls */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate("/maintenance")}>
                ← Back to Maintenance
              </Button>

              {/* landlord actions */}
              {isLandlord && request.status !== "completed" && request.status !== "cancelled" && (
                <>
                  {request.status === "pending" && (
                    <Button onClick={() => handleStatusChange("in_progress")}>Start Work</Button>
                  )}
                  {request.status === "in_progress" && (
                    <Button onClick={() => handleStatusChange("completed")}>Mark Complete</Button>
                  )}
                  <Button variant="danger" onClick={() => handleStatusChange("cancelled")}>
                    Cancel Request
                  </Button>
                </>
              )}

              {/* tenant actions */}
              {request.tenant?._id === user._id && request.status === "pending" && (
                <>
                  <Button variant="secondary" onClick={() => navigate(`/maintenance/${id}/edit`)}>
                    Edit Request
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}
            </div>

            {/* Small meta */}
            <div className="text-right">
              <p className="text-sm text-gray-400">{request.property?.name || "Property"}</p>
              <p className="text-xs text-gray-500">{formatDateTime(request.createdAt)}</p>
            </div>
          </div>

          {/* Header Card */}
          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{request.title}</h1>
                <p className="text-gray-300 mt-1">Created {formatDateTime(request.createdAt)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: `${getPriorityColor(request.priority)}33`,
                    color: getPriorityColor(request.priority),
                  }}
                >
                  {request.priority}
                </span>

                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: `${getStatusColor(request.status)}33`,
                    color: getStatusColor(request.status),
                  }}
                >
                  {request.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
            <p className="text-gray-200 leading-relaxed">{request.description}</p>
          </div>

          {/* Images */}
          {request.images && request.images.length > 0 && (
            <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
              <div className="flex gap-3 overflow-x-auto">
                {request.images.map((image, index) => (
                  <img
                    key={index}
                    src={`https://property-management-mg0p.onrender.com${image}`}
                    alt={`Maintenance ${index + 1}`}
                    className="w-40 h-28 object-cover rounded-lg border border-white/10 shadow"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Property Info */}
          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Property Information</h3>
            <p className="text-gray-300 font-medium">{request.property?.name || "N/A"}</p>
            <p className="text-gray-400">{request.property?.address?.street}</p>
            <p className="text-gray-400">
              {request.property?.address?.city}, {request.property?.address?.state}{" "}
              {request.property?.address?.zipCode}
            </p>

            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate(`/properties/${request.property._id}`)}
                style={{ marginTop: "0.5rem" }}
              >
                View Property Details
              </Button>
            </div>
          </div>

          {/* Comments & Updates */}
          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Comments & Updates</h3>

            {request.comments && request.comments.length > 0 ? (
              <div className="space-y-4 mb-4">
                {request.comments.map((c, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/8">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {c.author?.name || c.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-200">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 mb-4">No comments yet</p>
            )}

            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={4}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-md p-3 focus:ring-2 focus:ring-[#D4AF37] outline-none"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={submitting}>
                  Add Comment
                </Button>
                <Button variant="secondary" onClick={() => setComment("")}>
                  Clear
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Reported By</h4>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/8 flex items-center justify-center text-xl font-bold text-white">
                {request.tenant?.name?.charAt(0)?.toUpperCase() || "T"}
              </div>
              <div>
                <p className="text-white font-semibold">{request.tenant?.name || "N/A"}</p>
                <p className="text-gray-400 text-sm">{request.tenant?.email || "N/A"}</p>
                <p className="text-gray-400 text-sm">{request.tenant?.phone || "N/A"}</p>
              </div>
            </div>

            {request.tenant && (
              <div className="mt-4">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => navigate(`/messages?user=${request.tenant._id}`)}
                >
                  Send Message
                </Button>
              </div>
            )}
          </div>

          {isLandlord && (
            <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Assigned To</h4>
              {request.assignedTo ? (
                <>
                  <p className="text-white font-medium">{request.assignedTo.name}</p>
                  <p className="text-gray-400 text-sm">{request.assignedTo.email}</p>
                  <p className="text-gray-400 text-sm">{request.assignedTo.phone || "N/A"}</p>
                </>
              ) : (
                <p className="text-gray-400">Not assigned</p>
              )}
            </div>
          )}

          <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Timeline</h4>
            <div className="space-y-4">
              <TimelineItem label="Created" date={request.createdAt} color="#F59E0B" />
              {request.completedAt && <TimelineItem label="Completed" date={request.completedAt} color="#10B981" />}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const TimelineItem = ({ label, date, color }) => (
  <div className="flex items-start gap-3">
    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
    <div>
      <p className="text-white font-medium">{label}</p>
      <p className="text-gray-400 text-sm">{formatDateTime(date)}</p>
    </div>
  </div>
);

export default MaintenanceDetails;
