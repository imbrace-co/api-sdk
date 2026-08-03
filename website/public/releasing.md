## Release Process

How to publish a new version of the TypeScript (`@imbrace/sdk`) or Python (`imbrace`) SDK to npm / PyPI.

Releases are triggered by pushing a Git tag. CI/CD (GitHub Actions) handles quality checks, building, and publishing automatically.

---

## TypeScript SDK — publish to npm

### 1. Bump the version

Edit `ts/package.json`:

```json
{
  "version": "1.0.3"
}
```

### 2. Commit and tag

```bash
git add ts/package.json
git commit -m "chore: bump ts sdk to 1.0.3"
git tag ts-v1.0.3
git push origin main --tags
```

### 3. What CI does (`publish-ts-npm.yml`)

Triggered by tags matching `ts-v*`.

**Job 1 — QA:**
- Lint (`eslint`)
- Type check (`tsc --noEmit`)
- Unit tests (`vitest`)

**Job 2 — Publish** (only if QA passes):
- Build (`tsc --project tsconfig.build.json`)
- Check if the version already exists on npm (skips if it does)
- `npm publish --access public` using `NPM_TOKEN` secret

---

## Python SDK — publish to PyPI

### 1. Bump the version

Edit `py/pyproject.toml`:

```toml
[project]
version = "1.0.3"
```

### 2. Commit and tag

```bash
git add py/pyproject.toml
git commit -m "chore: bump py sdk to 1.0.3"
git tag py-v1.0.3
git push origin main --tags
```

### 3. What CI does (`publish-py-pypi.yml`)

Triggered by tags matching `py-v*`.

**Job 1 — QA:**
- Set up Python 3.10
- Install build tools

**Job 2 — Publish** (only if QA passes):
- Auto-sync version: extracts `1.0.3` from tag `py-v1.0.3` and writes it into `pyproject.toml` (no manual version bump needed in `pyproject.toml` — the tag drives it)
- `python -m build` → produces `dist/*.whl` and `dist/*.tar.gz`
- Publish to PyPI via OIDC trusted publishing (no token required)

---

## Documentation — deploy to GitHub Pages

Triggered automatically on every push to `main` that touches `website/**`.

**Workflow (`deploy-docs.yml`):**
1. `npm ci` in `website/`
2. `NODE_ENV=production npm run build`
3. Upload `website/dist/` as a GitHub Pages artifact
4. Deploy to `https://developer.imbrace.co/`

---

## Tag naming convention

| SDK | Tag pattern | Example |
|---|---|---|
| TypeScript | `ts-v<semver>` | `ts-v1.0.3` |
| Python | `py-v<semver>` | `py-v1.0.3` |

The two SDKs are versioned and released independently.

---

## Required secrets / permissions

| Workflow | Secret / permission |
|---|---|
| npm publish | `NPM_TOKEN` repository secret |
| PyPI publish | OIDC trusted publishing (no secret — configured in PyPI project settings) |
| GitHub Pages | `pages: write` + `id-token: write` permissions (set in workflow) |
