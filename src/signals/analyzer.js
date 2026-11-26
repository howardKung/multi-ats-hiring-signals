/**
 * Deterministic GTM Buying Signals & 65+ B2B Tech Stack Analyzer.
 * Pure regex & dictionary matching — 0 LLM tokens, $0 marginal cost.
 */

const ROLE_SIGNAL_PATTERNS = {
  sales: /\b(account executive|sales development|sdr|bdr|sales manager|vp of sales|head of sales|enterprise sales|mid-market sales|sales engineer|solutions engineer|solutions architect|account manager|customer success|partnerships|business development|gtm|go-to-market|commercial|regional sales|director of sales|chief revenue)\b/i,
  revOps: /\b(revops|revenue operations|sales operations|sales ops|marketing operations|marketing ops|gtm operations|gtm systems|salesforce admin|salesforce developer|hubspot admin|deal desk|business systems|commercial operations)\b/i,
  engineering: /\b(software engineer|backend engineer|frontend engineer|full[- ]?stack|staff engineer|principal engineer|platform engineer|infrastructure engineer|site reliability|sre|devops|mobile engineer|ios engineer|android engineer|systems engineer|embedded engineer|data engineer|qa engineer|engineering manager)\b/i,
  ai: /\b(artificial intelligence|machine learning|\bml\b|\bai\b engineer|llm|large language model|generative ai|genai|deep learning|nlp|computer vision|research scientist|applied scientist|ai researcher|prompt engineer|mlops|ai platform|foundation model)\b/i,
  security: /\b(security engineer|cybersecurity|infosec|information security|appsec|application security|cloud security|product security|secops|soc analyst|grc|governance risk|compliance|trust & safety|threat intelligence|penetration test|red team|ciso|privacy engineer)\b/i,
  executive: /\b(chief executive|chief technology|chief financial|chief revenue|chief operating|chief marketing|chief product|chief information|chief security|\bceo\b|\bcto\b|\bcfo\b|\bcro\b|\bcoo\b|\bcmo\b|\bcpo\b|\bciso\b|\bvp\b|vice president|svp|evp|head of |general manager)\b/i,
};

/**
 * 65+ High-Value B2B SaaS, Cloud, Data, DevTools, Security, and Sales/Marketing tools.
 * Each entry uses word-boundary regexes tuned to minimize false positives.
 */
export const TECH_STACK_DICTIONARY = [
  // CRM & GTM / Sales / Marketing
  { tool: 'Salesforce', category: 'GTM/CRM', regex: /\b(salesforce|sfdc|apex|soql)\b/i },
  { tool: 'HubSpot', category: 'GTM/CRM', regex: /\bhubspot\b/i },
  { tool: 'Clay', category: 'GTM/Sales', regex: /\bclay\.com\b|\bclay\b(?=.*(?:gtm|revops|enrichment|outbound|sdr|growth|sales))/i },
  { tool: 'Apollo', category: 'GTM/Sales', regex: /\bapollo\.io\b/i },
  { tool: 'Gong', category: 'GTM/Sales', regex: /\bgong\.io\b|\bgong\b(?=.*(?:sales|revenue|call|coaching|crm))/i },
  { tool: 'Outreach', category: 'GTM/Sales', regex: /\boutreach\.io\b/i },
  { tool: 'SalesLoft', category: 'GTM/Sales', regex: /\bsalesloft\b/i },
  { tool: 'ZoomInfo', category: 'GTM/Sales', regex: /\bzoominfo\b/i },
  { tool: '6sense', category: 'GTM/Marketing', regex: /\b6sense\b/i },
  { tool: 'Marketo', category: 'GTM/Marketing', regex: /\bmarketo\b/i },
  { tool: 'Braze', category: 'GTM/Marketing', regex: /\bbraze\b/i },
  { tool: 'Segment', category: 'GTM/Analytics', regex: /\bsegment\b(?=.*(?:cdp|analytics|data|tracking|twilio|event))/i },
  { tool: 'Amplitude', category: 'Product Analytics', regex: /\bamplitude\b/i },
  { tool: 'Mixpanel', category: 'Product Analytics', regex: /\bmixpanel\b/i },
  { tool: 'PostHog', category: 'Product Analytics', regex: /\bposthog\b/i },
  { tool: 'Zendesk', category: 'Customer Support', regex: /\bzendesk\b/i },
  { tool: 'Intercom', category: 'Customer Support', regex: /\bintercom\b/i },

  // Data Warehouse, BI & Pipelines
  { tool: 'Snowflake', category: 'Data', regex: /\bsnowflake\b/i },
  { tool: 'Databricks', category: 'Data', regex: /\bdatabricks\b/i },
  { tool: 'dbt', category: 'Data', regex: /\bdbt\b/i },
  { tool: 'BigQuery', category: 'Data', regex: /\bbigquery\b/i },
  { tool: 'Redshift', category: 'Data', regex: /\bredshift\b/i },
  { tool: 'Apache Airflow', category: 'Data', regex: /\bairflow\b/i },
  { tool: 'Apache Kafka', category: 'Data', regex: /\bkafka\b/i },
  { tool: 'Apache Spark', category: 'Data', regex: /\b(pyspark|apache spark|\bspark\b(?=.*(?:data|etl|hadoop|databricks|scala)))/i },
  { tool: 'Fivetran', category: 'Data', regex: /\bfivetran\b/i },
  { tool: 'Looker', category: 'BI', regex: /\blooker\b/i },
  { tool: 'Tableau', category: 'BI', regex: /\btableau\b/i },
  { tool: 'Power BI', category: 'BI', regex: /\bpower\s?bi\b/i },
  { tool: 'ClickHouse', category: 'Data', regex: /\bclickhouse\b/i },

  // Cloud & Infrastructure
  { tool: 'AWS', category: 'Cloud', regex: /\b(aws|amazon web services|ec2|s3|dynamodb|eks|rds)\b/i },
  { tool: 'GCP', category: 'Cloud', regex: /\b(gcp|google cloud platform|google cloud)\b/i },
  { tool: 'Azure', category: 'Cloud', regex: /\b(microsoft azure|\bazure\b)\b/i },
  { tool: 'Kubernetes', category: 'Infra', regex: /\b(kubernetes|k8s)\b/i },
  { tool: 'Docker', category: 'Infra', regex: /\bdocker\b/i },
  { tool: 'Terraform', category: 'Infra', regex: /\bterraform\b/i },
  { tool: 'Cloudflare', category: 'Infra', regex: /\bcloudflare\b/i },
  { tool: 'Vercel', category: 'Infra', regex: /\bvercel\b/i },
  { tool: 'Datadog', category: 'Observability', regex: /\bdatadog\b/i },
  { tool: 'Sentry', category: 'Observability', regex: /\bsentry\b/i },
  { tool: 'Prometheus', category: 'Observability', regex: /\bprometheus\b/i },
  { tool: 'Grafana', category: 'Observability', regex: /\bgrafana\b/i },
  { tool: 'Splunk', category: 'Observability', regex: /\bsplunk\b/i },
  { tool: 'GitHub Actions', category: 'DevOps', regex: /\bgithub actions\b/i },
  { tool: 'CircleCI', category: 'DevOps', regex: /\bcircleci\b/i },

  // Databases
  { tool: 'PostgreSQL', category: 'Database', regex: /\b(postgres|postgresql)\b/i },
  { tool: 'MySQL', category: 'Database', regex: /\bmysql\b/i },
  { tool: 'MongoDB', category: 'Database', regex: /\bmongodb\b/i },
  { tool: 'Redis', category: 'Database', regex: /\bredis\b/i },
  { tool: 'Elasticsearch', category: 'Database', regex: /\belasticsearch\b/i },

  // Languages & Frameworks
  { tool: 'TypeScript', category: 'Language', regex: /\btypescript\b/i },
  { tool: 'Python', category: 'Language', regex: /\bpython\b/i },
  { tool: 'Go', category: 'Language', regex: /\b(golang|\bgo\b(?=.*(?:engineer|backend|rust|python|java|microservices|distributed)))/i },
  { tool: 'Rust', category: 'Language', regex: /\brust\b(?=.*(?:engineer|systems|c\+\+|go|python|cargo|wasm|backend|memory|compiler))/i },
  { tool: 'Java', category: 'Language', regex: /\bjava\b(?!script)/i },
  { tool: 'Ruby on Rails', category: 'Framework', regex: /\b(ruby on rails|\brails\b)\b/i },
  { tool: 'React', category: 'Framework', regex: /\breact(?:\.js|js)?\b/i },
  { tool: 'Next.js', category: 'Framework', regex: /\bnext\.?js\b/i },
  { tool: 'Node.js', category: 'Runtime', regex: /\bnode\.?js\b/i },
  { tool: 'GraphQL', category: 'API', regex: /\bgraphql\b/i },

  // AI / ML
  { tool: 'PyTorch', category: 'AI/ML', regex: /\bpytorch\b/i },
  { tool: 'TensorFlow', category: 'AI/ML', regex: /\btensorflow\b/i },
  { tool: 'OpenAI', category: 'AI/ML', regex: /\bopenai\b/i },
  { tool: 'Anthropic', category: 'AI/ML', regex: /\banthropic\b|\bclaude\b/i },
  { tool: 'LangChain', category: 'AI/ML', regex: /\blangchain\b/i },
  { tool: 'Hugging Face', category: 'AI/ML', regex: /\bhugging\s?face\b/i },

  // Payments, Design, Security & Collaboration
  { tool: 'Stripe', category: 'Payments', regex: /\bstripe\b(?=.*(?:api|payments|billing|checkout|fintech|webhook|subscription))/i },
  { tool: 'Figma', category: 'Design', regex: /\bfigma\b/i },
  { tool: 'Okta', category: 'Security', regex: /\bokta\b/i },
  { tool: 'CrowdStrike', category: 'Security', regex: /\bcrowdstrike\b/i },
  { tool: 'Jira', category: 'Collaboration', regex: /\bjira\b/i },
  { tool: 'Linear', category: 'Collaboration', regex: /\blinear\b(?=.*(?:jira|issue|sprint|product|roadmap|tracking))/i },
  { tool: 'Notion', category: 'Collaboration', regex: /\bnotion\b/i },
  { tool: 'Workday', category: 'HR/Finance', regex: /\bworkday\b/i },
  { tool: 'NetSuite', category: 'HR/Finance', regex: /\bnetsuite\b/i },
];

/**
 * Analyze normalized jobs for a single company and compute:
 * - department breakdown
 * - hiringVelocity30d
 * - buyingSignals
 * - detectedTechStack
 */
export function analyzeHiringSignals(jobs, { detectTechStack = true } = {}) {
  const total = jobs.length;
  const nowMs = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const departments = {};
  let hiringVelocity30d = 0;
  let remoteCount = 0;

  let salesRolesCount = 0;
  let revOpsRolesCount = 0;
  let engineeringRolesCount = 0;
  let aiRolesCount = 0;
  let securityRolesCount = 0;
  let executiveRolesCount = 0;

  // Map tool -> { tool, category, mentions, sampleRoles: Set }
  const techCounts = new Map();

  for (const job of jobs) {
    // Department aggregation
    const dept = (job.department || 'General').trim() || 'General';
    departments[dept] = (departments[dept] || 0) + 1;

    // 30-day hiring velocity
    if (job.publishedAt) {
      const pubMs = Date.parse(job.publishedAt);
      if (!Number.isNaN(pubMs) && nowMs - pubMs <= thirtyDaysMs && pubMs <= nowMs + 86400000) {
        hiringVelocity30d += 1;
      }
    }

    // Remote friendly tracking
    if (job.isRemote) {
      remoteCount += 1;
    }

    // Role buying signal flags (check title + department for high precision)
    const roleHeader = `${job.title || ''} ${dept}`;
    if (ROLE_SIGNAL_PATTERNS.sales.test(roleHeader)) salesRolesCount += 1;
    if (ROLE_SIGNAL_PATTERNS.revOps.test(roleHeader)) revOpsRolesCount += 1;
    if (ROLE_SIGNAL_PATTERNS.engineering.test(roleHeader)) engineeringRolesCount += 1;
    if (ROLE_SIGNAL_PATTERNS.ai.test(roleHeader)) aiRolesCount += 1;
    if (ROLE_SIGNAL_PATTERNS.security.test(roleHeader)) securityRolesCount += 1;
    if (ROLE_SIGNAL_PATTERNS.executive.test(roleHeader)) executiveRolesCount += 1;

    // Tech stack detection across title + descriptionText
    if (detectTechStack) {
      const corpus = `${job.title || ''} ${job.descriptionText || ''}`;
      if (corpus.trim().length > 0) {
        for (const entry of TECH_STACK_DICTIONARY) {
          if (entry.regex.test(corpus)) {
            let record = techCounts.get(entry.tool);
            if (!record) {
              record = {
                tool: entry.tool,
                category: entry.category,
                mentions: 0,
                sampleRoles: new Set(),
              };
              techCounts.set(entry.tool, record);
            }
            record.mentions += 1;
            if (record.sampleRoles.size < 3 && job.title) {
              record.sampleRoles.add(job.title);
            }
          }
        }
      }
    }
  }

  // Sort departments descending by count
  const sortedDepartments = Object.fromEntries(
    Object.entries(departments).sort((a, b) => b[1] - a[1])
  );

  // Sort tech stack descending by mentions
  const detectedTechStack = Array.from(techCounts.values())
    .sort((a, b) => b.mentions - a.mentions)
    .map((item) => ({
      tool: item.tool,
      category: item.category,
      mentions: item.mentions,
      sampleRoles: Array.from(item.sampleRoles),
    }));

  const remoteFriendlyRatio =
    total > 0 ? Math.round((remoteCount / total) * 100) / 100 : 0;

  return {
    hiringVelocity30d,
    departments: sortedDepartments,
    buyingSignals: {
      isHiringSales: salesRolesCount > 0,
      salesRolesCount,
      isHiringRevOps: revOpsRolesCount > 0,
      revOpsRolesCount,
      isHiringEngineering: engineeringRolesCount > 0,
      engineeringRolesCount,
      isHiringAI: aiRolesCount > 0,
      aiRolesCount,
      isHiringSecurity: securityRolesCount > 0,
      securityRolesCount,
      isHiringExecutive: executiveRolesCount > 0,
      executiveRolesCount,
      remoteFriendlyRatio,
      hiringVelocity30d,
    },
    detectedTechStack,
  };
}
