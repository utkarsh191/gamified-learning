const API_URL = "http://localhost:5000/api/leetcode";

export const getLeetcodeActivity = async (username: string) => {
  const response = await fetch(`${API_URL}/${username}`);

  if (!response.ok) {
    throw new Error("Failed to fetch LeetCode activity");
  }

  return response.json();
};