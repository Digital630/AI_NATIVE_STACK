// TCB Tanzania Cashew Board — Official Market Data
// Source: TCB officer communication, May 2025

export const TCB_AUCTION_PRICES = [
  { season: '2024/25', min_tzs_kg: 1810, max_tzs_kg: 4196, union: 'TANECU Mtwara' },
  { season: '2024/25', min_tzs_kg: 3400, max_tzs_kg: 3865, union: 'LMCU Lindi' },
  { season: '2025/26', min_tzs_kg: 2550, max_tzs_kg: 3520, union: 'TANECU Tandahimba' },
  { season: '2025/26', min_tzs_kg: 2310, max_tzs_kg: 2700, union: 'MAMCU Mtwara' },
  { season: '2025/26', min_tzs_kg: 2460, max_tzs_kg: 2610, union: 'RUNALI Lindi' },
]

export const TCB_EXPORT_VOLUMES = [
  { year: 2024, season: '2024/25', volume_mt: 528260, earnings_usd: 583700000 },
  { year: 2023, season: '2023/24', volume_mt: 305000, earnings_usd: 227000000 },
  { year: 2022, season: '2022', volume_mt: 240158, earnings_usd: 180600000 },
]

export const TCB_QUALITY_PARAMS = {
  moisture_max_pct: 10,
  defective_nuts_max_pct: 15,
  float_max_pct: 18,
  mold_tolance: 0,
  aflatoxin_limit_ug_kg: 4,
}

export const TZS_USD_RATE = 2600
