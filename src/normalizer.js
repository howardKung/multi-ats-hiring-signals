/**
 * Company-level Multi-ATS discovery, extraction, and GTM signal normalization.
 */

import { parseCompanyInput } from './ats/slugs.js';
import {
  PRIMARY_PROVIDERS,
  SECONDARY_PROVIDERS,
  probeProvider,
  discoverAtsFromWebsite,
} from './ats/providers.js';
import { analyzeHiringSignals } from './signals/analyzer.js';

/**
 * Probe a list of { provider, slug } pairs in parallel and return the first
 * result that has at least 1 active job (preferring highest job count if multiple hit).
 */
async function probeBatch(targets, triedKeys) {
  const uniqueTargets = [];
  for (const t of targets) {
    const key = `${t.provider}:${t.slug.toLowerCase()}`;
    if (!triedKeys.has(key)) {
      triedKeys.add(key);
      uniqueTargets.push(t);
    }
  }
  if (uniqueTargets.length === 0) return null;

  const settled = await Promise.all(
    uniqueTargets.map((t) => probeProvider(t.provider, t.slug))
  );

  const validWithJobs = settled
    .filter((res) => res && Array.isArray(res.jobs) && res.jobs.length > 0)
    .sort((a, b) => b.jobs.length - a.jobs.length);

  return validWithJobs[0] || null;
}

/**
 * Resolve a single company input across 8 public ATS JSON APIs + optional /careers fallback.
 */
export async function extractCompanySignals(
  rawCompany,
  {
    includeJobsList = true,
    maxJobsPerCompany = 50,
    detectTechStack = true,
    discoverFromWebsite = true,
  } = {}
) {
  const parsed = parseCompanyInput(rawCompany);
  const triedKeys = new Set();
  let matchedBoard = null;

  // Step 1: Direct ATS URL shortcut
  if (parsed.directAts) {
    matchedBoard = await probeBatch([parsed.directAts], triedKeys);
  }

  // Step 2: Primary ATS providers on primary slug (fastest path, covers ~85% of SaaS/tech)
  if (!matchedBoard && parsed.candidateSlugs.length > 0) {
    const primarySlug = parsed.candidateSlugs[0];
    const primaryTargets = PRIMARY_PROVIDERS.map((provider) => ({
      provider,
      slug: primarySlug,
    }));
    matchedBoard = await probeBatch(primaryTargets, triedKeys);
  }

  // Step 3: Secondary ATS providers on primary slug + alternate slugs on primary providers
  if (!matchedBoard && parsed.candidateSlugs.length > 0) {
    const primarySlug = parsed.candidateSlugs[0];
    const altSlugs = parsed.candidateSlugs.slice(1);
    const step3Targets = [
      ...SECONDARY_PROVIDERS.map((provider) => ({ provider, slug: primarySlug })),
      ...altSlugs.flatMap((slug) =>
        PRIMARY_PROVIDERS.map((provider) => ({ provider, slug }))
      ),
    ];
    matchedBoard = await probeBatch(step3Targets, triedKeys);
  }

  // Step 4: Fallback HTML /careers discovery (catches non-matching ATS slugs like company-inc)
  if (!matchedBoard && discoverFromWebsite && parsed.domain) {
    const discoveredLinks = await discoverAtsFromWebsite(parsed.domain);
    if (discoveredLinks.length > 0) {
      matchedBoard = await probeBatch(discoveredLinks, triedKeys);
    }
  }

  const extractedAt = new Date().toISOString();

  // Zero-Charge Protection: if no active jobs found, return clean not_found record
  if (!matchedBoard || !Array.isArray(matchedBoard.jobs) || matchedBoard.jobs.length === 0) {
    return {
      company: parsed.rawInput,
      domain: parsed.domain,
      atsProvider: null,
      atsSlug: null,
      boardUrl: null,
      status: 'not_found',
      openRolesCount: 0,
      hiringVelocity30d: 0,
      departments: {},
      buyingSignals: {
        isHiringSales: false,
        salesRolesCount: 0,
        isHiringRevOps: false,
        revOpsRolesCount: 0,
        isHiringEngineering: false,
        engineeringRolesCount: 0,
        isHiringAI: false,
        aiRolesCount: 0,
        isHiringSecurity: false,
        securityRolesCount: 0,
        isHiringExecutive: false,
        executiveRolesCount: 0,
        remoteFriendlyRatio: 0,
        hiringVelocity30d: 0,
      },
      detectedTechStack: [],
      ...(includeJobsList ? { jobs: [] } : {}),
      charged: false,
      extractedAt,
    };
  }

  // Compute GTM Buying Signals & Tech Stack across ALL active jobs
  const signals = analyzeHiringSignals(matchedBoard.jobs, { detectTechStack });

  // Strip bulky descriptionText from returned jobs list to keep dataset compact & fast
  const sanitizedJobs = includeJobsList
    ? matchedBoard.jobs.slice(0, maxJobsPerCompany).map(({ descriptionText, ...rest }) => rest)
    : undefined;

  return {
    company: parsed.rawInput,
    domain: parsed.domain,
    atsProvider: matchedBoard.provider,
    atsSlug: matchedBoard.slug,
    boardUrl: matchedBoard.boardUrl,
    status: 'ok',
    openRolesCount: matchedBoard.jobs.length,
    hiringVelocity30d: signals.hiringVelocity30d,
    departments: signals.departments,
    buyingSignals: signals.buyingSignals,
    detectedTechStack: signals.detectedTechStack,
    ...(includeJobsList ? { jobs: sanitizedJobs } : {}),
    charged: false, // Updated by Actor entrypoint only when Actor.charge() is invoked
    extractedAt,
  };
}
