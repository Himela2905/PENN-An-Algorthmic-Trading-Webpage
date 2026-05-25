export default function LoginPage() {
  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center">

      <div className="w-full max-w-md border border-gray-800 rounded-2xl p-8">

        <h1 className="text-3xl font-bold text-center mb-6">
          Login
        </h1>

        <form className="space-y-4">

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}