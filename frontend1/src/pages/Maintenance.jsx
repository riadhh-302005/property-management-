import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";
import { formatDate } from "../utils/formatters";

const Maintenance = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const response = await api.get("/maintenance", { params });
      setRequests(response.data.requests || []);
    } catch (error) {
      setError("Failed to load maintenance requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/maintenance/${id}`, { status });
      fetchRequests();
    } catch (error) {
      setError("Failed to update status");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this maintenance request?")) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchRequests();
    } catch (error) {
      setError("Failed to delete request");
      console.error(error);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black px-4 py-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Maintenance Requests
            </h1>
            <p className="text-gray-400 mt-2">
              {isLandlord
                ? "Manage and update property maintenance"
                : "Track your submitted maintenance requests"}
            </p>
          </div>

          {isTenant && (
            <button
              onClick={() => navigate("/maintenance/new")}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2c875] text-black 
                         font-semibold rounded-lg shadow-lg transition"
            >
              + New Request
            </button>
          )}
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* FILTER BUTTONS */}
        <div className="flex gap-3 mb-8">
          {["all", "pending", "in_progress", "completed"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? "bg-[#D4AF37] text-black shadow"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
              onClick={() => setFilter(status)}
            >
              {status.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="text-7xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No maintenance requests
            </h2>
            <p className="text-gray-400 mb-6">
              {isTenant
                ? "Submit a maintenance request whenever something needs attention."
                : "There are no maintenance requests at the moment."}
            </p>

            {isTenant && (
              <button
                onClick={() => navigate("/maintenance/new")}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#e2c875] 
                           text-black font-semibold rounded-lg shadow-lg transition"
              >
                Create Your First Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white/10 backdrop-blur-xl border border-white/10 
                           p-6 rounded-xl shadow-xl hover:shadow-2xl transition"
              >
                {/* TOP SECTION */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {req.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      📍 {req.property?.name || "Property"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {/* PRIORITY */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.priority === "high"
                          ? "bg-red-500/20 text-red-400"
                          : req.priority === "medium"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {req.priority}
                    </span>

                    {/* STATUS */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : req.status === "in_progress"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p className="text-gray-300 mb-4">{req.description}</p>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-5">
                  <div>
                    <p className="text-gray-400">Submitted by:</p>
                    <p className="text-white font-medium">
                      {req.tenant?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Date:</p>
                    <p className="text-white font-medium">
                      {formatDate(req.createdAt)}
                    </p>
                  </div>

                  {req.assignedTo && (
                    <div>
                      <p className="text-gray-400">Assigned to:</p>
                      <p className="text-white font-medium">
                        {req.assignedTo?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* IMAGE PREVIEW */}
                {req.images?.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto mb-5">
                    {req.images.map((img, i) => (
                      <img
                        key={i}
                        src={`https://property-management-mg0p.onrender.com${img}`}
                        className="w-28 h-28 object-cover rounded-lg border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* COMMENTS PREVIEW */}
                {req.comments?.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-white font-semibold mb-3">
                      Comments ({req.comments.length})
                    </h4>

                    {req.comments.slice(0, 2).map((c) => (
                      <div key={c._id} className="bg-white/5 p-3 rounded-lg mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium text-sm">
                            {c.user?.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{c.text}</p>
                      </div>
                    ))}

                    {req.comments.length > 2 && (
                      <button
                        onClick={() => navigate(`/maintenance/${req._id}`)}
                        className="text-[#D4AF37] text-sm font-medium hover:underline mt-2"
                      >
                        View all comments →
                      </button>
                    )}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3 mt-6 border-t border-white/10 pt-5">
                  {/* VIEW DETAILS */}
                  <button
                    onClick={() => navigate(`/maintenance/${req._id}`)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg 
                               hover:bg-white/20 transition"
                  >
                    View Details
                  </button>

                  {/* TENANT EDITING */}
                  {isTenant &&
                    req.tenant?._id === user._id &&
                    req.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/maintenance/${req._id}/edit`)
                          }
                          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(req._id)}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg 
                                     hover:bg-red-500/30 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}

                  {/* LANDLORD WORKFLOW */}
                  {isLandlord && req.status !== "completed" && (
                    <>
                      {req.status === "pending" && (
                        <button
                          onClick={() => updateStatus(req._id, "in_progress")}
                          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg 
                                     hover:bg-blue-500/30 transition"
                        >
                          Start Work
                        </button>
                      )}

                      {req.status === "in_progress" && (
                        <button
                          onClick={() => updateStatus(req._id, "completed")}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 
                                     text-white rounded-lg transition"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;
