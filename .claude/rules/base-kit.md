<!-- base-kit:start v0.6.1 -->
**base-kit — how we work** (managed by base-kit's installer; edit in base-kit)
1. Main conversation = talk, decide, review; research, sweeps, artifacts → `delegate`, one per batch, one-artifact pilot.
2. Handoff = file: decisions → unit's state/brief, paths not chat. Agents return 3–5 lines (what, where, doubts) with `file:line`.
3. Model tier by task — subagents: mechanical → cheapest; voice/decisions → middle+; architecture or attacking ideas → top. Main session: ask before changing model.
4. Devil's advocate: short round per block; full before changing a skill, rule, process or core piece (not after, not for quick fixes) and before closing a document; or "ataca"; open `@diablo` blocks closing/publishing (gate reads files only). Log each round (date, objection count) in the state file or document. Approach doubts or options → settle them in a round first; bring only the chosen solution to confirm, logging discarded ones and why in the state file. Ask raw only what only the person knows.
5. One state file per unit (Now ≤3, Next, Inbox ≤7, Context), kept live; side topics → Inbox, drained on resume.
6. Capture knowledge, unasked, into the four `config/base-kit.json` stores; a rule applying every time an action happens → that action's file (`knowledge.actions`).
7. Config `unconfigured` → configure first.
8. Claim done with fresh evidence. At close, `Del kit: <what>` only when base-kit got in the way or could do better — no line otherwise.
9. Secrets: never read, print or paste a key — load `.env` with `set -a && source`, check by length; never commit a secret; names (no values) in `.env.example`. A key shown in chat → warn, ask to rotate it.
10. Big task, unclear scope, a change to how parts fit together, or to a skill, rule, process or core piece (not a quick fix) → `plan` skill before touching files: say the path (spike / bounded / architectural), stop until approved.
<!-- base-kit:end -->
