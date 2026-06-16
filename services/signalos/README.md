# SignalOS — service placeholder

**Status:** Documentation and structure only. No routing logic is implemented in this repository.

SignalOS™ concepts, philosophy, and endpoint design live in:

- [docs/signalos/SIGNALOS_MASTER.md](../../docs/signalos/SIGNALOS_MASTER.md)

## Purpose of this folder

Reserved for a future **lightweight, modular** Node.js router when you create a separate implementation repo or add code here. Aligns with the master document:

- Route tasks to the right model (cost, speed, reasoning depth)
- Capture operational signals
- Support fallback and cost-aware routing
- Stay behind product assistants (not a front-facing chatbot)

## Suggested layout (when you build — not created yet)

```
services/signalos/
├── README.md           ← this file
├── package.json
├── src/
│   ├── index.js        # /health, /route
│   ├── policy/         # routing rules (config-driven)
│   ├── adapters/       # OpenRouter, OpenAI, etc.
│   └── signals/        # log schema → Supabase
└── policies/           # per-product routing config (YAML/JSON)
```

Do not duplicate routing philosophy here — keep policy changes documented in the SignalOS master and a future `ROUTING_CHANGELOG.md` if needed.

[← Repository root](../../README.md) · [SignalOS master](../../docs/signalos/SIGNALOS_MASTER.md)
