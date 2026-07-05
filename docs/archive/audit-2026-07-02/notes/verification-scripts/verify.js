// Domain data audit verification script
// Node.js machine verification of learningNodes / errorMappings / mvpScope invariants
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const learning = JSON.parse(fs.readFileSync(path.join(dir, 'learningNodes.json'), 'utf8'));
const errors = JSON.parse(fs.readFileSync(path.join(dir, 'errorMappings.json'), 'utf8'));

const allNodes = [...learning.html_nodes, ...learning.css_nodes];
const idRe = /^(html|css)-[0-9]{3}$/;

console.log('=== 1. Node ID inventory & format ===');
console.log('html_nodes:', learning.html_nodes.length, 'css_nodes:', learning.css_nodes.length, 'total:', allNodes.length);
let badIds = [];
for (const n of allNodes) {
  const ok = idRe.test(n.id);
  if (!ok) badIds.push(n.id);
}
console.log('All IDs:', allNodes.map(n => n.id).join(', '));
console.log('IDs violating ^(html|css)-[0-9]{3}$:', badIds.length ? badIds : 'NONE (all conform)');

// duplicate check
const seen = new Set(); const dups = [];
for (const n of allNodes) { if (seen.has(n.id)) dups.push(n.id); seen.add(n.id); }
console.log('Duplicate IDs:', dups.length ? dups : 'NONE');

console.log('\n=== 2. Prerequisites: dangling refs & cycles (full catalog) ===');
const idSet = new Set(allNodes.map(n => n.id));
let dangling = [];
for (const n of allNodes) {
  for (const p of n.prerequisites) {
    if (!idSet.has(p)) dangling.push(`${n.id} -> ${p}`);
  }
}
console.log('Dangling prerequisite refs:', dangling.length ? dangling : 'NONE');

// cycle detection (DFS)
const adj = new Map(allNodes.map(n => [n.id, n.prerequisites]));
const state = new Map(); // 0=unvisited 1=in-stack 2=done
let cycles = [];
function dfs(u, stack) {
  state.set(u, 1); stack.push(u);
  for (const v of (adj.get(u) || [])) {
    if (!adj.has(v)) continue;
    if (state.get(v) === 1) cycles.push([...stack.slice(stack.indexOf(v)), v].join(' -> '));
    else if (!state.get(v)) dfs(v, stack);
  }
  stack.pop(); state.set(u, 2);
}
for (const n of allNodes) if (!state.get(n.id)) dfs(n.id, []);
console.log('Cycles:', cycles.length ? cycles : 'NONE');

console.log('\n=== 2b. MVP scope closure (12 nodes from mvpScope.ts) ===');
const MVP = ['html-000','html-010','html-020','html-021','html-022','html-031','html-040','css-000','css-010','css-011','css-020','css-060'];
console.log('MVP count:', MVP.length, '| HTML:', MVP.filter(i=>i.startsWith('html')).length, '| CSS:', MVP.filter(i=>i.startsWith('css')).length);
const mvpSet = new Set(MVP);
let mvpMissing = MVP.filter(id => !idSet.has(id));
console.log('MVP IDs missing from catalog:', mvpMissing.length ? mvpMissing : 'NONE');
let outside = [];
for (const id of MVP) {
  const n = allNodes.find(x => x.id === id);
  for (const p of n.prerequisites) if (!mvpSet.has(p)) outside.push(`${id} -> ${p}`);
}
console.log('MVP prerequisites escaping the 12-node set:', outside.length ? outside : 'NONE (closed)');
console.log('MVP node prerequisites:');
for (const id of MVP) {
  const n = allNodes.find(x => x.id === id);
  console.log(`  ${id}: [${n.prerequisites.join(', ')}]`);
}

console.log('\n=== 3. Node field structure ===');
const fieldSets = new Set(allNodes.map(n => Object.keys(n).sort().join(',')));
console.log('Distinct field sets:', [...fieldSets]);
console.log('type values:', [...new Set(allNodes.map(n => n.type))]);

console.log('\n=== 4. errorMappings verification ===');
const errRe = /^E_[A-Z0-9]+(_[A-Z0-9]+)+$/;
console.log('Error count:', errors.errors.length);
let badErr = [], srkVals = new Set(), refTotal = 0, refBroken = [];
for (const e of errors.errors) {
  if (!errRe.test(e.id)) badErr.push(e.id);
  srkVals.add(e.srk);
  for (const r of e.nodeRefs) {
    refTotal++;
    if (!idSet.has(r.nodeId)) refBroken.push(`${e.id} -> ${r.nodeId}`);
  }
}
console.log('Error IDs:', errors.errors.map(e => `${e.id} [srk=${e.srk}, refs=${e.nodeRefs.length}]`).join('\n  '));
console.log('IDs violating E_UPPER_SNAKE:', badErr.length ? badErr : 'NONE');
console.log('srk values used:', [...srkVals]);
console.log('nodeRefs total:', refTotal);
console.log('nodeRefs BROKEN (not in learningNodes):', refBroken.length);
refBroken.forEach(x => console.log('  BROKEN:', x));
const refValid = [];
for (const e of errors.errors) for (const r of e.nodeRefs) if (idSet.has(r.nodeId)) refValid.push(`${e.id} -> ${r.nodeId}${mvpSet.has(r.nodeId) ? ' (MVP)' : ' (non-MVP)'}`);
console.log('nodeRefs VALID:', refValid.length);
refValid.forEach(x => console.log('  OK:', x));
