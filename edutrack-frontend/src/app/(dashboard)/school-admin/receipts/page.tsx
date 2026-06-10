"use client";

import { useEffect, useState } from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import api from "../../../../lib/axios";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReceipts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/receipts");

      setReceipts(res.data?.data || []);
    } catch (err) {
      console.error("RECEIPT LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const downloadReceipt = async (id: string) => {
    try {
      const res = await api.get(`/receipts/${id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${id}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
    }
  };

  return (
    <SectionCard
      title="Receipts"
      subtitle="Generated payment receipts"
    >
      {loading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <div className="space-y-3">

          {/* RECEIPT LIST */}
          {receipts.length === 0 ? (
            <p className="text-slate-400">No receipts found</p>
          ) : (
            receipts.map((r) => (
              <div
                key={r._id}
                className="rounded-xl bg-white/5 p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium">
                    {r.studentId?.firstName} {r.studentId?.lastName}
                  </p>

                  <p className="text-xs text-slate-400">
                    ₦{r.amountPaid} • {r.method} • {r.reference}
                  </p>

                  <p className="text-xs text-slate-500">
                    {r.session} - {r.term}
                  </p>
                </div>

                {/* DOWNLOAD BUTTON */}
                <button
                  onClick={() => downloadReceipt(r._id)}
                  className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30"
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </SectionCard>
  );
}