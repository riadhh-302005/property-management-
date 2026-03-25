import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import DemoPaymentGateway from "../components/payments/DemoPaymentGateway";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import { formatCurrency, formatDate } from "../utils/formatters";

const Payments = () => {
  const { isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 2000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await api.get("/payments", { params });
      setPayments(res.data.payments || []);
    } catch {
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const res = await api.get(`/payments/${id}/receipt`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Receipt downloaded");
    } catch {
      setError("Failed to download receipt");
    }
  };

  const isOverdue = (p) =>
    p.status === "pending" && new Date(p.dueDate) < new Date();

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-extrabold gold">Payments</h1>
            <p className="text-gray-400 mt-1">
              Track and manage rent payments
            </p>
          </div>

          {isLandlord && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl border border-[#D4AF37] px-5 py-3 font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
            >
              + Add Payment
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* FILTERS */}
        <div className="flex gap-3">
          {["all", "pending", "paid", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg font-semibold ${
                filter === f
                  ? "bg-[#D4AF37] text-black"
                  : "bg-white/10 text-gray-300"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CARDS */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-black/60 border rounded-2xl p-6">

              <div className="flex justify-between">
                <div>
                  <h3 className="text-xl">{p.property?.name}</h3>
                  <p className="text-gray-400">
                    Due: {formatDate(p.dueDate)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(p.amount)}
                  </p>
                  <span className="text-yellow-400">
                    {isOverdue(p) ? "OVERDUE" : p.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm">
                Tenant: {p.tenant?.name || "-"}
              </div>

              {/* 🔥 PAY NOW BUTTON */}
              {isTenant && p.status === "pending" && (
                <button
                  onClick={() => setSelectedPayment(p)}
                  className="mt-6 w-full py-2 bg-[#D4AF37] text-black font-semibold rounded"
                >
                  💳 Pay Now
                </button>
              )}

              {/* DOWNLOAD RECEIPT */}
              {p.status === "paid" && (
                <button
                  onClick={() => handleDownloadReceipt(p._id)}
                  className="mt-6 w-full py-2 border border-[#D4AF37] text-[#D4AF37] rounded"
                >
                  Download Receipt
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 🔥 PAYMENT MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black p-6 rounded-xl w-full max-w-md">
              <DemoPaymentGateway
                paymentId={selectedPayment._id}
                amount={selectedPayment.amount}
                onSuccess={() => {
                  setSelectedPayment(null);
                  setSuccess("Payment successful!");
                  setLoading(true);
                  fetchPayments();
                }}
              />
            </div>
          </div>
        )}

        {/* ADD PAYMENT */}
        {showAddModal && isLandlord && (
          <AddPaymentModal
            onClose={() => setShowAddModal(false)}
            onCreated={() => {
              setShowAddModal(false);
              setLoading(true);
              fetchPayments();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Payments;