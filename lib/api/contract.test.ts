import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from './config';

/**
 * CONN-TEST-4: every backend route this app knows about must exist.
 *
 * contract/api-contract.json is generated from the backend's controllers by
 * ApiContractTest in amoria-connect and copied here by its
 * scripts/sync-api-contract.sh. It lists every route the backend accepts.
 *
 * API_ENDPOINTS is imported for real rather than parsed, so function entries
 * produce the exact paths the app requests.
 */

type Route = { method: string; path: string };
const ROOT = path.resolve(__dirname, '../..');
const CONTRACT = path.join(ROOT, 'contract/api-contract.json');
const routes: Route[] = JSON.parse(readFileSync(CONTRACT, 'utf8')).routes;

/** A contract template such as /x/{eventId}/y matches one concrete segment per variable. */
const templates = routes.map((r) => ({
    ...r,
    regex: new RegExp(
        '^' + r.path.split(/\{[^}]*\}/).map((s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&')).join('[^/]+') + '$',
    ),
}));
const inContract = (url: string) => {
    const bare = url.split('?')[0];
    return templates.some((t) => t.regex.test(bare));
};

/** Every endpoint as [ 'GROUP.KEY', '/api/...' ], calling functions with sample arguments. */
function endpoints(node: unknown, prefix = ''): [string, string][] {
    if (typeof node === 'string') return [[prefix, node]];
    if (typeof node === 'function') {
        const args = Array.from({ length: node.length }, (_, i) => `sample${i}`);
        return [[prefix, String((node as (...a: string[]) => string)(...args))]];
    }
    if (node && typeof node === 'object') {
        return Object.entries(node).flatMap(([k, v]) => endpoints(v, prefix ? `${prefix}.${k}` : k));
    }
    return [];
}

const all = endpoints(API_ENDPOINTS).filter(([, url]) => url.startsWith('/api/'));

/**
 * Entries that point at routes the backend does not have, verified one by one
 * on 2026-09-15. Listed rather than deleted, because removing app code is not
 * this test's job; the assertions below stop the list from rotting and stop
 * any of these from quietly becoming a live call.
 *
 * Maps each entry to the ONLY files allowed to mention it.
 */
const KNOWN_STALE: Record<string, string[]> = {
    // A whole profile-editing block that never matched the backend, which names
    // these add-equipment, update-equipment/{id} and so on, all POST. Nothing
    // in the app references any of them.
    'PHOTOGRAPHER.ADD_EQUIPMENT': [],
    'PHOTOGRAPHER.UPDATE_EQUIPMENT': [],
    'PHOTOGRAPHER.DELETE_EQUIPMENT': [],
    'PHOTOGRAPHER.ADD_SKILL': [],
    'PHOTOGRAPHER.UPDATE_SKILL': [],
    'PHOTOGRAPHER.DELETE_SKILL': [],
    'PHOTOGRAPHER.ADD_AVAILABILITY': [],
    'PHOTOGRAPHER.UPDATE_AVAILABILITY': [],
    'PHOTOGRAPHER.DELETE_AVAILABILITY': [],
    'PHOTOGRAPHER.ADD_EDUCATION': [],
    'PHOTOGRAPHER.UPDATE_EDUCATION': [],
    'PHOTOGRAPHER.DELETE_EDUCATION': [],
    'PHOTOGRAPHER.ADD_CERTIFICATION': [],
    'PHOTOGRAPHER.UPDATE_CERTIFICATION': [],
    'PHOTOGRAPHER.ADD_PROJECT': [],
    'PHOTOGRAPHER.UPDATE_PROJECT': [],
    'PHOTOGRAPHER.DELETE_PROJECT': [],

    // Wrapped by functions nothing calls. Production answers 404 Not Found for
    // all three (checked with GET: a real POST-only route answers 405). Pinned
    // by "stale wrappers stay uncalled" below.
    'PUBLIC.ANONYMOUS_VIEWER_CHAT': ['lib/APIs/streams/anonymous-viewer.ts'],
    'PUBLIC.ANONYMOUS_VIEWER_RATE': ['lib/APIs/streams/anonymous-viewer.ts'],
    'PUBLIC.STREAM_GROUP_CODE_STATUS': ['lib/APIs/streams/route.ts'],

    // LIVE DEFECT, see the it.fails test below. Called by sendAnonymousVideoChat
    // from the live-stream page.
    'PUBLIC.ANONYMOUS_VIEWER_CHAT_VIDEO': ['lib/APIs/streams/anonymous-viewer.ts'],
};

describe('backend contract', () => {
    it('has routes to check against', () => {
        expect(routes.length).toBeGreaterThan(100);
        expect(all.length).toBeGreaterThan(50);
    });

    it('every endpoint the app knows exists on the backend', () => {
        const missing = all.filter(([key, url]) => !inContract(url) && !(key in KNOWN_STALE));
        expect(
            missing.map(([key, url]) => `${key} -> ${url}`),
            'these endpoints are not accepted by the backend. A request to them is a guaranteed 404',
        ).toEqual([]);
    });

    it('the known-stale list only holds entries that are still stale', () => {
        const nowValid = Object.keys(KNOWN_STALE).filter((key) => {
            const hit = all.find(([k]) => k === key);
            return !hit || inContract(hit[1]);
        });
        expect(nowValid, 'these now resolve (or no longer exist); remove them from KNOWN_STALE').toEqual([]);
    });

    it('no known-stale endpoint is used anywhere it was not already', () => {
        const files = sourceFiles(path.join(ROOT, 'app')).concat(sourceFiles(path.join(ROOT, 'lib')));
        const offenders: string[] = [];
        for (const [key, allowed] of Object.entries(KNOWN_STALE)) {
            const leaf = key.split('.').pop()!;
            const pattern = new RegExp(`\\.${leaf}\\b`);
            for (const file of files) {
                const rel = path.relative(ROOT, file);
                if (rel === 'lib/api/config.ts' || allowed.includes(rel)) continue;
                if (pattern.test(readFileSync(file, 'utf8'))) offenders.push(`${key} used in ${rel}`);
            }
        }
        expect(offenders, 'a request to a route the backend does not have ships as a 404').toEqual([]);
    });

    it('stale wrappers stay uncalled', () => {
        // The constant-level check above cannot see a new caller of a wrapper
        // that already references a stale constant. These three wrap routes the
        // backend does not have; a call to any of them is a request that 404s.
        const wrappers: Record<string, string> = {
            sendAnonymousChatMessage: 'lib/APIs/streams/anonymous-viewer.ts',
            rateStreamAnonymous: 'lib/APIs/streams/anonymous-viewer.ts',
            getGroupCodeStatus: 'lib/APIs/streams/route.ts',
        };
        const files = sourceFiles(path.join(ROOT, 'app')).concat(sourceFiles(path.join(ROOT, 'lib')));
        const calls: string[] = [];
        for (const [fn, home] of Object.entries(wrappers)) {
            const call = new RegExp(`\\b${fn}\\s*\\(`);
            for (const file of files) {
                const rel = path.relative(ROOT, file);
                if (rel !== home && call.test(readFileSync(file, 'utf8'))) calls.push(`${fn} called in ${rel}`);
            }
        }
        expect(calls).toEqual([]);
    });

    // OPEN DEFECT, expected to fail. it.fails passes while the assertion fails
    // and turns red once it passes, so fixing the bug forces this to be
    // promoted to a normal test.
    //
    // A viewer who is not signed in and records a video message on a live
    // stream goes through sendAnonymousVideoChat, which posts to
    // /public/anonymous-viewer/{eventId}/chat/video. The backend has no such
    // route, production answers 404, and the message always ends as
    // "[Video Message - Failed to send]". The route that exists is
    // POST /api/remote/public/events/{eventId}/chats/video, taking viewerId,
    // deviceFingerprint, video and an optional content: exactly what the app
    // already sends. The fix is the path in API_ENDPOINTS alone.
    it.fails('anonymous video chat posts to a route the backend has', () => {
        const url = API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_CHAT_VIDEO('sample0');
        expect(inContract(url)).toBe(true);
    });

    it.skipIf(!existsSync(path.join(ROOT, '../amoria-connect/src/test/resources/contract/api-contract.json')))(
        'this copy matches the backend checked out next to it',
        () => {
            // Runs on a machine with the monorepo layout; skipped in CI, where the
            // backend is a different repository on a different host.
            const backend = readFileSync(
                path.join(ROOT, '../amoria-connect/src/test/resources/contract/api-contract.json'),
                'utf8',
            );
            expect(readFileSync(CONTRACT, 'utf8') === backend, 'run amoria-connect/scripts/sync-api-contract.sh').toBe(
                true,
            );
        },
    );
});

function sourceFiles(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);
        if (name === 'node_modules' || name.startsWith('.') || name === '_design-sandbox') return [];
        if (statSync(full).isDirectory()) return sourceFiles(full);
        return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
    });
}
