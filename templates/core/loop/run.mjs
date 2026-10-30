#!/usr/bin/env node
/*
 * Bounded autonomous loop: hands one goal to a coding agent CLI, verifies with the goal's own commands,
 * and repeats until every check passes or a limit is hit (Node built-in modules only)
 *
 *   node .loop/run.mjs --goal .loop/active-goal.json [--agent claude|codex|...] [--reset]
 *   node .loop/run.mjs --goal .loop/active-goal.json --verify-only
 *   node .loop/run.mjs --validate .loop/active-goal.json
 *
 * The agent never decides completion. The runner never commits, pushes, deletes, or publishes.
 * Adapter: LOOP_AGENT_ADAPTER, else adapters[--agent | LOOP_AGENT | config.agent] from
 * .loop/config.local.json (uncommitted) or .loop/config.json. It is called as
 *   <adapter> <prompt-file> <response-file> <workspace-root>
 * and returns 0 when the agent run itself finished. A response containing NEEDS_HUMAN stops the loop.
 *
 * Evidence: .loop/runtime/<goal-id>/ (state.json, attempts.jsonl, prompt-N.md, agent-N.md,
 * verification-N.json, final-report.md). Keep .loop/runtime/ out of git.
 * Exit codes: 0 complete, 1 invalid or verification failed, 2 budget exhausted, 3 blocked, 4 needs human
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const GATES = ['full-render', 'delete', 'commit', 'push', 'merge', 'publish', 'external-write', 'dependency-add'];

const args = process.argv.slice(2);
const after = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const root = resolve(process.env.LOOP_WORKSPACE_ROOT ?? process.cwd());
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const fail = (message, code = 1) => {
  console.error(message);
  process.exit(code);
};

const validateGoal = (goal) => {
  const errors = [];
  const strings = (value, min = 1) => Array.isArray(value) && value.every((v) => typeof v === 'string' && v.length >= min);
  if (!goal || typeof goal !== 'object' || Array.isArray(goal)) return ['goal must be an object'];
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(goal.id ?? '')) errors.push('id: 3-64 lowercase letters, digits, or hyphens');
  if (typeof goal.objective !== 'string' || goal.objective.length < 10) errors.push('objective: at least 10 characters');
  if (!strings(goal.acceptance, 3) || goal.acceptance.length === 0) errors.push('acceptance: a non-empty list of criteria');
  if (!Array.isArray(goal.verification) || goal.verification.length === 0) errors.push('verification: at least one command');
  (goal.verification ?? []).forEach((v, i) => {
    if (!v?.name || !v?.command) errors.push(`verification[${i}]: name and command are required`);
    if (v?.timeoutSeconds !== undefined && !(Number.isInteger(v.timeoutSeconds) && v.timeoutSeconds >= 1 && v.timeoutSeconds <= 1800)) errors.push(`verification[${i}].timeoutSeconds: 1-1800`);
  });
  const l = goal.limits ?? {};
  if (!(Number.isInteger(l.maxAttempts) && l.maxAttempts >= 1 && l.maxAttempts <= 50)) errors.push('limits.maxAttempts: 1-50');
  if (!(Number.isInteger(l.maxMinutes) && l.maxMinutes >= 1 && l.maxMinutes <= 1440)) errors.push('limits.maxMinutes: 1-1440');
  if (!(Number.isInteger(l.maxConsecutiveNoProgress) && l.maxConsecutiveNoProgress >= 1 && l.maxConsecutiveNoProgress <= 10)) errors.push('limits.maxConsecutiveNoProgress: 1-10');
  if (!Array.isArray(goal.humanGates) || goal.humanGates.some((g) => !GATES.includes(g))) errors.push(`humanGates: a list of ${GATES.join(', ')}`);
  for (const key of ['allowedPaths', 'forbiddenActions']) if (goal[key] !== undefined && !strings(goal[key])) errors.push(`${key}: a list of strings`);
  return errors;
};

if (args.includes('--validate')) {
  const errors = validateGoal(readJson(resolve(root, after('--validate'))));
  if (errors.length) fail(`Invalid goal:\n- ${errors.join('\n- ')}`);
  console.log('Goal is valid');
  process.exit(0);
}

const configFile = [join(root, '.loop/config.local.json'), join(root, '.loop/config.json')].find(existsSync);
const config = configFile ? readJson(configFile) : {};
const goalFile = resolve(root, after('--goal') ?? config.goal ?? '.loop/active-goal.json');
if (!existsSync(goalFile)) fail(`Goal file not found: ${goalFile}. Copy .loop/goal.example.json and edit it.`);
const goal = readJson(goalFile);
const errors = validateGoal(goal);
if (errors.length) fail(`Invalid goal:\n- ${errors.join('\n- ')}`);

const runtime = join(root, '.loop/runtime', goal.id);
mkdirSync(runtime, { recursive: true });
if (args.includes('--reset')) readdirSync(runtime).forEach((f) => rmSync(join(runtime, f), { recursive: true, force: true }));
const stateFile = join(runtime, 'state.json');
const now = () => new Date().toISOString();
let state = existsSync(stateFile) ? readJson(stateFile) : { goalId: goal.id, status: 'running', startedAt: now(), attempts: 0, consecutiveNoProgress: 0, lastFingerprint: null, lastVerification: null };
const save = () => writeJson(stateFile, { ...state, updatedAt: now() });
const ledger = (entry) => appendFileSync(join(runtime, 'attempts.jsonl'), `${JSON.stringify({ at: now(), ...entry })}\n`);
const minutes = () => (Date.now() - Date.parse(state.startedAt)) / 60000;
const passed = (results) => results.every((r) => r.exitCode === 0 && !r.error);

// Each check runs in a shell from the workspace root; output is kept short for the prompt and the report
const verify = (label) => {
  const results = goal.verification.map((check) => {
    const r = spawnSync(check.command, { cwd: root, shell: process.env.LOOP_SHELL || true, encoding: 'utf8', timeout: (check.timeoutSeconds ?? 120) * 1000, maxBuffer: 8 * 1024 * 1024 });
    return { name: check.name, command: check.command, exitCode: r.status ?? 1, signal: r.signal ?? null, stdout: (r.stdout ?? '').slice(-8000), stderr: (r.stderr ?? '').slice(-8000), error: r.error?.message ?? null };
  });
  writeJson(join(runtime, `verification-${label}.json`), results);
  // Same output as last time means the agent made no measurable progress
  const fingerprint = createHash('sha256').update(JSON.stringify(results.map(({ name, exitCode, stdout, stderr, error }) => ({ name, exitCode, stdout, stderr, error })))).digest('hex');
  state.consecutiveNoProgress = fingerprint === state.lastFingerprint ? state.consecutiveNoProgress + 1 : 0;
  state.lastFingerprint = fingerprint;
  state.lastVerification = results;
  save();
  results.forEach((r) => console.log(`${r.exitCode === 0 && !r.error ? 'PASS' : 'FAIL'} ${r.name}`));
  return results;
};

const finish = (status, reason, code) => {
  Object.assign(state, { status, reason });
  save();
  ledger({ type: 'terminal', status, reason, attempts: state.attempts });
  const checks = state.lastVerification ?? [];
  writeFileSync(join(runtime, 'final-report.md'), [
    `# Loop report: ${goal.id}`, '',
    `- Status: ${status} (${reason})`, `- Objective: ${goal.objective}`,
    `- Attempts: ${state.attempts}/${goal.limits.maxAttempts}`, `- Minutes: ${minutes().toFixed(1)}`,
    `- Human gates: ${goal.humanGates.join(', ') || 'none'}`, '',
    '## Acceptance criteria', '', ...goal.acceptance.map((a) => `- ${a}`), '',
    '## Latest verification', '',
    ...checks.flatMap((c) => [`### ${c.name}: ${c.exitCode === 0 && !c.error ? 'PASS' : 'FAIL'}`, '', `\`${c.command}\``, '', ...(c.exitCode === 0 ? [] : ['```text', `${c.stdout}${c.stderr}${c.error ?? ''}`.trim(), '```', ''])]),
  ].join('\n'));
  console.log(`${status}: ${reason}\nEvidence: ${join(runtime, 'final-report.md')}`);
  process.exit(code);
};

if (args.includes('--verify-only')) {
  const results = verify('manual');
  finish(passed(results) ? 'complete' : 'verification_failed', passed(results) ? 'All checks passed without an agent run' : 'Some checks failed', passed(results) ? 0 : 1);
}
if (['complete', 'needs_human'].includes(state.status)) fail(`Goal is already ${state.status}. Use --reset to start again.`);
state.status = 'running';

if (passed(verify('initial'))) finish('complete', 'The goal was already satisfied', 0);

const agent = after('--agent') ?? process.env.LOOP_AGENT ?? config.agent;
const adapterSetting = process.env.LOOP_AGENT_ADAPTER ?? config.adapters?.[agent];
if (!adapterSetting) fail(`No adapter. Use --agent (${Object.keys(config.adapters ?? {}).join(', ') || 'none configured'}), LOOP_AGENT, or LOOP_AGENT_ADAPTER.`);
const adapter = resolve(root, adapterSetting);
if (!existsSync(adapter)) fail(`Adapter not found: ${adapter}`);

const gitStatus = () => {
  const r = spawnSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() || '(clean)' : '(not a git repository)';
};
const section = (title, lines) => (lines?.length ? [`## ${title}`, ...lines.map((l) => `- ${l}`), ''] : []);

for (;;) {
  if (state.attempts >= goal.limits.maxAttempts) finish('budget_exhausted', 'Attempt limit reached', 2);
  if (minutes() >= goal.limits.maxMinutes) finish('budget_exhausted', 'Time limit reached', 2);
  if (state.consecutiveNoProgress >= goal.limits.maxConsecutiveNoProgress) finish('blocked', 'Verification output repeated without progress', 3);

  const n = state.attempts + 1;
  const failing = state.lastVerification.filter((c) => c.exitCode !== 0 || c.error)
    .map((c) => `### ${c.name}\nCommand: ${c.command}\nExit: ${c.exitCode}\n\`\`\`text\n${`${c.stdout}\n${c.stderr}\n${c.error ?? ''}`.trim().slice(-4000)}\n\`\`\``);
  const prompt = [
    '# Goal', '', goal.objective, '',
    ...section('Acceptance criteria (all required)', goal.acceptance),
    ...section('Work only inside these paths', goal.allowedPaths ?? ['the repository']),
    ...section('Never do', goal.forbiddenActions),
    ...section('Stop before these and answer with NEEDS_HUMAN and the reason', goal.humanGates),
    '## Rules', '- Read AGENTS.md and the loop policy (.loop/POLICY.md) before changing files',
    '- Keep every existing change in the working tree; they may be the user\'s work',
    '- Run the verification commands yourself after making progress, and report what you changed and the evidence', '',
    `## Attempt ${n} of ${goal.limits.maxAttempts}`, '',
    '## Working tree before this attempt', '```text', gitStatus(), '```', '',
    '## Failing checks', '', ...failing, '',
  ].join('\n');
  const promptFile = join(runtime, `prompt-${n}.md`);
  const responseFile = join(runtime, `agent-${n}.md`);
  writeFileSync(promptFile, prompt);

  console.log(`Attempt ${n}/${goal.limits.maxAttempts}`);
  const remaining = Math.max(1, goal.limits.maxMinutes - minutes());
  const r = spawnSync(adapter, [promptFile, responseFile, root], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], timeout: remaining * 60000, env: { ...process.env, LOOP_GOAL_ID: goal.id, LOOP_ATTEMPT: String(n) } });
  state.attempts = n;
  ledger({ type: 'agent', attempt: n, exitCode: r.status, signal: r.signal, error: r.error?.message ?? null });
  save();

  const response = existsSync(responseFile) ? readFileSync(responseFile, 'utf8') : '';
  if (/\bNEEDS_HUMAN\b/.test(response)) finish('needs_human', response.trim().slice(0, 2000), 4);
  if (r.status !== 0 || r.error) finish('blocked', `Adapter failed: ${r.error?.message ?? `exit ${r.status}`}`, 3);

  const results = verify(n);
  ledger({ type: 'verification', attempt: n, passed: passed(results) });
  if (passed(results)) finish('complete', 'All verification commands passed', 0);
}
