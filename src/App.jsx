import React, { useState, useCallback, useRef, useEffect } from 'react';
import GraphSVG from './components/GraphSVG';
import {
  NODES, EDGES_DEF, TARGET,
  buildAdj, createInitialState,
  bfStepSync, bfStepAsync,
  tracePath, generateRandomGraph, edgeKey,
} from './bellmanFord';

const INIT_LOG = [
  { msg: 'Inicializado: M[T]=0, M[v]=∞', type: 'info' },
  { msg: 'Use "Próxima Iteração" para avançar passo a passo', type: 'info' },
];

export default function App() {
  // Estado do grafo atual
  const [nodes, setNodes]         = useState(NODES);
  const [edgesDef, setEdgesDef]   = useState(EDGES_DEF);

  // Estado do algoritmo
  const [M, setM]                 = useState(() => createInitialState(NODES).M);
  const [succ, setSucc]           = useState(() => createInitialState(NODES).succ);
  const [iter, setIter]           = useState(0);
  const [converged, setConverged] = useState(false);
  const [changed, setChanged]     = useState(new Set());
  const [path, setPath]           = useState([]);
  const [edges, setEdges]         = useState(() => EDGES_DEF.map(e => ({ ...e })));
  const [removedEdge, setRemovedEdge] = useState(null);
  const [asyncQueue, setAsyncQueue]   = useState([]);

  // Tamanho do grafo aleatório (total de nós incluindo T)
  const [nodeCount, setNodeCount]   = useState(8);

  // Modos
  const [asyncMode, setAsyncMode]   = useState(false);
  const [ctInfMode, setCtInfMode]   = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // UI
  const [logLines, setLogLines]   = useState(INIT_LOG);
  const [toast, setToast]         = useState({ msg: '', show: false });

  const packetsRef  = useRef(null);
  const autoTimer   = useRef(null);
  const toastTimer  = useRef(null);

  // Ref sempre atualizado — leitura segura dentro de setInterval
  const state = useRef({});
  state.current = { M, succ, iter, converged, changed, path, asyncMode, ctInfMode, edges, removedEdge, asyncQueue, nodes, edgesDef, nodeCount };

  // ── helpers ──────────────────────────────────────────────────────
  const addLog = useCallback((msg, type = 'info') => {
    setLogLines(prev => [{ msg, type }, ...prev].slice(0, 50));
  }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 4500);
  }, []);

  const animatePackets = useCallback((changedNodes, currentEdges, currentNodes) => {
    const layer = packetsRef.current;
    if (!layer || !changedNodes || changedNodes.size === 0) return;
    const NS = 'http://www.w3.org/2000/svg';
    const adj = buildAdj(Object.keys(currentNodes), currentEdges);

    for (const v of changedNodes) {
      const src = currentNodes[v];
      if (!src) continue;
      for (const { to: w } of adj[v]) {
        const dst = currentNodes[w];
        if (!dst) continue;
        const pkt = document.createElementNS(NS, 'circle');
        pkt.setAttribute('cx', src.x);
        pkt.setAttribute('cy', src.y);
        pkt.setAttribute('r', '5');
        pkt.setAttribute('fill', '#58a6ff');
        pkt.setAttribute('opacity', '0.9');
        pkt.setAttribute('filter', 'url(#glow)');
        layer.appendChild(pkt);

        const dur = 600, t0 = performance.now();
        const { x: x1, y: y1 } = src, { x: x2, y: y2 } = dst;

        (function animate(now) {
          const t = Math.min((now - t0) / dur, 1);
          const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          pkt.setAttribute('cx', x1 + (x2 - x1) * e);
          pkt.setAttribute('cy', y1 + (y2 - y1) * e);
          pkt.setAttribute('opacity', t < 0.8 ? '0.9' : String(0.9 * (1 - t) / 0.2));
          if (t < 1) requestAnimationFrame(animate);
          else pkt.remove();
        })(t0);
      }
    }
  }, []);

  const stopAuto = useCallback(() => {
    clearInterval(autoTimer.current);
    autoTimer.current = null;
    setIsAutoRunning(false);
  }, []);

  // ── passo do algoritmo ───────────────────────────────────────────
  const doStep = useCallback(() => {
    const s = state.current;
    if (s.converged) return null;
    const nodeKeys = Object.keys(s.nodes);

    if (s.asyncMode) {
      const res = bfStepAsync(s.M, s.succ, s.edges, s.asyncQueue, nodeKeys);
      const newIter = res.isNewIter ? s.iter + 1 : s.iter;

      if (res.isNewIter)
        addLog(`Iteração ${newIter} (async) — ordem: ${[res.node, ...res.queue].join('→')}`, 'info');
      if (res.changed.size > 0)
        addLog(`  ${res.node}: M[${res.node}]=${res.M[res.node]}, succ=${res.succ[res.node]}`, 'update');

      setM(res.M);
      setSucc(res.succ);
      setChanged(res.changed);
      setAsyncQueue(res.queue);
      if (res.isNewIter) setIter(newIter);

      if (res.converged) {
        const p = tracePath(res.succ, nodeKeys.find(k => k !== TARGET) ?? 'A', TARGET);
        setPath(p);
        setConverged(true);
        addLog('Convergiu (assíncrono)!', 'converge');
        showToast(`✓ Convergiu em ${newIter} iteração(ões)! ${p.join(' → ')} (custo ${res.M[p[0]] ?? '—'})`);
        stopAuto();
      }

      return { changed: res.changed, edges: s.edges, nodes: s.nodes };
    } else {
      const res = bfStepSync(s.M, s.succ, s.edges, nodeKeys);
      const newIter = s.iter + 1;
      setIter(newIter);
      setM(res.M);
      setSucc(res.succ);
      setChanged(res.changed);

      if (res.changed.size > 0) {
        addLog(`Iteração ${newIter}: ${res.changed.size} nó(s) atualizado(s) — ${[...res.changed].join(', ')}`, 'update');
      } else {
        const first = nodeKeys.find(k => k !== TARGET) ?? 'A';
        const p = tracePath(res.succ, first, TARGET);
        setPath(p);
        setConverged(true);
        addLog(`Iteração ${newIter}: nenhuma mudança → CONVERGIU`, 'converge');
        showToast(`✓ Convergiu em ${newIter} iteração(ões)! ${p.join(' → ')} (custo ${res.M[first] ?? '—'})`);
        stopAuto();
      }

      return { changed: res.changed, edges: s.edges, nodes: s.nodes };
    }
  }, [addLog, showToast, stopAuto]);

  const handleStep = useCallback(() => {
    const res = doStep();
    if (res?.changed.size > 0) animatePackets(res.changed, res.edges, res.nodes);
  }, [doStep, animatePackets]);

  const startAuto = useCallback(() => {
    if (autoTimer.current) return;
    setIsAutoRunning(true);
    const speed = state.current.asyncMode ? 600 : 900;
    autoTimer.current = setInterval(() => {
      if (state.current.converged) { stopAuto(); return; }
      const res = doStep();
      if (res?.changed.size > 0) animatePackets(res.changed, res.edges, res.nodes);
    }, speed);
  }, [doStep, animatePackets, stopAuto]);

  const handleAutoToggle = useCallback(() => {
    if (autoTimer.current) stopAuto();
    else startAuto();
  }, [startAuto, stopAuto]);

  // ── reset compartilhado ──────────────────────────────────────────
  const applyReset = useCallback((newNodes, newEdges, logMsg) => {
    stopAuto();
    const { M: newM, succ: newSucc } = createInitialState(newNodes);
    setNodes(newNodes);
    setEdgesDef(newEdges);
    setM(newM);
    setSucc(newSucc);
    setEdges(newEdges.map(e => ({ ...e })));
    setIter(0);
    setConverged(false);
    setChanged(new Set());
    setPath([]);
    setRemovedEdge(null);
    setAsyncQueue([]);
    setAsyncMode(false);
    setCtInfMode(false);
    setLogLines([
      { msg: 'Inicializado: M[T]=0, M[v]=∞', type: 'info' },
      { msg: 'Use "Próxima Iteração" para avançar passo a passo', type: 'info' },
    ]);
    showToast(logMsg);
  }, [stopAuto, showToast]);

  const handleReset = useCallback(() => {
    applyReset(state.current.nodes, state.current.edgesDef, 'Reiniciado! M[T]=0, M[v]=∞ para todos os outros.');
  }, [applyReset]);

  const handleNewGraph = useCallback(() => {
    const nc = state.current.nodeCount;
    const { nodes: newNodes, edges: newEdges } = generateRandomGraph(nc);
    applyReset(newNodes, newEdges, `Novo grafo com ${nc} nós gerado!`);
  }, [applyReset]);

  const handleToggleAsync = useCallback(() => {
    if (state.current.converged) {
      showToast('Reinicie para usar o modo assíncrono.');
      return;
    }
    const newMode = !state.current.asyncMode;
    setAsyncMode(newMode);
    setAsyncQueue([]);
    if (newMode) {
      addLog('Modo assíncrono: roteadores atualizam em ordem aleatória', 'info');
      showToast('Modo assíncrono ativado! Cada clique atualiza 1 roteador aleatório.');
    }
  }, [addLog, showToast]);

  const handleCountingToInf = useCallback(() => {
    if (!state.current.converged) {
      showToast('Rode o algoritmo até convergir antes de ativar este modo!');
      return;
    }
    // Remove a aresta de menor peso incidente a T (está no caminho ótimo)
    const incidentToT = state.current.edges.filter(e => e.u === TARGET || e.v === TARGET);
    if (incidentToT.length === 0) { showToast('Nenhuma aresta conectada a T!'); return; }
    const toRemove = incidentToT.reduce((min, e) => e.w < min.w ? e : min);

    setEdges(prev => prev.filter(e => e !== toRemove));
    setRemovedEdge(toRemove);
    const label = `${toRemove.u}-${toRemove.v}`;
    addLog(`✂ Link ${label} REMOVIDO! Simulando counting to infinity...`, 'warn');
    showToast(`Link ${label} removido! Observe como o algoritmo oscila.`);

    setCtInfMode(true);
    setConverged(false);
    setChanged(new Set());
    setPath([]);
    setAsyncMode(false);
    setAsyncQueue([]);
  }, [addLog, showToast]);

  useEffect(() => () => {
    clearInterval(autoTimer.current);
    clearTimeout(toastTimer.current);
  }, []);

  // ── render ───────────────────────────────────────────────────────
  const modeBadge = ctInfMode
    ? { text: 'COUNTING TO ∞', cls: 'badge-ctinf' }
    : asyncMode
    ? { text: 'ASSÍNCRONO', cls: 'badge-async' }
    : { text: 'SÍNCRONO', cls: 'badge-sync' };

  const statusText = converged ? '✓ Convergiu'
    : iter === 0 ? 'Aguardando'
    : changed.size > 0 ? `${changed.size} atualiz.` : '—';

  const pathSet = new Set(path);
  const adj = buildAdj(Object.keys(nodes), edges);

  return (
    <>
      <header>
        <div>
          <div className="header-title">Distance Vector Protocol — Bellman-Ford</div>
          <div className="header-sub">Algoritmo de roteamento distribuído · destino: <strong>T</strong></div>
        </div>
        <div className="header-controls">
          <span className={`mode-badge ${modeBadge.cls}`}>{modeBadge.text}</span>
          <button className="btn btn-secondary" onClick={handleReset}>↺ Reiniciar</button>
          <div className="new-graph-group">
            <label className="node-count-label">Nós</label>
            <input
              type="number"
              className="node-count-input"
              min={4} max={11}
              value={nodeCount}
              onChange={e => setNodeCount(Math.max(4, Math.min(11, Number(e.target.value))))}
            />
            <button className="btn btn-secondary" onClick={handleNewGraph}>⚄ Novo Grafo</button>
          </div>
          <button className="btn btn-primary" onClick={handleStep} disabled={converged}>▶ Próxima Iteração</button>
          <button className="btn btn-secondary" onClick={handleAutoToggle} disabled={converged}>
            {isAutoRunning ? '⏸ Pausar' : '⏩ Auto'}
          </button>
          <button className="btn btn-warning" onClick={handleToggleAsync}>
            {asyncMode ? '↔ Modo Síncrono' : '⚡ Modo Assíncrono'}
          </button>
          <button className="btn btn-purple" onClick={handleCountingToInf} disabled={ctInfMode || !converged}>
            ∞ Counting to ∞
          </button>
        </div>
      </header>

      <div className="main">
        <div className="graph-area">
          <GraphSVG
            M={M}
            changed={changed}
            path={path}
            converged={converged}
            ctInfMode={ctInfMode}
            nodes={nodes}
            edgesDef={edgesDef}
            removedEdge={removedEdge}
            packetsRef={packetsRef}
          />
        </div>

        <div className="side-top">
          <div className="status-grid">
            <div className="stat-card">
              <div className="stat-label">Iteração</div>
              <div className="stat-val">{iter}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Status</div>
              <div className="stat-val" style={{ fontSize: '.85rem', color: converged ? 'var(--green)' : undefined }}>
                {statusText}
              </div>
            </div>
          </div>
          <div className="log-box">
            {logLines.map((l, i) => (
              <div key={i} className={`log-line ${l.type}`}>{l.msg}</div>
            ))}
          </div>
        </div>

        <div className="side-bot">
          <div className="tbl-wrap">
            <div className="tbl-title">Tabela de Distâncias</div>
            <table>
              <thead><tr><th>Nó</th><th>M[v]</th><th>Successor</th></tr></thead>
              <tbody>
                {Object.keys(nodes).map(v => {
                  const isT = v === TARGET;
                  const wasChanged = changed.has(v);
                  const onPath = converged && pathSet.has(v);
                  const cls = isT ? 'row-target' : wasChanged ? 'row-changed' : onPath ? 'row-path' : M[v] === Infinity ? 'row-inf' : '';
                  return (
                    <tr key={v} className={cls}>
                      <td><b>{v}</b></td>
                      <td>{M[v] === Infinity ? '∞' : M[v]}</td>
                      <td>{succ[v] ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tbl-wrap">
            <div className="tbl-title">Vizinhos Diretos</div>
            <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
              {Object.keys(nodes).map(v => (
                <div key={v} style={{ marginBottom: '3px' }}>
                  {v}: [{adj[v].map(({ to: w, w: c }) => `${w}(${c})`).join(', ')}]
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: '8px' }}>
              Legenda
            </div>
            <div className="legend">
              {[
                { bg: '#0a2744', border: '#58a6ff', label: 'Roteador (padrão)' },
                { bg: '#0a2e1a', border: '#3fb950', label: 'Servidor destino (T)' },
                { bg: '#3a1800', border: '#f0883e', label: 'Atualizado agora' },
                { bg: '#1a1d00', border: '#e3b341', label: 'No caminho mínimo' },
                { bg: '#1a0a2e', border: '#bc8cff', label: 'Counting to ∞' },
              ].map(item => (
                <div key={item.label} className="leg-item">
                  <div className="leg-dot" style={{ background: item.bg, borderColor: item.border }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="toast" className={toast.show ? 'show' : ''}>{toast.msg}</div>
    </>
  );
}
