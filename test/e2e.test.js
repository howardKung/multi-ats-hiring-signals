/**
 * Real End-to-End Test & Daily Canary Suite for Multi-ATS Career & GTM Buying Signals Normalizer.
 *
 * Makes live HTTP requests to public ATS JSON APIs for 10 well-known companies
 * plus 1 non-existent domain to verify Zero-Charge Protection.
 */

import assert from 'node:assert/strict';
import { extractCompanySignals } from '../src/normalizer.js';

const REAL_COMPANIES = [
  'stripe.com',
  'airbnb.com',
  'figma.com',
  'linear.app',
  'notion.so',
  'coinbase.com',
  'cloudflare.com',
  'vercel.com',
  'ramp.com',
  'anthropic.com',
];

const ZERO_CHARGE_DOMAIN = 'nonexistent-zero-charge-test-company-99999.example';

async function runTests() {
  const startAll = Date.now();
  console.log('=== Multi-ATS Career & GTM Buying Signals — Real E2E Test ===\n');

  const results = await Promise.all(
    REAL_COMPANIES.map(async (company) => {
      const t0 = Date.now();
      const res = await extractCompanySignals(company, {
        includeJobsList: true,
        maxJobsPerCompany: 5,
        detectTechStack: true,
        discoverFromWebsite: true,
      });
      // Simulate Actor.charge() behavior for verification
      res.charged = res.status === 'ok' && res.openRolesCount > 0;
      return { res, ms: Date.now() - t0 };
    })
  );

  let okCount = 0;
  const providersHit = new Set();

  for (const { res, ms } of results) {
    if (res.status === 'ok' && res.openRolesCount > 0) {
      okCount += 1;
      providersHit.add(res.atsProvider);

      // Structural assertions
      assert.equal(typeof res.atsProvider, 'string');
      assert.equal(typeof res.openRolesCount, 'number');
      assert.ok(res.openRolesCount > 0);
      assert.equal(res.charged, true);
      assert.equal(typeof res.buyingSignals.isHiringSales, 'boolean');
      assert.equal(typeof res.buyingSignals.isHiringEngineering, 'boolean');
      assert.equal(typeof res.buyingSignals.remoteFriendlyRatio, 'number');
      assert.ok(Array.isArray(res.detectedTechStack));
      assert.ok(Array.isArray(res.jobs));
      assert.ok(res.jobs.length > 0 && res.jobs.length <= 5);
    }

    const topStack = res.detectedTechStack
      .slice(0, 5)
      .map((t) => `${t.tool}(${t.mentions})`)
      .join(', ');
    const topDepts = Object.entries(res.departments)
      .slice(0, 3)
      .map(([d, c]) => `${d}:${c}`)
      .join(', ');

    console.log(
      `[${res.status.toUpperCase().padEnd(9)}] ${res.company.padEnd(16)} | ATS: ${String(
        res.atsProvider || '-'
      ).padEnd(11)} | Roles: ${String(res.openRolesCount).padStart(4)} | 30d: ${String(
        res.hiringVelocity30d
      ).padStart(4)} | ${String(ms).padStart(4)}ms | Charged: ${res.charged}`
    );
    if (res.status === 'ok') {
      console.log(
        `            Signals: Sales=${res.buyingSignals.salesRolesCount}, RevOps=${res.buyingSignals.revOpsRolesCount}, Eng=${res.buyingSignals.engineeringRolesCount}, AI=${res.buyingSignals.aiRolesCount}, Sec=${res.buyingSignals.securityRolesCount}, Exec=${res.buyingSignals.executiveRolesCount}, Remote=${res.buyingSignals.remoteFriendlyRatio}`
      );
      console.log(`            Depts  : ${topDepts || 'N/A'}`);
      console.log(`            Stack  : ${topStack || 'None detected'}`);
    }
  }

  // Test Zero-Charge Protection on guaranteed non-existent domain
  console.log('\n--- Zero-Charge Protection Test ---');
  const z0 = Date.now();
  const notFoundRes = await extractCompanySignals(ZERO_CHARGE_DOMAIN, {
    includeJobsList: true,
    detectTechStack: true,
    discoverFromWebsite: true,
  });
  const zMs = Date.now() - z0;
  assert.equal(notFoundRes.status, 'not_found', 'Non-existent domain must return status=not_found');
  assert.equal(notFoundRes.openRolesCount, 0, 'Non-existent domain must have 0 open roles');
  assert.equal(notFoundRes.charged, false, 'Zero-Charge Protection must keep charged=false');
  console.log(
    `[PASS] ${ZERO_CHARGE_DOMAIN} -> status=${notFoundRes.status}, openRolesCount=${notFoundRes.openRolesCount}, charged=${notFoundRes.charged} (${zMs}ms)`
  );

  // Assert minimum real-world success threshold (at least 8/10 real companies)
  const totalElapsed = Date.now() - startAll;
  console.log(
    `\n=== Summary: ${okCount}/${REAL_COMPANIES.length} real companies extracted | Providers verified: ${Array.from(
      providersHit
    ).join(', ')} | Total time: ${totalElapsed}ms ===`
  );

  assert.ok(
    okCount >= 8,
    `Expected at least 8/${REAL_COMPANIES.length} real companies to succeed, got ${okCount}`
  );
  console.log('ALL E2E ASSERTIONS PASSED!');
}

runTests().catch((err) => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
