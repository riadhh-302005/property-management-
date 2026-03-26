import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import { formatCurrency } from "../utils/formatters";

import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (isLandlord) {
        const [propertiesRes, paymentsRes, maintenanceRes] = await Promise.all([
          api.get("/properties"),
          api.get("/payments"),
          api.get("/maintenance"),
        ]);

        // ✅ FIXED HERE
        const properties = propertiesRes.data || [];
        const payments = paymentsRes.data.payments || [];
        const maintenance = maintenanceRes.data.requests || [];

        const totalRevenue = payments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayments = payments
          .filter((p) => p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0);

        const openMaintenance = maintenance.filter(
          (m) => m.status === "pending" || m.status === "in_progress"
        ).length;

        setStats({
          totalProperties: properties.length,
          occupiedProperties: properties.filter((p) => p.status === "occupied")
            .length,
          totalRevenue,
          pendingPayments,
          openMaintenance,
        });

        setRecentActivity([
          ...payments.slice(0, 3).map((p) => ({
            type: "payment",
            description: `Payment of ${formatCurrency(p.amount)} - ${p.status}`,
            date: p.dueDate,
          })),
          ...maintenance.slice(0, 2).map((m) => ({
            type: "maintenance",
            description: `${m.title} - ${m.status}`,
            date: m.createdAt,
          })),
        ]);
      } else if (isTenant) {
        const [paymentsRes, maintenanceRes, leasesRes] = await Promise.all([
          api.get("/payments"),
          api.get("/maintenance"),
          api.get("/leases"),
        ]);

        const payments = paymentsRes.data.payments || [];
        const maintenance = maintenanceRes.data.requests || [];
        const leases = leasesRes.data.leases || [];

        const activeLease = leases.find((l) => l.status === "active");
        const nextPayment = payments.find((p) => p.status === "pending");

        setStats({
          nextPaymentAmount: nextPayment?.amount || 0,
          nextPaymentDate: nextPayment?.dueDate,
          openRequests: maintenance.filter((m) => m.status !== "completed")
            .length,
          leaseExpiry: activeLease?.endDate,
        });

        setRecentActivity(
          payments.slice(0, 5).map((p) => ({
            type: "payment",
            description: `Payment of ${formatCurrency(p.amount)} - ${p.status}`,
            date: p.dueDate,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-12 px-4 sm:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Welcome back,{" "}
            <span className="text-[#D4AF37]">{user.name}</span> 👋
          </h1>
          <p className="text-gray-200 mt-2 text-lg">
            Here’s your luxury dashboard overview
          </p>
        </div>

        {/* STATS GRID */}
        {isLandlord && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <LuxuryCard
              title="Total Properties"
              value={stats.totalProperties}
              sub={`${stats.occupiedProperties} occupied`}
              Icon={BuildingOfficeIcon}
            />

            <LuxuryCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              sub="All-time collected"
              Icon={CurrencyDollarIcon}
            />

            <LuxuryCard
              title="Pending Payments"
              value={formatCurrency(stats.pendingPayments)}
              sub="Awaiting collection"
              Icon={CalendarIcon}
            />

            <LuxuryCard
              title="Open Maintenance"
              value={stats.openMaintenance}
              sub="Requires attention"
              Icon={WrenchScrewdriverIcon}
            />
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div>
          <h3 className="text-2xl font-semibold text-white mb-4">
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">

            {/* ✅ ROLE BASED BUTTON */}
            {isLandlord ? (
              <LuxuryActionCard
                to="/properties/new"
                Icon={PlusCircleIcon}
                label="Add Property"
              />
            ) : (
              <LuxuryActionCard
                to="/properties"
                Icon={BuildingOfficeIcon}
                label="View Properties"
              />
            )}

            <LuxuryActionCard
              to="/maintenance"
              Icon={WrenchScrewdriverIcon}
              label="View Requests"
            />

            <LuxuryActionCard
              to="/payments"
              Icon={CurrencyDollarIcon}
              label="Track Payments"
            />

            <LuxuryActionCard
              to="/messages"
              Icon={ChatBubbleLeftRightIcon}
              label="Messages"
            />
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        {recentActivity.length > 0 && (
          <Card
            title="Recent Activity"
            className="bg-black/40 border border-white/10 text-white"
          >
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 bg-black/30 rounded-xl 
                  border border-white/10 shadow-sm hover:bg-black/40 transition"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xl">
                    {activity.type === "payment" ? "💳" : "🔧"}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-100">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

/* ---------------- LUXURY CARD ---------------- */
const LuxuryCard = ({ title, value, sub, Icon }) => (
  <div
    className="bg-black/30 border border-white/10 rounded-2xl p-7 
    shadow-md hover:border-[#D4AF37]/60 transition"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-200 font-medium">{title}</p>
        <h2 className="text-4xl font-bold text-white mt-1">{value}</h2>
        <p className="text-xs text-gray-300 mt-1">{sub}</p>
      </div>

      <div className="bg-[#D4AF37]/10 p-4 rounded-xl border border-[#D4AF37]/40">
        <Icon className="h-10 w-10 text-[#D4AF37]" />
      </div>
    </div>
  </div>
);

/* ---------------- LUXURY ACTION CARD ---------------- */
const LuxuryActionCard = ({ to, Icon, label }) => (
  <Link
    to={to}
    className="bg-black/30 border border-white/10 p-6 rounded-2xl shadow-md 
    hover:border-[#D4AF37]/60 hover:bg-black/40 transition group text-center"
  >
    <Icon className="h-12 w-12 mx-auto mb-3 text-gray-300 group-hover:text-[#D4AF37]" />
    <span className="font-medium text-gray-100 group-hover:text-[#D4AF37]">
      {label}
    </span>
  </Link>
);

export default Dashboard;