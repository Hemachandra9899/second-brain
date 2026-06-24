"use client";

import { useEffect, useState } from "react";
import {
  disconnectNotion,
  getNotionConnectUrl,
  getNotionDatabases,
  getNotionStatus,
  NotionDatabase,
  NotionStatus,
  setDefaultNotionDatabase,
} from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

export function NotionConnectorCard() {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [showDatabases, setShowDatabases] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

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
      setDatabases([]);
      setShowDatabases(false);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function loadDatabases() {
    setDbLoading(true);
    try {
      const res = await getNotionDatabases();
      setDatabases(res.databases);
      setShowDatabases(true);
    } finally {
      setDbLoading(false);
    }
  }

  async function selectDatabase(db: NotionDatabase) {
    setDbLoading(true);
    try {
      await setDefaultNotionDatabase(db.id, db.title);
      await refresh();
      setShowDatabases(false);
    } finally {
      setDbLoading(false);
    }
  }

  return (
    <GlassCard className="bg-gradient-to-br from-cyan-300/10 via-white/[0.07] to-violet-500/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Notion</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Connect your workspace to sync tasks, notes, and memory cards.</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100/80">OAuth</span>
      </div>

      {status?.connected ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-black text-white">Connected to {status.workspace_name || "Notion workspace"}</p>
            {status.owner_email ? <p className="mt-1 text-xs text-white/40">{status.owner_email}</p> : null}
            {status.default_database_title ? <p className="mt-2 text-xs font-black text-cyan-100/80">Default database: {status.default_database_title}</p> : <p className="mt-2 text-xs font-black text-amber-100/80">No default task database selected.</p>}
          </div>
          <button onClick={loadDatabases} disabled={dbLoading} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-50">{dbLoading ? "Loading..." : "Select default database"}</button>
          {showDatabases ? (
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2">
              {databases.length === 0 ? <p className="p-3 text-xs text-white/40">No databases found. Make sure your integration has access to at least one database.</p> : databases.map((db) => (
                <button key={db.id} onClick={() => selectDatabase(db)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/10">
                  <span className="font-black text-white">{db.title}</span><span className="text-xs font-black text-cyan-100/80">Select</span>
                </button>
              ))}
            </div>
          ) : null}
          <button onClick={disconnect} disabled={loading} className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/75 disabled:opacity-50">{loading ? "Disconnecting..." : "Disconnect"}</button>
        </div>
      ) : (
        <button onClick={connect} disabled={loading} className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50">{loading ? "Opening Notion..." : "Connect Notion"}</button>
      )}
    </GlassCard>
  );
}
