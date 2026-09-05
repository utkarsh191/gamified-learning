const API_URL = `${import.meta.env.VITE_API_URL}/leetcode`;

export const getLeetcodeActivity = async (username: string) => {
  const response = await fetch(`${API_URL}/${username}`);

  if (!response.ok) {
    throw new Error("Failed to fetch LeetCode activity");
  }

  return response.json();
};