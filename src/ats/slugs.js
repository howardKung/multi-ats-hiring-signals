/**
 * Smart slug derivation and direct ATS URL / HTML discovery utilities.
 */

const ATS_URL_PATTERNS = [
  {
    provider: 'greenhouse',
    regex: /https?:\/\/(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'greenhouse',
    regex: /https?:\/\/boards-api\.greenhouse\.io\/v1\/boards\/([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'lever',
    regex: /https?:\/\/jobs(?:\.eu)?\.lever\.co\/([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'lever',
    regex: /https?:\/\/api\.lever\.co\/v0\/postings\/([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'ashby',
    regex: /https?:\/\/jobs\.ashbyhq\.com\/([a-zA-Z0-9_.-]+)/gi,
  },
  {
    provider: 'ashby',
    regex: /https?:\/\/api\.ashbyhq\.com\/posting-api\/job-board\/([a-zA-Z0-9_.-]+)/gi,
  },
  {
    provider: 'smartrecruiters',
    regex: /https?:\/\/careers\.smartrecruiters\.com\/([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'smartrecruiters',
    regex: /https?:\/\/api\.smartrecruiters\.com\/v1\/companies\/([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'workable',
    regex: /https?:\/\/apply\.workable\.com\/(?:api\/v1\/widget\/accounts\/)?([a-zA-Z0-9_-]+)/gi,
  },
  {
    provider: 'recruitee',
    regex: /https?:\/\/([a-zA-Z0-9_-]+)\.recruitee\.com/gi,
  },
  {
    provider: 'breezy',
    regex: /https?:\/\/([a-zA-Z0-9_-]+)\.breezy\.hr/gi,
  },
  {
    provider: 'pinpoint',
    regex: /https?:\/\/([a-zA-Z0-9_-]+)\.pinpointhq\.com/gi,
  },
];

const IGNORED_SLUGS = new Set([
  'embed', 'api', 'v0', 'v1', 'jobs', 'careers', 'widget', 'accounts', 'boards',
  'postings', 'offers', 'js', 'css', 'assets', 'static', 'www', 'app', 'help',
]);

/**
 * Check if the input string is already a direct ATS URL.
 * Returns { provider, slug } or null.
 */
export function parseDirectAtsUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  for (const { provider, regex } of ATS_URL_PATTERNS) {
    regex.lastIndex = 0;
    const match = regex.exec(trimmed);
    if (match && match[1]) {
      const slug = match[1].replace(/\/$/, '');
      if (slug && !IGNORED_SLUGS.has(slug.toLowerCase())) {
        return { provider, slug };
      }
    }
  }
  return null;
}

/**
 * Extract clean domain and candidate slugs from a user input
 * (e.g., "stripe.com", "https://www.linear.app/careers", "airbnb").
 */
export function parseCompanyInput(rawInput) {
  const input = String(rawInput || '').trim();
  const directAts = parseDirectAtsUrl(input);

  let domain = null;
  let baseSlug = '';

  if (directAts) {
    baseSlug = directAts.slug.toLowerCase();
  } else {
    let cleaned = input
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .trim()
      .toLowerCase();

    if (cleaned.includes('.')) {
      domain = cleaned;
      // Handle multi-part TLDs like .co.uk, .com.au
      const parts = cleaned.split('.');
      if (parts.length >= 3 && ['co', 'com', 'org', 'net'].includes(parts[parts.length - 2])) {
        baseSlug = parts[parts.length - 3];
      } else {
        baseSlug = parts[0];
      }
    } else {
      baseSlug = cleaned.replace(/[^a-z0-9_-]/g, '');
    }
  }

  const candidateSlugs = deriveCandidateSlugs(baseSlug, directAts?.slug);

  return {
    rawInput: input,
    domain,
    directAts,
    candidateSlugs,
  };
}

/**
 * Generate ordered list of likely ATS board slugs from a base identifier.
 */
export function deriveCandidateSlugs(baseSlug, exactSlug = null) {
  const candidates = new Set();
  if (exactSlug) candidates.add(exactSlug);

  const normalized = (baseSlug || '').toLowerCase().trim();
  if (!normalized) return Array.from(candidates);

  candidates.add(normalized);

  // Strip hyphens / underscores
  const compact = normalized.replace(/[-_]/g, '');
  if (compact && compact !== normalized) {
    candidates.add(compact);
  }

  // Common ATS slug suffixes used by startups (e.g. notionhq, linearhq)
  if (!normalized.endsWith('hq')) {
    candidates.add(`${normalized}hq`);
  }
  if (!normalized.endsWith('inc')) {
    candidates.add(`${normalized}inc`);
  }

  return Array.from(candidates);
}

/**
 * Scan raw HTML (from a company's /careers page or homepage) for embedded ATS board links.
 * Returns deduplicated array of { provider, slug }.
 */
export function extractAtsLinksFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const found = [];
  const seen = new Set();

  for (const { provider, regex } of ATS_URL_PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const slug = (match[1] || '').replace(/\/$/, '');
      if (!slug || IGNORED_SLUGS.has(slug.toLowerCase())) continue;
      const key = `${provider}:${slug.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ provider, slug });
      }
    }
  }
  return found;
}
