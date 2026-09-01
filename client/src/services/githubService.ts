const API_URL = "http://localhost:5000/api/github";

export const getGithubActivity = async (username: string) => {
  const response = await fetch(`${API_URL}/${username}`);

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub activity");
  }

  return response.json();
};