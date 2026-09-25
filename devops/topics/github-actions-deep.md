# Deep Dive: GitHub — Collaboration Hub, GitHub Actions & Security

> **Standalone topic:** GitHub sirf "git ka remote" nahi — **developer collaboration ka puri platform hai**: Repos, PRs, Issues, Projects, Actions (CI/CD), Packages, Codespaces, aur Advanced Security. Ye deep dive day-specific nahi, apna ek complete knowledge block hai.

---

## 1. GitHub Ka Big Picture

```
Git (local) ──push──▶ GitHub (remote home) ──pull/PR──▶ Team
                     │     ├── Issues/Projects (planning)
                     │     ├── GitHub Actions (CI/CD)
                     │     ├── Packages (containers/libs)
                     │     ├── Codespaces (cloud dev env)
                     │     └── Advanced Security (code/dependabot/secret scan)
```

| Layer | Kya karta hai | DevClo equivalent |
|-------|---------------|-------------------|
| **Repositories** | Code ka source of truth, branches, tags, releases | `git remote` |
| **Pull Requests** | Code review + merge proses | branch → merge |
| **Issues & Projects** | Work tracking + kanban board | tickets/sprint |
| **Actions** | Event pe workflow chalao (CI/CD/deploy/automation) | CI/CD (Day 8-10 ka home) |
| **Packages** | Docker images + npm/nuget etc. publish/store | artifact registry |
| **Codespaces** | Browser/se-dkhi cloud dev container | dev environment |
| **Advanced Security** | CodeQL, secret scanning, dependabot alerts | DevSecOps |

---

## 2. Repositories — Configuration Matters

```bash
gh repo create myapp --public --clone
gh repo view myapp
gh repo rename myapp myapp2
gh pr create --title "feat: add health endpoint" --fill
gh pr merge --squash
```

Key config files:
- `README.md` — pehli impression + docs start
- `.gitignore` — build junk (node_modules/, .env, target/) kabhi commit mat karo
- `LICENSE` — legal ownership
- `CODEOWNERS` — filewise reviewer auto-assign (senior touch)
- Branch protection: `main` pe **required PR + required checks + linear history** — junior vs senior wo yahan dikhta hai.

---

## 3. GitHub Actions — Event-Driven CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: pytest -q
      - run: docker build -t myapp .
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: docker push ghcr.io/myorg/myapp:latest
```

### Core concepts
| Concept | Matlab |
|---------|--------|
| **Workflow** | `.yml` file in `.github/workflows/` — one automation unit |
| **Event** | trigger: push, PR, schedule, workflow_dispatch (manual) |
| **Job** | ek runner pe chale steps ka set (can run in parallel) |
| **Step** | ek command ya `uses:` action |
| **Runner** | GitHub-hosted (ubuntu/macos/windows) ya self-hosted |
| **Contexts** | `github.*`, `secrets.*`, `env.*`, `inputs.*` |
| **Expressions** | `${{ }}` — condition/loop logic |

### Common workflow patterns
```yaml
# Secrets use (does not leak in logs)
env:
  AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}

# Conditional step
- name: Deploy to prod
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./deploy.sh

# Matrix build — multiple versions ek sath
strategy:
  matrix:
    python-version: ['3.11', '3.12']
```

### Caching & Artifacts
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
- uses: actions/upload-artifact@v4
  with: { name: build, path: dist/ }
```

---

## 4. GitHub Packages — Registry

```bash
# Docker image ko GHCR (GitHub Container Registry) me push
echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
docker tag myapp ghcr.io/myorg/myapp:latest
docker push ghcr.io/myorg/myapp:latest

# Pull
docker pull ghcr.io/myorg/myapp:latest
```

- `pkgs` permission token se control karo
- Images ko org-level private/public set karo
- Packages kisi bhi Action/downstream repo se version-pin karke use karo

---

## 5. Advanced Security (native, enterprise)

| Feature | Kya | DevClo link |
|---------|-----|-------------|
| **Code scanning (CodeQL)** | repo code me vulnerabilities find | SAST |
| **Secret scanning** | pushed secrets detect + alert | gitleaks |
| **Dependabot** | vulnerable deps → alert + auto PR update | SCA |
| **Supply-chain (SBOM)** | dependency graph + SBOM export | SBOM/SLSA |

---

## 6. Interview-Friendly Summary

- **"GitHub kya hai?"** — code ka home + collaboration: PRs, Issues, Actions, Packages, Security.
- **"PR flow?"** — branch → push → PR → review → checks pass → merge (squash/rebase) → branch delete.
- **"GitHub Actions vs Jenkins?"** — Actions = repo se coupled, YAML-first, hosted runners, marketplace; Jenkins = self-hosted, plugin-based, mature enterprise.
- **"Secrets kaise security me rakho?"** — `secrets.GITHUB_TOKEN` (auto, scoped) + org secrets; kabhi plaintext env me mat dalo.
- **"Environment protection?"** — environments (dev/staging/prod) + required reviewers + wait timer → manual approval gates.

---

## 7. Seniors Wali Cheezein

- **Conventional Commits** + semantic-release → version bump + CHANGELOG auto.
- **Stale bot / auto-label / triage** — repo health at scale.
- **`gh` CLI** se sab kuch terminal se (screencast-friendly portfolio).
- **Workflow security:** `actions/checkout@v4` pinned sha ko prefer karo; third-party actions ko audit karo (supply chain).
- **Self-hosted runners** in AKS/on-prem → private data edge pe.