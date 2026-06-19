"use client";

import { useState, useEffect, useCallback } from "react";
import { apiPost, apiGet } from "@/lib/api";

type MoodTheme = {
  theme_name: string;
  background: string;
  primary: string;
  accent: string;
  card: string;
  reason: string;
};

type MoodData = {
  mood: string;
  intensity: string;
  confidence: number;
  valence: string;
  arousal: string;
  recommended_tone: string;
  theme: MoodTheme;
  created_at?: string | null;
};

type MoodResponse = {
  mood: string;
  intensity: string;
  confidence: number;
  valence: string;
  arousal: string;
  recommended_tone: string;
  theme: MoodTheme;
};

export function useMoodTheme() {
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    try {
      const data = await apiGet<MoodResponse>("/mood/latest");
      setMoodData({
        ...data,
        created_at: null,
      });
    } catch {
      setMoodData({
        mood: "neutral",
        intensity: "medium",
        confidence: 0.5,
        valence: "neutral",
        arousal: "medium",
        recommended_tone: "calm_supportive",
        theme: {
          theme_name: "fresh_sky",
          background: "from-sky-50 via-cyan-100 to-blue-200",
          primary: "bg-sky-500 hover:bg-sky-600",
          accent: "text-sky-700",
          card: "bg-white/75",
          reason: "Default calm blue theme.",
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAndSet = useCallback(
    async (text: string, recentContext?: string) => {
      try {
        const data = await apiPost<MoodResponse>("/mood/detect", {
          text,
          recent_context: recentContext,
          save: true,
        });
        setMoodData({ ...data, created_at: null });
      } catch {
        // silent
      }
    },
    []
  );

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const theme = moodData?.theme ?? {
    theme_name: "fresh_sky",
    background: "from-sky-50 via-cyan-100 to-blue-200",
    primary: "bg-sky-500 hover:bg-sky-600",
    accent: "text-sky-700",
    card: "bg-white/75",
    reason: "Default calm blue theme.",
  };

  return {
    mood: moodData?.mood ?? "neutral",
    moodData,
    theme,
    loading,
    refreshMood: fetchLatest,
    setMood: detectAndSet,
  };
}
