export default function AboutPage() {
  return (
    <div className="bg-black text-white min-h-screen overflow-hidden">

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 border-b border-gray-900 overflow-hidden">

        {/* Background Glow */}
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 blur-3xl rounded-full"></div>

        {/* Grid Effect */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        <div className="relative z-10 max-w-4xl">
          <p className="uppercase tracking-[0.3em] text-blue-400 text-sm mb-4">
            About Us
          </p>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Building The Future
            <br />
            Of Algorithmic Trading
          </h1>

          <p className="mt-8 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We are creating a next-generation trading ecosystem where
            automation, intelligence, and speed work together to help traders
            make smarter decisions in real time.
          </p>
        </div>
      </section>


      {/* MISSION SECTION */}
      <section className="py-28 px-8 md:px-20 grid md:grid-cols-2 gap-16 items-center">

        <div>
          <p className="text-blue-400 uppercase tracking-[0.2em] text-sm mb-4">
            Our Mission
          </p>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Turning Complex Data
            Into Smart Trading Decisions.
          </h2>

          <p className="mt-8 text-gray-400 leading-relaxed text-lg">
            Traditional trading platforms overwhelm users with noise.
            Our mission is to simplify the trading experience using
            intelligent systems, real-time analytics, and automated execution.
          </p>

          <p className="mt-6 text-gray-500 leading-relaxed">
            Whether you're a beginner exploring automated trading or an
            advanced trader optimizing strategies, our platform is designed
            to help you trade faster, smarter, and more confidently.
          </p>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6">

          <div className="border border-gray-800 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
            <h3 className="text-4xl font-bold text-blue-400">96%</h3>
            <p className="mt-3 text-gray-400">Execution Accuracy</p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
            <h3 className="text-4xl font-bold text-green-400">24/7</h3>
            <p className="mt-3 text-gray-400">Automated Monitoring</p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
            <h3 className="text-4xl font-bold text-purple-400">AI</h3>
            <p className="mt-3 text-gray-400">Strategy Intelligence</p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
            <h3 className="text-4xl font-bold text-orange-400">Fast</h3>
            <p className="mt-3 text-gray-400">Low-Latency Systems</p>
          </div>

        </div>
      </section>


      {/* VALUES SECTION */}
      <section className="py-28 px-8 md:px-20 border-t border-gray-900">

        <div className="text-center max-w-3xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-blue-400 text-sm mb-4">
            Why Choose Us
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Designed For Modern Traders
          </h2>
        </div>


        <div className="mt-20 grid md:grid-cols-3 gap-8">

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-blue-500 transition duration-300">
            <h3 className="text-2xl font-semibold mb-4">Real-Time Insights</h3>
            <p className="text-gray-400 leading-relaxed">
              Monitor market conditions instantly with advanced analytics and
              smart trading signals.
            </p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-green-500 transition duration-300">
            <h3 className="text-2xl font-semibold mb-4">Automated Strategies</h3>
            <p className="text-gray-400 leading-relaxed">
              Deploy intelligent trading strategies that work continuously
              without emotional decision making.
            </p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-purple-500 transition duration-300">
            <h3 className="text-2xl font-semibold mb-4">Secure Infrastructure</h3>
            <p className="text-gray-400 leading-relaxed">
              Built with reliability and security in mind to ensure your
              trading experience remains stable and protected.
            </p>
          </div>

        </div>
      </section>



        {/* Founder Name */}
      <section className="py-28 px-8 md:px-20 border-t border-gray-900">

        <div className="text-center max-w-3xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-blue-400 text-sm mb-4">
            Behind the app
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Meet our TEAM
          </h2>
        </div>


        <div className="mt-20 grid md:grid-cols-3 gap-8">

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-blue-500 transition duration-300">
            <h3 className="text-center text-2xl font-semibold mb-4">Rupayan Panja</h3>
            <p className="text-center text-gray-400 leading-relaxed">
              Lead Quant
            </p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-green-500 transition duration-300">
            <h3 className="text-center text-2xl font-semibold mb-4">Himela Biswas</h3>
            <p className="text-center text-gray-400 leading-relaxed">
              Full Stack Developer
            </p>
          </div>

          <div className="border border-gray-800 rounded-2xl p-8 hover:border-purple-500 transition duration-300">
            <h3 className="text-center text-2xl font-semibold mb-4">Nabin Chandra Maity</h3>
            <p className="text-center text-gray-400 leading-relaxed">
              Risk Analyst
            </p>
          </div>

        </div>
      </section>



      {/* CTA SECTION */}
      <section className="py-32 px-8 text-center relative overflow-hidden">

        <div className="absolute w-[400px] h-[400px] bg-blue-500/10 blur-3xl rounded-full left-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            The Future Of Trading
            <br />
            Starts Here.
          </h2>

          <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg">
            Experience intelligent automation, precision analytics,
            and seamless execution — all in one platform.
          </p>

          <button className="mt-10 px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition duration-300">
            Get Started
          </button>
        </div>
      </section>

    </div>
  );
}
