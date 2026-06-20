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
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-sm font-medium text-slate-900">
              Connected to {status.workspace_name || "Notion workspace"}
            </p>

            {status.owner_email ? (
              <p className="mt-1 text-xs text-slate-500">
                {status.owner_email}
              </p>
            ) : null}

            {status.default_database_title ? (
              <p className="mt-2 text-xs font-medium text-sky-700">
                Default database: {status.default_database_title}
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-amber-600">
                No default task database selected. Select one below.
              </p>
            )}
          </div>

          <button
            onClick={loadDatabases}
            disabled={dbLoading}
            className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-200"
          >
            {dbLoading ? "Loading..." : "Select default database"}
          </button>

          {showDatabases ? (
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-white/70 p-2">
              {databases.length === 0 ? (
                <p className="p-3 text-xs text-slate-500">
                  No databases found. Make sure your integration has access to
                  at least one database in Notion.
                </p>
              ) : (
                databases.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => selectDatabase(db)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sky-50"
                  >
                    <span className="font-medium text-slate-900">
                      {db.title}
                    </span>
                    <span className="text-xs text-sky-600">Select</span>
                  </button>
                ))
              )}
            </div>
          ) : null}

          <button
            onClick={disconnect}
            disabled={loading}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
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
