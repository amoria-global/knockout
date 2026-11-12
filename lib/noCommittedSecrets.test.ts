import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * No secret may be committed to this repository.
 *
 * Why this exists: on 2026-11-08 a Google Maps API key was committed to the sibling mobile repository (which is public)
 * and reported by GitGuardian. The key answered Geocoding and Places for anyone, so it had to be revoked, not just
 * deleted from the code. Server keys belong in server configuration and `.env*` files that are not tracked. This test
 * fails the build before a credential-shaped string reaches `main`, and it runs on every test run.
 *
 * It scans every tracked text file. The allowlist is for files that must contain a value that looks like a key; add to it
 * only with a written reason. GitHub secret scanning and push protection should also be on (Settings, Code security).
 */
const ROOT = path.join(__dirname, '..');

const ALLOWLIST: Record<string, string> = {};

const RULES: { name: string; pattern: RegExp }[] = [
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'private key block', pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { name: 'service-account private key', pattern: /"private_key"\s*:\s*"-----BEGIN/ },
  { name: 'GitHub token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/ },
  { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'Stripe live key', pattern: /\b[sr]k_live_[0-9A-Za-z]{20,}/ },
  { name: 'Sentry auth token', pattern: /\bsntry[su]_[A-Za-z0-9+/=_-]{40,}/ },
  { name: 'Sentry auth token assignment', pattern: /SENTRY_AUTH_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9]{32,}/ },
];

function trackedFiles(): string[] {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\0').filter(Boolean);
  } catch {
    return []; // not a git checkout (an unpacked archive): nothing to enumerate
  }
}

function readText(rel: string): string | null {
  const full = path.join(ROOT, rel);
  try {
    const stat = fs.statSync(full);
    if (!stat.isFile() || stat.size > 2_000_000) return null;
    const buf = fs.readFileSync(full);
    return buf.includes(0) ? null : buf.toString('utf8'); // skip binaries
  } catch {
    return null;
  }
}

describe('no committed secrets', () => {
  const files = trackedFiles().filter((f) => !/(^|\/)(yarn\.lock|package-lock\.json)$/.test(f));

  it('finds no credential-shaped string in any tracked file (outside the documented allowlist)', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      if (ALLOWLIST[rel]) continue;
      const text = readText(rel);
      if (text === null) continue;
      for (const rule of RULES) {
        if (rule.pattern.test(text)) offenders.push(`${rel}: ${rule.name}`);
      }
    }
    // Names the file and the kind of secret, never the value.
    expect(offenders).toEqual([]);
  });

  it('recognises each kind of secret it is meant to catch', () => {
    const samples: Record<string, string> = {
      'Google API key': 'AIza' + 'A'.repeat(35),
      'private key block': '-----BEGIN ' + 'PRIVATE KEY-----',
      'GitHub token': 'ghp_' + 'a'.repeat(36),
      'AWS access key id': 'AKIA' + 'A'.repeat(16),
      'Slack token': 'xoxb-' + '1'.repeat(12),
      'Stripe live key': 'sk_live_' + 'a'.repeat(24),
      'Sentry auth token assignment': 'SENTRY_AUTH_TOKEN=' + 'a'.repeat(40),
    };
    for (const [name, sample] of Object.entries(samples)) {
      const rule = RULES.find((r) => r.name === name)!;
      expect(rule.pattern.test(sample)).toBe(true);
    }
  });
});
