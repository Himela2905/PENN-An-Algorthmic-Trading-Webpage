import Link from "next/link";
export default function NavBar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
      <h1 className="text-xl font-bold">Penn</h1>

      <div className="space-x-6 hidden md:block">
        <Link href="/Backtest" className="hover:text-gray-400">BackTest</Link>
        <Link href="/LiveTrading" className="hover:text-gray-400">Live Trading</Link>
        <Link href="/About" className="hover:text-gray-400">About</Link>
      </div>

      <Link href="/login">
      <button className="bg-white text-black px-4 py-2 rounded-full">
        Login
      </button>
      </Link>
    </nav>
  );
}