# Multi-ATS Career & GTM Buying Signals Normalizer

> **Extract standardized open roles, 30-day hiring velocity, department breakdown, GTM buying signals, and 65+ B2B tech stack signals from 8 major ATS platforms in milliseconds — with Zero-Charge Protection.**

Built for **Clay workflows, n8n / Make automations, AI SDRs, RevOps teams, and B2B Lead Enrichment pipelines**. Zero headless browsers, zero fragile DOM scrapers, zero LLM token bloat — pure public ATS JSON APIs normalized into one clean schema.

---

## Why Use This Actor Instead of Building Your Own Scraper?

| Pain Point | DIY Career Page Scraper | Multi-ATS Hiring Signals Normalizer |
|---|---|---|
| **Speed & Cost** | Puppeteer/Playwright burns RAM & proxy credits (10–30s/company) | **Pure HTTP JSON APIs** (200–800ms/company, minimal compute) |
| **Maintenance** | Breaks every time a company redesigns `/careers` | **8 Stable Public ATS JSON APIs** + daily automated Canary CI |
| **Schema Chaos** | Every ATS has different JSON keys & nested arrays | **1 Unified GTM Schema** across all 8 ATS platforms |
| **Wasted Spend** | Pay for empty/404 runs | **Zero-Charge Protection**: $0 charged when 0 active jobs found |

---

## Supported ATS Platforms (8 Major Public JSON APIs)

1. **Greenhouse** (`boards-api.greenhouse.io`)
2. **Ashby** (`api.ashbyhq.com`)
3. **Lever** (`api.lever.co`)
4. **Workable** (`apply.workable.com`)
5. **SmartRecruiters** (`api.smartrecruiters.com`)
6. **Recruitee** (`*.recruitee.com`)
7. **Breezy HR** (`*.breezy.hr`)
8. **Pinpoint** (`*.pinpointhq.com`)

**Smart Resolution Engine**: Pass in a domain (`stripe.com`), a slug (`airbnb`), or a direct ATS URL (`https://jobs.ashbyhq.com/linear`). The Actor automatically probes smart slug variants and optionally inspects `/careers` HTML for embedded ATS links.

---

## High-Value GTM Buying Signals Included (0 LLM Cost)

Every matched company is enriched with deterministic, high-precision buying signals:

- **Hiring Velocity (`hiringVelocity30d`)**: Number of roles posted/updated in the last 30 days.
- **Buying Signal Flags & Counts**:
  - `isHiringSales` / `salesRolesCount` (AEs, SDRs, BDRs, Solutions Engineers, Partnerships)
  - `isHiringRevOps` / `revOpsRolesCount` (RevOps, Sales Ops, Marketing Ops, Salesforce/HubSpot Admins)
  - `isHiringEngineering` / `engineeringRolesCount`
  - `isHiringAI` / `aiRolesCount` (ML, LLM, GenAI, Applied Scientist)
  - `isHiringSecurity` / `securityRolesCount` (AppSec, CloudSec, GRC, CISO)
  - `isHiringExecutive` / `executiveRolesCount` (VP, SVP, Head of, C-Suite)
  - `remoteFriendlyRatio` (0.00 – 1.00)
- **65+ B2B Tech Stack Detection (`detectedTechStack`)**: Automatically scans job titles & descriptions for tools like **Salesforce, HubSpot, Snowflake, Databricks, dbt, AWS, GCP, Kubernetes, Terraform, Stripe, Clay, Apollo, Segment, Datadog, Figma, Next.js, Python, Rust, PyTorch**, and more — complete with mention counts and sample roles.

---

## Popular Use Cases

- **Clay / Apollo / HubSpot Enrichment**: Feed a list of target account domains and immediately score accounts hiring RevOps + using Salesforce + Snowflake.
- **AI SDR Personalization (n8n / Make / Zapier)**: Trigger hyper-relevant outbound emails referencing exact open roles and newly adopted tech stack tools.
- **VC & Private Equity Deal Sourcing**: Track 30-day hiring velocity spikes across hundreds of startups weekly.
- **Recruiting Agencies**: Spot companies aggressively expanding Sales, AI, or Security teams before competitors do.

---

## Zero-Charge Protection Pricing (Pay-Per-Event)

You **only pay** (`company-signal-extracted` event) when the Actor successfully extracts **at least 1 active open role** for a company.

- Company found with active jobs → `status: "ok"`, `charged: true`
- Company has no public ATS or 0 open jobs → `status: "not_found"`, `charged: false` (**$0 charged**)
- Automatically stops gracefully if your run budget limit (`maxTotalChargeUsd`) is reached.

---

## Input Example

```json
{
  "companies": [
    "stripe.com",
    "airbnb.com",
    "figma.com",
    "linear.app",
    "notion.so"
  ],
  "includeJobsList": true,
  "maxJobsPerCompany": 50,
  "detectTechStack": true,
  "discoverFromWebsite": true,
  "concurrency": 5
}
```

---

## Output Example

```json
{
  "company": "linear.app",
  "domain": "linear.app",
  "atsProvider": "ashby",
  "atsSlug": "linear",
  "boardUrl": "https://jobs.ashbyhq.com/linear",
  "status": "ok",
  "openRolesCount": 24,
  "hiringVelocity30d": 9,
  "departments": {
    "Engineering": 12,
    "Go-to-Market": 7,
    "Design": 3,
    "Operations": 2
  },
  "buyingSignals": {
    "isHiringSales": true,
    "salesRolesCount": 6,
    "isHiringRevOps": true,
    "revOpsRolesCount": 1,
    "isHiringEngineering": true,
    "engineeringRolesCount": 11,
    "isHiringAI": true,
    "aiRolesCount": 2,
    "isHiringSecurity": true,
    "securityRolesCount": 1,
    "isHiringExecutive": false,
    "executiveRolesCount": 0,
    "remoteFriendlyRatio": 0.92,
    "hiringVelocity30d": 9
  },
  "detectedTechStack": [
    {
      "tool": "TypeScript",
      "category": "Language",
      "mentions": 10,
      "sampleRoles": ["Senior Product Engineer", "Staff Frontend Engineer"]
    },
    {
      "tool": "React",
      "category": "Framework",
      "mentions": 8,
      "sampleRoles": ["Senior Product Engineer"]
    }
  ],
  "jobs": [
    {
      "id": "job-12345",
      "title": "Senior Product Engineer",
      "department": "Engineering",
      "location": "Remote (US/EU)",
      "isRemote": true,
      "employmentType": "FullTime",
      "publishedAt": "2026-11-18T14:22:00.000Z",
      "url": "https://jobs.ashbyhq.com/linear/job-12345",
      "compensation": "$180K – $240K"
    }
  ],
  "charged": true,
  "extractedAt": "2026-11-26T06:50:00.000Z"
}
```

---

## 🔗 Complete Your Clay / n8n Outbound Stack (Zero-PII GTM Trilogy)

Pair **Multi-ATS Hiring Signals** with our companion zero-browser Actors to build a fully automated **"Newly Funded ➔ Actively Hiring ➔ Verified Tech Stack"** outbound waterfall:

1. **💰 Step 1 — Find Newly Funded US Startups**: [**US Startup Funding Signals (SEC Form D, Zero-PII)**](https://apify.com/howardkung/sec-form-d-funding-signals) — Daily SEC EDGAR Form D operating startups (pooled funds excluded).
2. **👥 Step 2 — Check Hiring Velocity & Department Intent**: **Multi-ATS Career & GTM Buying Signals** *(this Actor)* — Instant open roles, 30-day velocity, and RevOps/AI hiring flags across 8 ATS APIs.
3. **🛡️ Step 3 — Verify Email Gateway, DNS SaaS & Trust Center**: [**Company DNS, Email-Auth & Tech-Stack Signals**](https://apify.com/howardkung/domain-dns-tech-trust-signals) — Detect Google Workspace vs. Microsoft 365, Proofpoint/Mimecast spam traps, 60+ DNS TXT SaaS verifications, and Vanta/Drata Trust Centers before sending cold emails.
4. **⚡ Free Ready-to-Import n8n Workflow**: Grab the pre-wired GTM enrichment workflow in [**howardKung/agentguard-kit**](https://github.com/howardKung/agentguard-kit).

