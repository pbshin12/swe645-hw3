# SWE645 HW3 — Student Survey Application

## Peter Shin (pshin2, G01073633)

Full-stack Student Survey application: React frontend served by nginx, FastAPI + SQLModel REST API backed by Amazon RDS MySQL, deployed to a Kubernetes cluster with a Helm chart, built and shipped by a Jenkins pipeline.

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
├── backend/
│   ├── Dockerfile                       # python:3.12-slim + uvicorn on port 8000
│   ├── requirements.txt                 # fastapi, sqlmodel, pymysql, ...
│   ├── main.py                          # FastAPI app: CRUD endpoints
│   ├── models.py                        # SQLModel Survey table + API schemas
│   └── database.py                      # Engine from DATABASE_URL; create_all on startup
└── swe645-hw3/                          # Helm chart
    ├── Chart.yaml
    ├── values.yaml                      # Image repos/tags, replicas, NodePort settings
    └── templates/                       # frontend + backend Deployments and Services
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

docker build -t frozenmandu/swe645-hw3-backend:manual ./backend
docker run -p 8000:8000 -e DATABASE_URL='mysql+pymysql://admin:<password>@<rds-endpoint>:3306/surveys' \
  frozenmandu/swe645-hw3-backend:manual
# → http://localhost:8000/docs (note: the RDS instance is only reachable from inside its VPC,
#   so run the backend container on the EC2 instance, or point DATABASE_URL at a local MySQL)
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

# One-time: create the Secret with the database connection URL (see part 5 for the
# RDS setup that produces the endpoint/password — never committed to git).
# Keep the single quotes
kubectl create secret generic swe645-hw3-db \
  --from-literal=DATABASE_URL='mysql+pymysql://admin:<password>@<rds-endpoint>:3306/surveys'

# Verify: the backend Deployment injects this Secret as the DATABASE_URL env var
kubectl get secret swe645-hw3-db -o jsonpath='{.data.DATABASE_URL}' | base64 -d; echo

# First install or upgrade — same command:
helm upgrade --install swe645-hw3 ./swe645-hw3 --set image.tag=<TAG>
```

`<TAG>` is any tag existing on Docker Hub (Jenkins uses its build number). Omitting `--set image.tag` falls back to the default in `values.yaml`; the backend image tag follows `image.tag` unless `backend.image.tag` is set explicitly.

What the chart creates:
- **Frontend Deployment**: 3 replicas of the frontend image, `imagePullPolicy: Always`, liveness/readiness probes on `/`
- **Frontend Service**: NodePort — cluster port 8080 → container port 80, pinned external port **30610**
- **Backend Deployment**: 1 replica of the FastAPI image, `DATABASE_URL` injected from the `swe645-hw3-db` Secret, probes on `/`
- **Backend Service**: NodePort — cluster port 8000 → container port 8000, pinned external port **30611**

Verify:

```sh
helm list                                # release "swe645-hw3" deployed
kubectl get pods                         # frontend + backend pods Running
kubectl get svc                          # swe645-hw3 8080:30610, swe645-hw3-backend 8000:30611
curl http://localhost:30611/             # {"status":"ok"} from the backend
```

Then browse to `http://<any-node-public-ip>:30610/` (the EC2 node's public IP; ports **30610 and 30611** must be open in the AWS security group — 30611 is how the browser-side React app reaches the API).

Key knobs in `swe645-hw3/values.yaml`: `image.repository`, `image.tag`, `replicaCount`, `service.nodePort`, and the `backend:` block (`backend.image.*`, `backend.replicaCount`, `backend.service.nodePort`, `backend.dbSecretName`).

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
| Build | `docker build` of `./frontend` and `./backend`, both tagged `:<BUILD_NUMBER>` |
| Push to Docker Hub | Pushes both tags using `dockerhub-creds` |
| Deploy | `helm upgrade --install swe645-hw3 ./swe645-hw3 --set image.tag=<BUILD_NUMBER>` using `kubeconfig-id` (skippable via the `DEPLOY` parameter; the backend tag follows `image.tag`) |
| Post (always) | Removes the local image tags to keep the agent disk clean |

So a `git push` + Jenkins build = new frontend + backend images on Docker Hub + rolling update on the cluster, with the image tags equal to the Jenkins build number.

## 5. Provision the Database (Amazon RDS MySQL)

The backend stores surveys in a MySQL database on Amazon RDS, outside the cluster. One-time setup in the AWS Console:

1. **RDS → Create database** → *Standard create* → Engine: **MySQL** (8.0.x).
2. **Template: Free tier** (or *Dev/Test* with **Single-AZ** deployment). Do **not** use the Production template — it defaults to Multi-AZ and incurs real charges.
3. **Settings**: DB instance identifier `swe645-hw3-db`, master username `admin`, self-managed master password (save it — it goes into a Kubernetes Secret in step 4 below, and is never committed to git, see sample code in section 3).
4. **Instance & storage**: `db.t4g.micro` (or `db.t3.micro`), 20 GiB gp3, **disable storage autoscaling**.
5. **Connectivity**: choose **"Connect to an EC2 compute resource"** and select the cluster's EC2 instance — the console places the database in the same VPC and wires up the security groups (inbound TCP 3306 from the instance) automatically. Public access stays **No**; the database is reachable only from inside the VPC.
6. **Additional configuration**: set *Initial database name* to `surveys`; disable automated backups, enhanced monitoring, and deletion protection (dev-only instance).
7. Create the database and wait until its status is **Available** (~5–10 min), then copy the **endpoint** from the *Connectivity & security* tab.
8. Verify reachability from the EC2 instance: `nc -zv <endpoint> 3306` (or connect with `mysql -h <endpoint> -u admin -p`).

The backend consumes the database via a single connection URL, supplied through a Kubernetes Secret (created at deploy time, never committed):

```
mysql+pymysql://admin:<password>@<endpoint>:3306/surveys
```

No manual schema setup is needed: the backend defines the survey table as a SQLModel class and creates it automatically on first startup (`SQLModel.metadata.create_all`).

**Cost note:** the instance bills hourly while it exists. The app does not need to be live for grading — stop or delete the RDS instance after the demo video is recorded.

## 6. Backend REST API

The backend (`backend/`) is a FastAPI application using SQLModel over the RDS database. On startup it creates the `survey` table automatically — no manual schema setup.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Health check (used by the k8s probes) |
| POST | `/surveys` | Create a survey (201 + created record) |
| GET | `/surveys` | List all surveys |
| GET | `/surveys/{id}` | Get one survey (404 if absent) |
| PUT | `/surveys/{id}` | Update the provided fields of a survey |
| DELETE | `/surveys/{id}` | Delete a survey (204) |

Interactive Swagger docs are served at `/docs` (e.g. `http://<node-ip>:30611/docs`) — handy alongside Postman for testing. Example Postman/curl create:

```sh
curl -X POST http://<node-ip>:30611/surveys -H 'Content-Type: application/json' -d '{
  "first_name": "George", "last_name": "Mason",
  "street_address": "4400 University Dr", "city": "Fairfax", "state": "VA",
  "zip": "22030", "telephone": "703-993-1000", "email": "gmason@gmu.edu",
  "survey_date": "2026-07-12", "liked_most": "campus,atmosphere",
  "interest_source": "friends", "recommendation": "Very Likely"
}'
```

For local development without Docker (requires Python 3.12+ and network reach to a MySQL database):

```sh
cd backend
pip install -r requirements.txt
DATABASE_URL='mysql+pymysql://admin:<password>@<endpoint>:3306/surveys' uvicorn main:app --reload
# → http://localhost:8000/docs
```

## Tools Used

- React 19 + Vite 8 (frontend), Bootstrap 5.3 via CDN (styling)
- FastAPI + SQLModel/SQLAlchemy + PyMySQL on Python 3.12, served by uvicorn (backend REST API)
- Docker (multi-stage build), Docker Hub (registry)
- Kubernetes on AWS EC2 managed with Rancher; Helm 3 (chart scaffolded with `helm create`)
- Jenkins (declarative pipeline)
- Amazon RDS MySQL 8 (persistence); inspect data with the `mysql` client from the EC2 instance if needed
