// Pure JS — algoritmo Bellman-Ford + geração de grafos

export const TARGET = 'T';
export const NODE_RADIUS = 26;

// Grafo padrão
export const NODES = {
  A: { x: 120, y: 100 },
  B: { x: 360, y: 60 },
  C: { x: 600, y: 100 },
  D: { x: 80, y: 300 },
  E: { x: 280, y: 280 },
  F: { x: 500, y: 300 },
  T: { x: 700, y: 280 },
  G: { x: 290, y: 460 },
};

export const EDGES_DEF = [
  { u: 'A', v: 'B', w: 4 },
  { u: 'A', v: 'D', w: 2 },
  { u: 'B', v: 'C', w: 3 },
  { u: 'B', v: 'E', w: 5 },
  { u: 'C', v: 'F', w: 2 },
  { u: 'C', v: 'T', w: 6 },
  { u: 'D', v: 'E', w: 1 },
  { u: 'D', v: 'G', w: 7 },
  { u: 'E', v: 'F', w: 3 },
  { u: 'E', v: 'G', w: 4 },
  { u: 'F', v: 'T', w: 2 },
  { u: 'G', v: 'T', w: 8 },
];

export function edgeKey(u, v) {
  return [u, v].sort().join('-');
}

export function buildAdj(nodeKeys, edges) {
  const adj = {};
  for (const v of nodeKeys) adj[v] = [];
  for (const e of edges) {
    adj[e.u].push({ to: e.v, w: e.w });
    adj[e.v].push({ to: e.u, w: e.w });
  }
  return adj;
}

// nodes = { A:{x,y}, B:{x,y}, ... }
export function createInitialState(nodes) {
  const M = {}, succ = {};
  for (const v of Object.keys(nodes)) {
    M[v] = v === TARGET ? 0 : Infinity;
    succ[v] = null;
  }
  return { M, succ };
}

// Passo síncrono — todos os nós atualizam de uma vez
export function bfStepSync(M, succ, edges, nodeKeys) {
  const adj = buildAdj(nodeKeys, edges);
  const newM = { ...M }, newSucc = { ...succ };
  const changed = new Set();

  for (const v of nodeKeys) {
    if (v === TARGET) continue;
    let best = M[v], bestS = succ[v];
    for (const { to: w, w: cost } of adj[v]) {
      if (M[w] === Infinity) continue;
      const candidate = M[w] + cost;
      if (candidate < best) { best = candidate; bestS = w; }
    }
    if (best < M[v]) { newM[v] = best; newSucc[v] = bestS; changed.add(v); }
  }

  return { M: newM, succ: newSucc, changed };
}

// Passo assíncrono — um nó por vez, ordem aleatória por rodada
export function bfStepAsync(M, succ, edges, queue, nodeKeys) {
  const adj = buildAdj(nodeKeys, edges);
  let newQueue = [...queue];
  let isNewIter = false;

  if (newQueue.length === 0) {
    newQueue = nodeKeys.filter(v => v !== TARGET).sort(() => Math.random() - 0.5);
    isNewIter = true;
  }

  const node = newQueue.shift();
  const newM = { ...M }, newSucc = { ...succ };
  const changed = new Set();

  let best = newM[node], bestS = newSucc[node];
  for (const { to: w, w: cost } of adj[node]) {
    if (newM[w] === Infinity) continue;
    const candidate = newM[w] + cost;
    if (candidate < best) { best = candidate; bestS = w; }
  }
  if (best < newM[node]) { newM[node] = best; newSucc[node] = bestS; changed.add(node); }

  let converged = false;
  if (newQueue.length === 0) {
    let stable = true;
    outer: for (const v2 of nodeKeys) {
      if (v2 === TARGET) continue;
      for (const { to: w, w: cost } of adj[v2]) {
        if (newM[w] !== Infinity && newM[w] + cost < newM[v2]) {
          stable = false; break outer;
        }
      }
    }
    converged = stable;
  }

  return { M: newM, succ: newSucc, changed, queue: newQueue, isNewIter, node, converged };
}

export function tracePath(succ, start, target) {
  const path = [];
  let v = start;
  const seen = new Set();
  while (v && v !== target && !seen.has(v)) {
    path.push(v); seen.add(v); v = succ[v];
  }
  if (v === target) path.push(target);
  else return [];
  return path;
}

// Gera um grafo aleatório conexo com T como destino
export function generateRandomGraph() {
  const count = 5 + Math.floor(Math.random() * 3); // 5–7 nós não-T
  // Letras sem T
  const available = 'ABCDEFGHIJKLMNOPQRSUVWXYZ'.split('');
  const nonT = available.slice(0, count);
  const allNames = [...nonT, 'T'];

  // T sempre à direita, centro vertical
  const newNodes = { T: { x: 670, y: 290 } };
  const minDist = 115;
  const marginX = 85, marginY = 85;

  for (const name of nonT) {
    let pos, tries = 0;
    do {
      pos = {
        x: marginX + Math.random() * (730 - 2 * marginX), // não sobrepõe T
        y: marginY + Math.random() * (560 - 2 * marginY),
      };
      tries++;
    } while (
      tries < 300 &&
      Object.values(newNodes).some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < minDist)
    );
    newNodes[name] = pos;
  }

  // Spanning tree para garantir que todo nó alcança T
  const connected = new Set(['T']);
  const remaining = [...nonT];
  const newEdges = [];

  while (remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    const u = remaining.splice(idx, 1)[0];
    const connArr = [...connected];
    const v = connArr[Math.floor(Math.random() * connArr.length)];
    newEdges.push({ u, v, w: 1 + Math.floor(Math.random() * 9) });
    connected.add(u);
  }

  // Arestas extras (~60% a mais) para criar caminhos alternativos
  const extras = Math.floor(count * 0.6);
  for (let attempt = 0; attempt < extras * 6 && newEdges.length < count + extras; attempt++) {
    const u = allNames[Math.floor(Math.random() * allNames.length)];
    const v = allNames[Math.floor(Math.random() * allNames.length)];
    if (u !== v && !newEdges.some(e =>
      (e.u === u && e.v === v) || (e.u === v && e.v === u)
    )) {
      newEdges.push({ u, v, w: 1 + Math.floor(Math.random() * 9) });
    }
  }

  return { nodes: newNodes, edges: newEdges };
}
