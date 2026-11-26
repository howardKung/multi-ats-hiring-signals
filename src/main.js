/**
 * Apify Actor Entrypoint — Multi-ATS Career & GTM Buying Signals Normalizer.
 *
 * Implements strict Pay-Per-Event (PPE) Zero-Charge Protection:
 * - Only charges `company-signal-extracted` when openRolesCount > 0.
 * - Never charges for `not_found` or 0-job companies.
 * - Respects user budget caps via `chargeResult.eventChargeLimitReached`.
 */

import { Actor, log } from 'apify';
import { extractCompanySignals } from './normalizer.js';

const CHARGE_EVENT_NAME = 'company-signal-extracted';

await Actor.init();

try {
  const input = (await Actor.getInput()) || {};
  const {
    companies = [],
    includeJobsList = true,
    maxJobsPerCompany = 50,
    detectTechStack = true,
    discoverFromWebsite = true,
    concurrency = 5,
  } = input;

  if (!Array.isArray(companies) || companies.length === 0) {
    log.warning('No companies provided in input.companies. Exiting cleanly.');
    await Actor.exit();
  }

  // Deduplicate & sanitize company inputs
  const uniqueCompanies = Array.from(
    new Set(
      companies
        .map((c) => (typeof c === 'string' ? c.trim() : ''))
        .filter(Boolean)
    )
  );

  const workerCount = Math.max(1, Math.min(20, Number(concurrency) || 5));
  log.info(`Starting Multi-ATS signal extraction for ${uniqueCompanies.length} companies (concurrency=${workerCount}).`);

  let nextIndex = 0;
  let limitReached = false;
  let successCount = 0;
  let notFoundCount = 0;
  let chargedCount = 0;

  async function worker() {
    while (true) {
      if (limitReached) return;
      const currentIdx = nextIndex++;
      if (currentIdx >= uniqueCompanies.length) return;

      const company = uniqueCompanies[currentIdx];
      try {
        const result = await extractCompanySignals(company, {
          includeJobsList: Boolean(includeJobsList),
          maxJobsPerCompany: Math.max(1, Math.min(2000, Number(maxJobsPerCompany) || 50)),
          detectTechStack: Boolean(detectTechStack),
          discoverFromWebsite: Boolean(discoverFromWebsite),
        });

        if (limitReached) return;

        // Zero-Charge Protection: ONLY charge when at least 1 valid open role is extracted
        if (result.status === 'ok' && result.openRolesCount > 0) {
          const chargeResult = await Actor.charge({
            eventName: CHARGE_EVENT_NAME,
            count: 1,
          });

          result.charged = true;
          chargedCount += 1;
          successCount += 1;

          await Actor.pushData(result);

          log.info(
            `[OK] ${company} -> ${result.atsProvider} (${result.openRolesCount} roles, 30d=${result.hiringVelocity30d}, stack=${result.detectedTechStack.length}) [CHARGED]`
          );

          if (chargeResult?.eventChargeLimitReached) {
            limitReached = true;
            log.warning(
              'User max pay-per-event charge limit reached. Stopping gracefully.'
            );
            return;
          }
        } else {
          // 0-charge output for transparency
          result.charged = false;
          notFoundCount += 1;

          await Actor.pushData(result);
          log.info(`[NOT_FOUND] ${company} -> 0 open roles found [0 CHARGE]`);
        }
      } catch (err) {
        log.error(`Failed processing "${company}": ${err.message}`);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(workerCount, uniqueCompanies.length) },
    () => worker()
  );
  await Promise.all(workers);

  log.info(
    `Completed! Processed=${successCount + notFoundCount}/${uniqueCompanies.length} | Found=${successCount} | NotFound(0-Charge)=${notFoundCount} | ChargedEvents=${chargedCount} | BudgetLimitReached=${limitReached}`
  );
} finally {
  await Actor.exit();
}
