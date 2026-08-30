import { useState } from "react";
import { registerUser } from "../services/authService";
import { Link } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");

    const validateUsername = (value: string) => {
    const usernameRegex =
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_]{1,18}[a-zA-Z0-9])?$/;

    if (value.length < 7 || value.length > 20) {
      return "Username must be between 3 and 20 characters";
    }
     
    if (!usernameRegex.test(value)) {
    return "Username can only contain letters, numbers and underscore";
  }

    return "";
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const data = await registerUser(name, email, password);

    console.log("Signup successful:", data);
  } catch (error) {
    console.error("Signup failed:", error);
  }
};

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Create Account
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Start your gamified learning journey 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Username
          </label>
          <input 
          type="text" 
          value={username}
          onChange={(e) => {

            const value = e.target.value;

            setUsername(value);

            const error = validateUsername(value);

            setUsernameError(error);            
          }}
           placeholder="Choose a username"
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
          />
          {usernameError && (
            <p className="mt-2 text-sm text-red-400">
              {usernameError}
            </p>
          )}
        </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link 
          to="/login"
          className="text-blue-400 cursor-pointer hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;