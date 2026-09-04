import axios from "axios";

const API_URL = "import.meta.env.VITE_API_URL/activity";

// Marks today as an active day for the logged-in user (app's own streak,
// NOT GitHub/LeetCode). Safe to call every time the app loads — the
// backend is idempotent per calendar day.
export const pingActivity = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/ping`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getActivity = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// NEW — heatmap cache. Kept fully separate from XP endpoints in
// profileService.ts.

export interface DailyActivityEntry {
  date: string;
  githubCount: number;
  leetcodeCount: number;
}

export const getHeatmapCache = async (): Promise<{
  data: DailyActivityEntry[];
  updatedAt: string | null;
}> => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API_URL}/heatmap`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const saveHeatmapCache = async (data: DailyActivityEntry[]) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${API_URL}/heatmap`,
    { data },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};