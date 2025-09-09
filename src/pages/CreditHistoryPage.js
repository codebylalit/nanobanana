import React from "react";
import { supabase } from "../supabaseClient";

export default function CreditHistoryPage() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select(
        "id, product_id, amount, currency, credits, status, created_at, completed_at, payment_id, razorpay_order_id"
      )
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      setOrders(data);
    }
    setLoading(false);
  }, []);

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
    <div className="max-w-8xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-bold">Purchase History</div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order/payment/status"
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm outline-none focus:border-white/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm outline-none focus:border-white/20"
          >
            <option value="all">All statuses</option>
            <option value="created">Created</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 bg-white/5 text-white/70 text-sm font-semibold">
          <div className="col-span-3 px-4 py-3">Date</div>
          <div className="col-span-2 px-4 py-3">Amount</div>
          <div className="col-span-2 px-4 py-3">Credits</div>
          <div className="col-span-3 px-4 py-3">Order / Payment</div>
          <div className="col-span-2 px-4 py-3">Status</div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-white/70">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-white/70">No purchases found.</div>
        ) : (
          filtered.map((o) => {
            const created = new Date(o.created_at);
            const amount = (o.amount / 100).toFixed(2);
            return (
              <div
                key={o.id}
                className="grid grid-cols-12 border-t border-white/10 text-sm"
              >
                <div className="col-span-3 px-4 py-3 text-white/90">
                  {created.toLocaleString()}
                </div>
                <div className="col-span-2 px-4 py-3 text-white/90">
                  {o.currency} ${amount}
                </div>
                <div className="col-span-2 px-4 py-3 text-white/90">
                  {o.credits}
                </div>
                <div className="col-span-3 px-4 py-3">
                  <div className="text-white/90 truncate">
                    Order: {o.razorpay_order_id}
                  </div>
                  {o.payment_id ? (
                    <div className="text-white/60 truncate">
                      Payment: {o.payment_id}
                    </div>
                  ) : null}
                </div>
                <div className="col-span-2 px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border
                      ${
                        o.status === "completed"
                          ? "border-green-400/30 text-green-200 bg-green-400/10"
                          : o.status === "failed" || o.status === "refunded"
                          ? "border-red-400/30 text-red-200 bg-red-400/10"
                          : "border-white/20 text-white/80 bg-white/5"
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
