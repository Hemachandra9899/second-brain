"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import {
  getProjects,
  createProject,
  deleteProject,
  getGoals,
  createGoal,
  deleteGoal,
  Project,
  Goal,
} from "@/lib/api";

export function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalProject, setGoalProject] = useState("");

  async function load() {
    const [p, g] = await Promise.all([getProjects(), getGoals()]);
    setProjects(p);
    setGoals(g);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createProject({ name, description: desc });
    setName("");
    setDesc("");
    await load();
  }

  async function handleCreateGoal(e: FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await createGoal({ title: goalTitle, project_id: goalProject || undefined });
    setGoalTitle("");
    await load();
  }

  return (
    <AppShell title="Projects">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Projects & Goals</h1>
        <p className="mt-3 text-sm text-slate-600">
          Organize tasks and knowledge into projects. Set goals with target dates.
        </p>
      </section>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-xl font-semibold">New Project</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="min-h-24 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />
            <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              Create project →
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-semibold">New Goal</h2>
          <form onSubmit={handleCreateGoal} className="space-y-3">
            <input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Goal title"
              className="w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />
            <select
              value={goalProject}
              onChange={(e) => setGoalProject(e.target.value)}
              className="w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              Create goal →
            </button>
          </form>
        </GlassCard>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Projects</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((p) => (
            <GlassCard key={p.id}>
              <p className="text-xs uppercase tracking-wide text-sky-600">{p.status}</p>
              <h3 className="mt-2 font-semibold">{p.name}</h3>
              {p.description ? (
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{p.description}</p>
              ) : null}
              <button
                onClick={async () => { await deleteProject(p.id); await load(); }}
                className="mt-4 rounded-full bg-rose-100 px-4 py-2 text-xs font-medium text-rose-700"
              >
                Delete
              </button>
            </GlassCard>
          ))}
          {!projects.length ? (
            <GlassCard>
              <p className="text-sm text-slate-600">No projects yet.</p>
            </GlassCard>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Goals</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {goals.map((g) => (
            <GlassCard key={g.id}>
              <p className="text-xs uppercase tracking-wide text-sky-600">{g.status}</p>
              <h3 className="mt-2 font-semibold">{g.title}</h3>
              {g.target_date ? (
                <p className="mt-1 text-xs text-slate-500">Due: {g.target_date}</p>
              ) : null}
              <button
                onClick={async () => { await deleteGoal(g.id); await load(); }}
                className="mt-4 rounded-full bg-rose-100 px-4 py-2 text-xs font-medium text-rose-700"
              >
                Delete
              </button>
            </GlassCard>
          ))}
          {!goals.length ? (
            <GlassCard>
              <p className="text-sm text-slate-600">No goals yet.</p>
            </GlassCard>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
