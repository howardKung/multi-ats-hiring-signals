/**
 * Public JSON API connectors for 8 major ATS platforms.
 * Pure HTTP fetch (Node 22 native) — zero headless browser overhead.
 */

import { extractAtsLinksFromHtml } from './slugs.js';

const DEFAULT_TIMEOUT_MS = 8000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; MultiATSSignalsBot/1.0; +https://apify.com/store)';

/**
 * Strip HTML tags & decode common entities into clean plain text for signal analysis.
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeIsoDate(value) {
  if (!value) return null;
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function detectRemote(locationStr, workplaceType = '', title = '') {
  const combined = `${locationStr || ''} ${workplaceType || ''} ${title || ''}`.toLowerCase();
  return /\b(remote|work from home|wfh|distributed|anywhere)\b/.test(combined);
}

async function fetchJson(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json') && !contentType.includes('text/plain')) {
      // Some endpoints (e.g. Breezy) may return JSON with text/plain or application/json
      const text = await response.text();
      if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) return null;
      return JSON.parse(text);
    }
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * 1. Greenhouse
 * https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
 */
async function fetchGreenhouse(slug) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.jobs)) return null;

  const jobs = data.jobs.map((job) => {
    const location = job.location?.name || 'Unknown';
    const department =
      job.departments?.[0]?.name ||
      job.metadata?.find((m) => /department|team/i.test(m.name || ''))?.value ||
      'General';
    const title = job.title || '';
    const descriptionText = stripHtml(job.content || '');
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: detectRemote(location, '', title),
      employmentType: null,
      publishedAt: safeIsoDate(job.first_published || job.updated_at),
      url: job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
      compensation: null,
      descriptionText,
    };
  });

  return {
    provider: 'greenhouse',
    slug,
    boardUrl: `https://boards.greenhouse.io/${slug}`,
    jobs,
  };
}

/**
 * 2. Lever
 * https://api.lever.co/v0/postings/{slug}?mode=json
 */
async function fetchLever(slug) {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) return null;

  const jobs = data.map((job) => {
    const location = job.categories?.location || 'Unknown';
    const department = job.categories?.department || job.categories?.team || 'General';
    const workplaceType = job.workplaceType || '';
    const title = job.text || '';
    const descParts = [
      job.descriptionPlain || stripHtml(job.description || ''),
      ...(Array.isArray(job.lists)
        ? job.lists.map((l) => `${l.text || ''} ${stripHtml(l.content || '')}`)
        : []),
      job.additionalPlain || stripHtml(job.additional || ''),
    ];
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: detectRemote(location, workplaceType, title),
      employmentType: job.categories?.commitment || null,
      publishedAt: safeIsoDate(job.createdAt),
      url: job.hostedUrl || `https://jobs.lever.co/${slug}/${job.id}`,
      compensation: job.salaryRange
        ? `${job.salaryRange.currency || ''} ${job.salaryRange.min || ''}-${job.salaryRange.max || ''}`.trim()
        : null,
      descriptionText: descParts.join(' ').trim(),
    };
  });

  return {
    provider: 'lever',
    slug,
    boardUrl: `https://jobs.lever.co/${slug}`,
    jobs,
  };
}

/**
 * 3. Ashby
 * https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true
 */
async function fetchAshby(slug) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.jobs)) return null;

  const jobs = data.jobs.map((job) => {
    const location = job.location || job.address?.postalAddress?.addressLocality || 'Unknown';
    const department = job.department || job.team || 'General';
    const title = job.title || '';
    const descriptionText =
      job.descriptionPlain || stripHtml(job.descriptionHtml || '');
    const compSummary =
      job.compensation?.compensationTierSummary ||
      job.compensation?.scrapeableCompensationSalarySummary ||
      null;
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: Boolean(job.isRemote) || detectRemote(location, job.workplaceType || '', title),
      employmentType: job.employmentType || null,
      publishedAt: safeIsoDate(job.publishedAt || job.updatedAt),
      url: job.jobUrl || `https://jobs.ashbyhq.com/${slug}/${job.id}`,
      compensation: compSummary,
      descriptionText,
    };
  });

  return {
    provider: 'ashby',
    slug,
    boardUrl: `https://jobs.ashbyhq.com/${slug}`,
    jobs,
  };
}

/**
 * 4. SmartRecruiters
 * https://api.smartrecruiters.com/v1/companies/{slug}/postings
 */
async function fetchSmartRecruiters(slug) {
  const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=100`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.content)) return null;

  const jobs = data.content.map((job) => {
    const locParts = [job.location?.city, job.location?.region, job.location?.country].filter(Boolean);
    const location = locParts.join(', ') || (job.location?.remote ? 'Remote' : 'Unknown');
    const department = job.department?.label || job.function?.label || 'General';
    const title = job.name || '';
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: Boolean(job.location?.remote) || detectRemote(location, '', title),
      employmentType: job.typeOfEmployment?.label || null,
      publishedAt: safeIsoDate(job.releasedDate),
      url: `https://jobs.smartrecruiters.com/${slug}/${job.id}`,
      compensation: null,
      descriptionText: `${title} ${department} ${job.industry?.label || ''}`.trim(),
    };
  });

  return {
    provider: 'smartrecruiters',
    slug,
    boardUrl: `https://careers.smartrecruiters.com/${slug}`,
    jobs,
  };
}

/**
 * 5. Workable
 * https://apply.workable.com/api/v1/widget/accounts/{slug}
 */
async function fetchWorkable(slug) {
  const url = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.jobs)) return null;

  const jobs = data.jobs.map((job) => {
    const locParts = [job.city, job.state, job.country].filter(Boolean);
    const location = locParts.join(', ') || (job.telecommuting ? 'Remote' : 'Unknown');
    const department = job.department || 'General';
    const title = job.title || '';
    return {
      id: String(job.shortcode ?? job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: Boolean(job.telecommuting) || detectRemote(location, '', title),
      employmentType: job.employment_type || null,
      publishedAt: safeIsoDate(job.published_on || job.created_at),
      url: job.url || job.shortlink || `https://apply.workable.com/${slug}/j/${job.shortcode}/`,
      compensation: null,
      descriptionText: `${title} ${department} ${stripHtml(job.description || '')}`.trim(),
    };
  });

  return {
    provider: 'workable',
    slug,
    boardUrl: `https://apply.workable.com/${slug}`,
    jobs,
  };
}

/**
 * 6. Recruitee
 * https://{slug}.recruitee.com/api/offers/
 */
async function fetchRecruitee(slug) {
  const url = `https://${encodeURIComponent(slug)}.recruitee.com/api/offers/`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.offers)) return null;

  const jobs = data.offers.map((job) => {
    const location = job.location || [job.city, job.country].filter(Boolean).join(', ') || 'Unknown';
    const department = job.department || 'General';
    const title = job.title || '';
    const descriptionText = stripHtml(`${job.description || ''} ${job.requirements || ''}`);
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: Boolean(job.remote) || detectRemote(location, '', title),
      employmentType: job.employment_type_code || null,
      publishedAt: safeIsoDate(job.published_at || job.created_at),
      url: job.careers_url || `https://${slug}.recruitee.com/o/${job.slug}`,
      compensation: null,
      descriptionText,
    };
  });

  return {
    provider: 'recruitee',
    slug,
    boardUrl: `https://${slug}.recruitee.com/`,
    jobs,
  };
}

/**
 * 7. Breezy HR
 * https://{slug}.breezy.hr/json
 */
async function fetchBreezy(slug) {
  const url = `https://${encodeURIComponent(slug)}.breezy.hr/json`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) return null;

  const jobs = data.map((job) => {
    const location = job.location?.name || 'Unknown';
    const department = job.department || 'General';
    const title = job.name || '';
    return {
      id: String(job.id ?? job.friendly_id ?? ''),
      title,
      department: String(department),
      location,
      isRemote: Boolean(job.location?.is_remote) || detectRemote(location, '', title),
      employmentType: job.type?.name || null,
      publishedAt: safeIsoDate(job.published_date || job.creation_date),
      url: job.url || `https://${slug}.breezy.hr/p/${job.friendly_id}`,
      compensation: job.salary || null,
      descriptionText: `${title} ${department}`.trim(),
    };
  });

  return {
    provider: 'breezy',
    slug,
    boardUrl: `https://${slug}.breezy.hr/`,
    jobs,
  };
}

/**
 * 8. Pinpoint
 * https://{slug}.pinpointhq.com/postings.json
 */
async function fetchPinpoint(slug) {
  const url = `https://${encodeURIComponent(slug)}.pinpointhq.com/postings.json`;
  const data = await fetchJson(url);
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null;
  if (!items) return null;

  const jobs = items.map((job) => {
    const location = job.location?.name || job.location_name || 'Unknown';
    const department = job.job?.department?.name || job.department_name || 'General';
    const title = job.title || '';
    const descriptionText = stripHtml(
      `${job.description || ''} ${job.key_responsibilities || ''} ${job.skills_knowledge_expertise || ''}`
    );
    return {
      id: String(job.id ?? ''),
      title,
      department: String(department),
      location,
      isRemote:
        String(job.workplace_type || '').toLowerCase() === 'remote' ||
        detectRemote(location, job.workplace_type || '', title),
      employmentType: job.employment_type_text || job.employment_type || null,
      publishedAt: safeIsoDate(job.published_at || job.created_at),
      url: job.url || `https://${slug}.pinpointhq.com/en/postings/${job.id}`,
      compensation: job.compensation || null,
      descriptionText,
    };
  });

  return {
    provider: 'pinpoint',
    slug,
    boardUrl: `https://${slug}.pinpointhq.com/`,
    jobs,
  };
}

export const ATS_PROVIDERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  workable: fetchWorkable,
  recruitee: fetchRecruitee,
  breezy: fetchBreezy,
  pinpoint: fetchPinpoint,
};

// Ordered by SaaS/tech market share for fastest parallel probing
export const PRIMARY_PROVIDERS = ['greenhouse', 'ashby', 'lever', 'workable'];
export const SECONDARY_PROVIDERS = ['smartrecruiters', 'recruitee', 'breezy', 'pinpoint'];

/**
 * Fetch a specific provider + slug. Returns result only if jobs array is present.
 */
export async function probeProvider(provider, slug) {
  const fn = ATS_PROVIDERS[provider];
  if (!fn || !slug) return null;
  return await fn(slug);
}

/**
 * Fallback discovery: fetch company's /careers, /jobs, or homepage HTML
 * to extract embedded ATS links (zero headless browser, pure HTTP GET).
 */
export async function discoverAtsFromWebsite(domain) {
  if (!domain) return [];
  const candidateUrls = [
    `https://${domain}/careers`,
    `https://${domain}/jobs`,
    `https://${domain}`,
  ];

  const discovered = [];
  const seen = new Set();

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': USER_AGENT,
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
      });

      // Check if redirect itself landed on a known ATS board
      const finalUrlMatches = extractAtsLinksFromHtml(response.url || '');
      for (const m of finalUrlMatches) {
        const key = `${m.provider}:${m.slug.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          discovered.push(m);
        }
      }

      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('html')) continue;

      const html = await response.text();
      const htmlMatches = extractAtsLinksFromHtml(html);
      for (const m of htmlMatches) {
        const key = `${m.provider}:${m.slug.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          discovered.push(m);
        }
      }

      if (discovered.length > 0) break;
    } catch {
      // Ignore unreachable career paths and try next
    }
  }

  return discovered;
}
