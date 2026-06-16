export function SocialProof() {
  return (
    <div className="border-y border-white/5 py-8 px-4 my-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-xs uppercase tracking-wider text-gray-600 mb-6">
          Trusted by cashew professionals
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4">
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              We used AgriSMES to verify our W320 trade before committing. The PROCEED signal gave us confidence. We visited the factory in Mtwara shortly after.
            </p>
            <p className="text-xs text-gray-600">Mr. Yahaya — TAMIM Trading, Middle East</p>
          </div>
          <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 flex flex-col justify-center">
            <div className="text-3xl font-bold text-green-400 mb-1">27+</div>
            <p className="text-xs text-gray-500 mb-4">Trade analyses completed</p>
            <div className="text-3xl font-bold text-white mb-1">5+</div>
            <p className="text-xs text-gray-500">Countries represented</p>
          </div>
          <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 flex flex-col justify-center">
            <p className="text-sm text-gray-300 mb-3">
              Built by Tanzanian cashew exporters who experienced margin destruction firsthand.
            </p>
            <p className="text-xs text-gray-600">Lenmac Company Limited — Mtwara, Tanzania</p>
          </div>
        </div>
      </div>
    </div>
  );
}
