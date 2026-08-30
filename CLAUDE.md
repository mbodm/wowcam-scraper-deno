# Code style rules

Apply these automatically in every edit. If existing code violates one of them, point it out instead of silently leaving it.

- **JSDoc comments end with a period.** Applies to every `/** ... */` doc comment.
- **Thrown error messages end with a period.** Applies to the string passed to `throw new Error(...)`, `throw new UpstreamError(...)`, `throw new StatusError(...)`, etc.
- **Import statements are ordered by first-use, not alphabetically.** The first import line matches whichever imported symbol is first used (called/referenced) in the file, top to bottom — not by module path or symbol name. Exception: `deno fmt` auto-alphabetizes the named imports *within* a single `{ ... }` group, and that part can't be changed.
