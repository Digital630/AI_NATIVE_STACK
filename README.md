# AI-Native Stack — LenDigital Ecosystem Memory

Operational memory and institutional documentation for **LenDigital Solutions** AI-native products. This repository holds master documents, ops references, and preparation space for **SignalOS™** routing infrastructure — not production application code.

**Philosophy (unchanged):** Route intelligence, capture signals, improve decisions. Operational execution is the product.

---

## Repository layout

| Path | Purpose |
|------|---------|
| [`docs/`](docs/README.md) | Product and platform master documents |
| [`docs/signalos/`](docs/signalos/SIGNALOS_MASTER.md) | SignalOS™ — AI routing & operational intelligence |
| [`ops/`](ops/shortcuts.md) | Terminal shortcuts and core commands |
| [`services/signalos/`](services/signalos/README.md) | Reserved for future modular router (not implemented) |
| [`assets/reports/`](assets/reports/) | Local reports and PDFs (gitignored when added) |
| [`SANDBOX/`](SANDBOX/test-repo-github/) | Practice and experiments — non-production |

---

## Ecosystem masters

| System | Role | Master document |
|--------|------|-----------------|
| **SignalOS™** | AI routing, signals, cross-product intelligence | [SIGNALOS_MASTER.md](docs/signalos/SIGNALOS_MASTER.md) |
| **LenmacAI™** | Export operations, Alex assistant | [LENMACAI_MASTER.md](docs/lenmacai/LENMACAI_MASTER.md) |
| **SmartDoc Portal™** | Healthcare & scheduling coordination | [SMARTDOC_MASTER.md](docs/smartdoc/SMARTDOC_MASTER.md) |
| **AgriSMES™** | Cashew margin & trade intelligence | [AGRISMES_MASTER.md](docs/agrismes/AGRISMES_MASTER.md) |
| **VisitMtwara™** | Local discovery & services | [VISITMTWARA_MASTER.md](docs/visitmtwara/VISITMTWARA_MASTER.md) |
| **TrabzonHub™** | Tourism coordination | [TRABZONHUB_MASTER.md](docs/trabzonhub/TRABZONHUB_MASTER.md) |
| **Tanzaload™** | Strategic core architecture | [TANZALOAD_MASTER.md](docs/tanzaload/TANZALOAD_MASTER.md) |
| **AI-OPS Learning** | Skills and learning path | [LEARNING_PATH.md](docs/learning/LEARNING_PATH.md) |

---

## Key relationships (preserved)

- **Alex (LenmacAI)** ↔ **SignalOS** — workflow routing and operational signals
- **SmartDoc** ↔ **SignalOS** — appointment and clinic intelligence
- **AgriSMES** ↔ **LenmacAI** — margin analysis and trade depth
- **VisitMtwara / TrabzonHub** ↔ **SignalOS** — local and tourism signals

Product code lives in separate repositories (e.g. SmartDoc-Portal, signalos-router). This repo is the **source of truth for strategy and operational memory**.

---

## Local setup

```bash
cp .env.example .env
# Edit .env with your keys — never commit .env
```

See [`ops/shortcuts.md`](ops/shortcuts.md) for terminal workflows.

---

Powered by LenDigital Solutions
