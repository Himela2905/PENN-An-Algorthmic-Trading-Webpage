export default function Features() {
  return (
    <section className="py-20 px-8 grid md:grid-cols-3 gap-8 text-center">

      <div className="border border-gray-800 p-6 rounded-xl">
        <h3 className="text-xl font-semibold">AI Trading</h3>
        <p className="text-gray-400 mt-2">
          Automated strategies powered by data.
        </p>
      </div>

      <div className="border border-gray-800 p-6 rounded-xl">
        <h3 className="text-xl font-semibold">Real-time Data</h3>
        <p className="text-gray-400 mt-2">
          Live insights for better decisions.
        </p>
      </div>

      <div className="border border-gray-800 p-6 rounded-xl">
        <h3 className="text-xl font-semibold">Secure Platform</h3>
        <p className="text-gray-400 mt-2">
          Your funds and data are protected.
        </p>
      </div>

    </section>
  );
}