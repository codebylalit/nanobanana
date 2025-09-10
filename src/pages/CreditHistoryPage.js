import React from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../authContext";

export default function CreditHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const loadOrders = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("orders")
      .select(
        "id, user_id, product_id, amount, currency, credits, status, created_at, completed_at, payment_id, razorpay_order_id"
      )
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      setOrders(data);
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = React.useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = q
        ? [o.product_id, o.payment_id, o.razorpay_order_id, o.status]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">Purchase History</div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order/payment/status"
            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm outline-none focus:border-gray-400 focus:ring-0"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm outline-none focus:border-gray-400 focus:ring-0"
          >
            <option value="all">All statuses</option>
            <option value="created">Created</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="grid grid-cols-12 bg-gray-50 text-gray-700 text-sm font-semibold">
          <div className="col-span-3 px-4 py-3">Date</div>
          <div className="col-span-2 px-4 py-3">Amount</div>
          <div className="col-span-2 px-4 py-3">Credits</div>
          <div className="col-span-3 px-4 py-3">Order / Payment</div>
          <div className="col-span-2 px-4 py-3">Status</div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-gray-600">No purchases found.</div>
        ) : (
          filtered.map((o) => {
            const created = new Date(o.created_at);
            const amount = (o.amount / 100).toFixed(2);
            return (
              <div
                key={o.id}
                className="grid grid-cols-12 border-t border-gray-200 text-sm"
              >
                <div className="col-span-3 px-4 py-3 text-gray-900">
                  {created.toLocaleString()}
                </div>
                <div className="col-span-2 px-4 py-3 text-gray-900">
                  {o.currency} ${amount}
                </div>
                <div className="col-span-2 px-4 py-3 text-gray-900">
                  {o.credits}
                </div>
                <div className="col-span-3 px-4 py-3">
                  <div className="text-gray-900 truncate">
                    Order: {o.razorpay_order_id}
                  </div>
                  {o.payment_id ? (
                    <div className="text-gray-600 truncate">
                      Payment: {o.payment_id}
                    </div>
                  ) : null}
                </div>
                <div className="col-span-2 px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border
                      ${
                        o.status === "completed"
                          ? "border-green-500/30 text-green-700 bg-green-100"
                          : o.status === "failed" || o.status === "refunded"
                          ? "border-red-500/30 text-red-700 bg-red-100"
                          : "border-gray-300 text-gray-700 bg-gray-100"
                      }
                    `}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
