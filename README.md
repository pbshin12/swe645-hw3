# SWE645 HW3 — Student Survey Application

## Peter Shin (pshin2, G01073633)

Full-stack Student Survey application: React frontend served by nginx, deployed to a Kubernetes cluster with a Helm chart, built and shipped by a Jenkins pipeline. (Backend REST API: coming in a later section.)

**Live deployment:** http://54.175.211.106:30610/

---

## Repository Layout

```
swe645-hw3/
├── Jenkinsfile                          # CI/CD pipeline: docker build → push → helm upgrade
├── frontend/
│   ├── Dockerfile                       # Multi-stage: node build → nginx serve
│   ├── .dockerignore
│   └── student-survey-management-system/  # Vite + React app (the survey form)
│       ├── index.html                   # Page shell; loads Bootstrap CSS via CDN
│       └── src/
│           ├── main.jsx                 # React entry point
│           ├── App.jsx                  # Root component
│           └── components/              # Navbar, SurveyForm
└── swe645-hw3/                          # Helm chart
    ├── Chart.yaml
    ├── values.yaml                      # Image repo/tag, replicas, NodePort settings
    └── templates/                       # Deployment, Service, helpers
```

## Prerequisites

Assumed already in place (not covered here): a Jenkins server with Docker available to it, and a Kubernetes cluster (this project uses Rancher on AWS EC2) with a working kubeconfig.

Additionally required:

- **Node.js ≥ 20.19** (v22 LTS recommended) — for local frontend development only
- **Helm 3** on any machine that deploys (and on the Jenkins agent). Install on Debian/Ubuntu:
  ```sh
  curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
  echo "deb [signed-by=/usr/share/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
  sudo apt-get update && sudo apt-get install helm
  ```
  (See https://helm.sh/docs/intro/install/ for the full instructions including the GPG key-fingerprint verification step.)
- A **Docker Hub** account/repository for the frontend image (this project pushes to `frozenmandu/swe645-hw3-frontend`)

## 1. Run the Frontend Locally (development)

```sh
cd frontend/student-survey-management-system
npm install
npm run dev        # dev server with hot reload at http://localhost:5173
```

Other useful scripts: `npm run build` (production build into `dist/`), `npm run lint`.

## 2. Build and Run the Docker Image Manually

From the repository root:

```sh
docker build -t frozenmandu/swe645-hw3-frontend:manual ./frontend
docker run -p 8080:80 frozenmandu/swe645-hw3-frontend:manual
# → http://localhost:8080
```

The Dockerfile is multi-stage: stage 1 (`node:22-alpine`) runs `npm ci && npm run build`; stage 2 (Ubuntu + nginx) serves only the built static files from `/var/www/html` on port 80. No Node.js is needed on the host or in the final image.

To push manually (normally Jenkins does this):

```sh
docker login -u <dockerhub-username>      # paste access token as password
docker push frozenmandu/swe645-hw3-frontend:manual
```

## 3. Deploy to Kubernetes with Helm

On a machine with `helm`, `kubectl`, and a kubeconfig pointing at the target cluster:

```sh
git clone https://github.com/pbshin12/swe645-hw3.git
cd swe645-hw3

helm lint ./swe645-hw3                          # validate the chart
helm template swe645-hw3 ./swe645-hw3 | less    # preview rendered manifests (optional)

# First install or upgrade — same command:
helm upgrade --install swe645-hw3 ./swe645-hw3 --set image.tag=<TAG>
```

`<TAG>` is any tag existing on Docker Hub (Jenkins uses its build number). Omitting `--set image.tag` falls back to the default in `values.yaml`.

What the chart creates:
- **Deployment**: 3 replicas of the frontend image, `imagePullPolicy: Always`, liveness/readiness probes on `/`
- **Service**: NodePort — cluster port 8080 → container port 80, pinned external port **30610**

Verify:

```sh
helm list                                # release "swe645-hw3" deployed
kubectl get pods                         # 3 pods Running
kubectl get svc swe645-hw3               # shows 8080:30610/TCP
```

Then browse to `http://<any-node-public-ip>:30610/` (the EC2 node's public IP; port 30610 must be open in the AWS security group).

Key knobs in `swe645-hw3/values.yaml`: `image.repository`, `image.tag`, `replicaCount`, `service.nodePort`.

To tear down: `helm uninstall swe645-hw3`.

## 4. CI/CD Pipeline (Jenkins)

The `Jenkinsfile` at the repo root defines the full pipeline. One-time Jenkins setup:

1. **Credentials** (Manage Jenkins → Credentials):
   - `dockerhub-creds` — Username/password credential: Docker Hub username + access token
   - `kubeconfig-id` — Secret file credential: the cluster's kubeconfig
2. **Tools on the Jenkins agent**: `docker`, `helm` (kubectl not required — deployment goes through Helm)
3. **Job**: create a Pipeline job pointing at `https://github.com/pbshin12/swe645-hw3.git`, branch `main`, script path `Jenkinsfile`

Pipeline stages on each run:

| Stage | What it does |
|-------|--------------|
| Checkout | Clones the repo from GitHub |
| Build | `docker build` of `./frontend` tagged `frozenmandu/swe645-hw3-frontend:<BUILD_NUMBER>` |
| Push to Docker Hub | Pushes the tag using `dockerhub-creds` |
| Deploy | `helm upgrade --install swe645-hw3 ./swe645-hw3 --set image.tag=<BUILD_NUMBER>` using `kubeconfig-id` (skippable via the `DEPLOY` parameter) |
| Post (always) | Removes the local image tag to keep the agent disk clean |

So a `git push` + Jenkins build = new image on Docker Hub + rolling update on the cluster, with the image tag equal to the Jenkins build number.

## Tools Used

- React 19 + Vite 8 (frontend), Bootstrap 5.3 via CDN (styling)
- Docker (multi-stage build), Docker Hub (registry)
- Kubernetes on AWS EC2 managed with Rancher; Helm 3 (chart scaffolded with `helm create`)
- Jenkins (declarative pipeline)
