const API_URL = (import.meta as ImportMeta & {
  env: { VITE_API_URL: string };
}).env.VITE_API_URL;

export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string
) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      username,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
};