"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupUser } from "@/lib/liveApi";

export default function SignupPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await signupUser(name, email, password);

      if (data.message) {
        // signup success → go to login
        router.push("/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md border border-gray-800 rounded-2xl p-8">

        <h1 className="text-3xl font-bold text-center mb-6">
          Create Account
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-white underline">
              Login
            </a>
          </p>

        </form>
      </div>
    </div>
  );
}