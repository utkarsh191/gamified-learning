import axios from "axios";

const API_URL = "import.meta.env.VITE_API_URL/profile";

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateProfile = async (profileData: any) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(API_URL, profileData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Persists the latest calculated GitHub/LeetCode XP so the next Profile
// load can show it instantly, without waiting on external APIs.
export const updateCachedXP = async (xpData: {
  githubXP?: number;
  leetcodeXP?: number;
  totalXP?: number;
  leetcodeTotalSolved?: number;
}) => {
  const token = localStorage.getItem("token");

  const response = await axios.patch(`${API_URL}/xp`, xpData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};