"use client";

import { useEffect, useState } from "react";
import {
  disconnectNotion,
  getNotionConnectUrl,
  getNotionStatus,
  NotionStatus,
} from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

export function NotionConnectorCard() {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await getNotionStatus();
    setStatus(res);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function connect() {
    setLoading(true);
    try {
      const res = await getNotionConnectUrl();
      window.location.href = res.auth_url;
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      await disconnectNotion();
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Notion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Connect your Notion workspace to sync tasks, notes, and memory
            cards.
          </p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          OAuth
        </span>
      </div>

      {status?.connected ? (
        <div className="mt-5 rounded-2xl bg-white/70 p-4">
          <p className="text-sm font-medium text-slate-900">
            Connected to {status.workspace_name || "Notion workspace"}
          </p>

          {status.owner_email ? (
            <p className="mt-1 text-xs text-slate-500">
              {status.owner_email}
            </p>
          ) : null}

          <button
            onClick={disconnect}
            disabled={loading}
            className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            {loading ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          {loading ? "Opening Notion..." : "Connect Notion"}
        </button>
      )}
    </GlassCard>
  );
}
