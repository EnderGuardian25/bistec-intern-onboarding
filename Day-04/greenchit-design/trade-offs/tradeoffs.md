# GreenChit — Trade-offs
**Hosting Platform Decision: App Service Monolith vs Container Apps Split**

---

## Setup

### Two Architectural Options Under Review

**Option A: Azure App Service Monolith**
Deploy the whole application (React frontend + .NET backend) together on Azure App Service. One deployment, one place to manage, one log stream to check when something breaks.

**Option B: Azure Container Apps Split**
Package the frontend and backend as separate Docker containers and deploy them independently on Azure Container Apps. Each service has its own container image and can be updated without touching the other.

---

## Trade-off Table

| Quality Attribute | Option A: App Service Monolith | Option B: Container Apps Split | Why |
|---|---|---|---|
| **Time-to-first-deploy** | **5** | **2** | With App Service you can deploy with a simple `dotnet publish` and a GitHub Actions workflow. Container Apps requires building Docker images, setting up a container registry, and configuring ingress — a lot of setup before anything is running. |
| **Cost (low spend)** | **5** | **2** | App Service is a flat monthly fee (around $70/month on S1). Container Apps bills by compute time used, which can be unpredictable during development. For a low-traffic internal tool, the flat rate is easier to manage and budget for. |
| **Operability for 10-person team** | **4** | **3** | App Service is straightforward to operate — restart, check logs, swap a deployment slot. Container Apps adds container-specific troubleshooting like image pull failures and revision management, which takes more experience to handle confidently. |
| **Independent deploy** | **1** | **5** | This is where Option A is clearly weaker. In a monolith, updating the frontend means redeploying the whole application. Container Apps lets you update each service separately, which is much cleaner. |
| **Future scaling** | **2** | **5** | If GreenChit grows, different parts of the system will have different load. Container Apps can scale each service independently. App Service scales everything together, which wastes compute and money at scale. |
| **Authn/authz consistency** | **4** | **3** | In a monolith, JWT auth lives in one place and applies to every request automatically. In a split architecture you have to make sure auth is correctly enforced across every service boundary. |
| **Total** | **21** | **20** |  |

---

## Results Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| Quality attributes scored | 6 | 6 |
| Cells with a written justification | 12 | 12 |
| Decision-affecting attributes identified | 2–3 | 3 |

---

## Decision and Rationale

**We choose Option A: Azure App Service Monolith.**

The scores are 21 to 20, which reflects the fact that Container Apps are genuinely a good option but not at this stage.

**Time-to-first-deploy** had the biggest gap (5 vs 2). As a learning team, spending the first week fighting Docker and container registries instead of building the claims workflow would be a real setback. App Service lets us get something running quickly and iterate from there.

**Authn/authz consistency** also favoured Option A. Because GreenChit handles financial data, getting authentication wrong is a compliance issue. Having one central JWT middleware in a monolith is simpler and harder to accidentally misconfigure than distributing auth across multiple services.

**Independent deploy** is what we are giving up. Redeploying the whole app for a frontend change is not ideal. If GreenChit grows and separate teams end up owning the frontend and backend, this will become a real problem and we would need to revisit this decision.
