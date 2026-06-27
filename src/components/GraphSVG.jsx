import React from 'react';
import { NODE_RADIUS, TARGET, edgeKey } from '../bellmanFord';

// Ícone de roteador (nós comuns)
function RouterIcon({ x, y, stroke, textFill, name, distVal, distFill }) {
  return (
    <g>
      {/* Corpo */}
      <rect x={x - 12} y={y - 6} width="24" height="13" rx="2"
        fill="none" stroke={stroke} strokeWidth="1.3" />
      {/* Divisor interno */}
      <line x1={x - 10} y1={y - 0.5} x2={x + 10} y2={y - 0.5}
        stroke={stroke} strokeWidth="0.8" opacity="0.55" />
      {/* LEDs (painel superior) */}
      <circle cx={x - 5} cy={y - 3.2} r="1.5" fill={textFill} opacity="0.85" />
      <circle cx={x} cy={y - 3.2} r="1.5" fill={textFill} opacity="0.85" />
      <circle cx={x + 5} cy={y - 3.2} r="1.5" fill={textFill} opacity="0.85" />
      {/* Portas (painel inferior) */}
      <rect x={x - 9} y={y + 1.5} width="4" height="3.5" rx="0.6"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.7" />
      <rect x={x - 2.5} y={y + 1.5} width="4" height="3.5" rx="0.6"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.7" />
      <rect x={x + 4} y={y + 1.5} width="4" height="3.5" rx="0.6"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.7" />
      {/* Nome do nó */}
      <text x={x} y={y - 16} fill={textFill} fontSize="9" fontWeight="700"
        fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
        {name}
      </text>
      {/* Distância */}
      <text x={x} y={y + 17} fill={distFill} fontSize="10"
        fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
        {distVal}
      </text>
    </g>
  );
}

// Ícone de servidor (nó destino T)
function ServerIcon({ x, y, stroke, textFill, distFill }) {
  return (
    <g>
      {/* Gabinete */}
      <rect x={x - 12} y={y - 9} width="24" height="18" rx="2"
        fill="none" stroke={stroke} strokeWidth="1.3" />
      {/* Drive bays */}
      <rect x={x - 9} y={y - 6} width="13" height="3" rx="1"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.8" />
      <rect x={x - 9} y={y - 1} width="13" height="3" rx="1"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.8" />
      <rect x={x - 9} y={y + 4} width="13" height="3" rx="1"
        fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.8" />
      {/* Status LEDs */}
      <circle cx={x + 9} cy={y - 4.5} r="1.4" fill={textFill} opacity="0.9" />
      <circle cx={x + 9} cy={y + 0.5} r="1.4" fill={textFill} opacity="0.9" />
      <circle cx={x + 9} cy={y + 5.5} r="1.4" fill={textFill} opacity="0.9" />
      {/* Label */}
      <text x={x} y={y - 19} fill={textFill} fontSize="9" fontWeight="700"
        fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
        T
      </text>
      <text x={x} y={y + 19} fill={distFill} fontSize="10"
        fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
        0
      </text>
    </g>
  );
}

export default function GraphSVG({ M, changed, path, converged, ctInfMode, nodes, edgesDef, removedEdge, packetsRef }) {
  const pathSet = new Set(path);
  const removedKey = removedEdge ? edgeKey(removedEdge.u, removedEdge.v) : null;

  return (
    <svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Arestas */}
      <g>
        {edgesDef.map(e => {
          const key = edgeKey(e.u, e.v);
          const n1 = nodes[e.u], n2 = nodes[e.v];
          if (!n1 || !n2) return null;

          const mx = (n1.x + n2.x) / 2;
          const my = (n1.y + n2.y) / 2;
          const isRemoved = key === removedKey;
          const onPath = !isRemoved && path.length > 1 && (() => {
            for (let i = 0; i < path.length - 1; i++) {
              if (edgeKey(path[i], path[i + 1]) === key) return true;
            }
            return false;
          })();

          const stroke = isRemoved ? '#f85149' : onPath ? '#e3b341' : '#30363d';
          const sw = onPath ? '3.5' : '2.5';
          const dash = isRemoved ? '6 4' : '';
          const lFill = isRemoved ? '#f85149' : onPath ? '#e3b341' : '#8b949e';

          return (
            <g key={key}>
              <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                stroke={stroke} strokeWidth={sw} strokeDasharray={dash}
                style={{ transition: 'stroke 0.4s' }} />
              <text x={mx} y={my} fill={lFill} fontSize="13" fontWeight="700"
                fontFamily="monospace" textAnchor="middle" dominantBaseline="middle"
                paintOrder="stroke" stroke="#0d1117" strokeWidth="3"
                style={{ transition: 'fill 0.4s' }}>
                {e.w}
              </text>
            </g>
          );
        })}
      </g>

      {/* Camada de pacotes — manipulada imperativamente via ref */}
      <g ref={packetsRef} />

      {/* Nós */}
      <g>
        {Object.entries(nodes).map(([name, pos]) => {
          const isT = name === TARGET;
          const onPath = pathSet.has(name);
          const wasChanged = changed.has(name);
          const isCTInf = ctInfMode && !converged;

          let fill, stroke, textFill;
          if (isT) {
            fill = '#0a2e1a'; stroke = '#3fb950'; textFill = '#3fb950';
          } else if (wasChanged && isCTInf) {
            fill = '#2a0a3a'; stroke = '#bc8cff'; textFill = '#bc8cff';
          } else if (wasChanged) {
            fill = '#3a1800'; stroke = '#f0883e'; textFill = '#f0883e';
          } else if (converged && onPath) {
            fill = '#1a1d00'; stroke = '#e3b341'; textFill = '#fbbf24';
          } else {
            fill = '#0a2744'; stroke = '#58a6ff'; textFill = '#93c5fd';
          }

          const distVal = M[name] === Infinity ? '∞' : M[name];
          const distFill = M[name] === Infinity ? '#444c56' : wasChanged ? stroke : '#6b7280';

          return (
            <g key={name} style={{ transition: 'all 0.4s' }}>
              <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                fill={fill} stroke={stroke} strokeWidth="2.5"
                style={{ transition: 'fill 0.4s, stroke 0.4s' }} />
              {isT
                ? <ServerIcon x={pos.x} y={pos.y} stroke={stroke} textFill={textFill} distFill={distFill} />
                : <RouterIcon x={pos.x} y={pos.y} stroke={stroke} textFill={textFill}
                    name={name} distVal={distVal} distFill={distFill} />
              }
            </g>
          );
        })}
      </g>
    </svg>
  );
}
