# Code style rules

Apply these automatically in every edit. If existing code violates one of them, point it out instead of silently leaving it.

- **JSDoc comments end with a period.** Applies to every `/** ... */` doc comment.
- **Thrown error messages end with a period.** Applies to the string passed to `throw new Error(...)`, `throw new UpstreamError(...)`, `throw new StatusError(...)`, etc.
- **Import statements are ordered by first-use, not alphabetically.** The first import line matches whichever imported symbol is first used (called/referenced) in the file, top to bottom — not by module path or symbol name. Exception: `deno fmt` auto-alphabetizes the named imports *within* a single `{ ... }` group, and that part can't be changed.

## UpstreamError vs. normal Error

Rule of thumb for deciding which to throw:

- **`UpstreamError`**: something went wrong with the *call itself* to another service/site (FlareSolverr, Curse, a file download, etc.) — a timeout, a bad HTTP status, the service explicitly reporting failure in its own response (e.g. FlareSolverr's `status` field saying "not ok", or a proxied HTTP status indicating the target site returned an error), **or the response violates that service's own documented/declared contract** (a field its API always promises to include is missing or malformed). A broken contract means the service itself misbehaved, even though the HTTP call transported fine.
- **Normal `Error`**: the call succeeded, and the response honors the service's own contract — but the *content* inside it isn't what we expected (an expected tag/pattern wasn't found in scraped page content, a value we're inferring ourselves doesn't match an assumed format, and so on). This also covers basic defensive checks that aren't really about any documented contract (e.g. a bare null-check on a parsed body).

The dividing line is not just "did the HTTP call fail" — a response that violates its own service's documented shape still counts as `UpstreamError`, even though the transport succeeded. What actually decides it: is the field/value in question something the service's own API contract guarantees, or is it something *we* are inferring/assuming from unstructured content (like scraped third-party HTML) that the service never promised anything about?

When touching a file that throws either of these, check existing throw sites against this rule and mention any that look misclassified — don't silently leave a mismatch, and don't silently "fix" one either without flagging it first.
