// Institutional trust bar for AgriSMES pricing page
export function TrustBar() {
  return (
    <div className="border-t border-white/8 mt-10 pt-8 pb-8 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-7">
        <p className="text-center text-[11px] text-gray-500 uppercase tracking-widest font-medium">
          AgriSMES is a product of
        </p>
        {/* Lenmac Logo */}
        <div className="flex items-center gap-2">
          <img
            src="https://lenmacai.com/lenmac-logo.png"
            alt="Lenmac Company Limited"
            className="h-7 w-auto object-contain opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-sm font-semibold text-gray-300 tracking-wide">Lenmac Company Limited</span>
        </div>
      </div>

      {/* Certification badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto mb-6">
        {/* BRELA */}
        <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/BRELA_logo.png/200px-BRELA_logo.png"
            alt="BRELA"
            className="h-6 w-auto object-contain opacity-70"
            onError={(e) => {
              (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'BRELA', className: 'text-xs font-bold text-blue-400' }));
            }}
          />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Registered Company</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">No. 176550155</p>
          </div>
        </div>

        {/* TBS */}
        <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2">
          <img
            src="https://www.tbs.go.tz/images/tbs-logo.png"
            alt="TBS"
            className="h-6 w-auto object-contain opacity-70"
            onError={(e) => {
              (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'TBS', className: 'text-xs font-bold text-red-400' }));
            }}
          />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">TBS Licensed</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Licence No. 6582</p>
          </div>
        </div>

        {/* SGS */}
        <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/SGS_Logo.svg/200px-SGS_Logo.svg.png"
            alt="SGS"
            className="h-6 w-auto object-contain opacity-70"
            onError={(e) => {
              (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'SGS', className: 'text-xs font-bold text-orange-400' }));
            }}
          />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">SGS Certified</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Non-GMO • &lt;1ppb</p>
          </div>
        </div>

        {/* TCB */}
        <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2">
          <div className="h-6 flex items-center justify-center">
            <span className="text-[11px] font-bold text-green-400 tracking-widest">TCB</span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">TCB Licensed</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Tanzania Cashew Board</p>
          </div>
        </div>
      </div>

      {/* Footer line */}
      <div className="text-center space-y-1">
        <p className="text-[11px] text-gray-600">
          Lenmac Company Limited • Tandahimba, Mtwara Region, Tanzania
        </p>
        <p className="text-[11px] text-gray-600">
          Lumumba Complex, Dar es Salaam • BRELA 176550155 •{' '}
          <a href="https://lenmacai.com" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-400 transition-colors">
            lenmacai.com
          </a>
        </p>
      </div>
    </div>
  );
}
