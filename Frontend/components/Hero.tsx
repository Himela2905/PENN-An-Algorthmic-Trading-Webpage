import Link from "next/link"
export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-32">
      <h1 className="text-5xl md:text-6xl font-bold leading-tight">
        Elevate Your <br /> Trading Experience
      </h1>

      <p className="mt-4 text-gray-400 max-w-xl">
        Smart algorithms. Real-time insights. Automated execution.
      </p>

      <Link href="/LiveTrading"><button className="mt-6 px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200">
        Start Trading
      </button></Link>
    </section>
  );
}