import Link from "next/link"
export default function CTA() {
  return (
    <section className="py-20 text-center">
      <h2 className="text-4xl font-bold">Start Trading Today</h2>

      <button className="mt-6 px-8 py-3 bg-white text-black rounded-full hover:bg-gray-200">
        Get Started
      </button>
    </section>
  );
}