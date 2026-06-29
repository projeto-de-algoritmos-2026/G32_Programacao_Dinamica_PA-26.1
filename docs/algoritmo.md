# Algoritmo de Bellman-Ford

## Contexto: Roteamento por Vetor de Distâncias

O **Distance Vector Routing** é um protocolo de roteamento distribuído onde cada roteador mantém uma tabela com a distância estimada até cada destino e o próximo salto (*successor*). Periodicamente, cada roteador troca sua tabela com seus vizinhos diretos e atualiza suas estimativas.

O algoritmo de Bellman-Ford é a base matemática desse processo.

---

## Formulação

Dado um grafo $G = (V, E)$ com pesos $w(u, v)$ nas arestas e um destino fixo **T**, define-se:

$$M[v] = \min_{u \in \text{vizinhos}(v)} \{ w(v, u) + M[u] \}$$

com condição inicial:

$$M[T] = 0, \quad M[v] = \infty \quad \forall v \neq T$$

A convergência é garantida em no máximo $|V| - 1$ iterações, desde que não existam **ciclos negativos**.

---

## Implementação

### Estado do Algoritmo

```js
// bellmanFord.js
export function createInitialState(nodes) {
  const M = {}, succ = {}
  for (const v of nodes) {
    M[v] = v === TARGET ? 0 : Infinity
    succ[v] = null
  }
  return { M, succ }
}
```

### Passo Síncrono

Todos os nós atualizam simultaneamente usando os valores da iteração anterior:

```js
export function bfStepSync(M, succ, edges, nodeKeys) {
  const newM = { ...M }
  let updated = []
  for (const v of nodeKeys) {
    if (v === TARGET) continue
    for (const { to: u, weight } of edges[v] ?? []) {
      if (M[u] + weight < newM[v]) {
        newM[v] = M[u] + weight
        succ[v] = u
        updated.push(v)
      }
    }
  }
  return { newM, updated }
}
```

### Passo Assíncrono

Um único nó escolhido aleatoriamente atualiza usando os valores **correntes** (já atualizados por outros nós na mesma iteração):

```js
export function bfStepAsync(M, succ, edges, queue, nodeKeys) {
  const v = queue.shift()  // nó escolhido
  for (const { to: u, weight } of edges[v] ?? []) {
    if (M[u] + weight < M[v]) {
      M[v] = M[u] + weight
      succ[v] = u
    }
  }
  queue.push(v)
  return { updated: [v] }
}
```

### Reconstrução do Caminho

```js
export function tracePath(succ, start, target) {
  const path = [start]
  let cur = start
  while (cur !== target && succ[cur]) {
    cur = succ[cur]
    path.push(cur)
  }
  return path
}
```

---

## Modos de Execução

### Síncrono

Modela a **rodada síncrona global**: todos os roteadores enviam e processam mensagens ao mesmo tempo. Converge em exatamente $k$ iterações, onde $k$ é o diâmetro do grafo (menor caminho mais longo).

### Assíncrono

Modela redes reais onde cada roteador opera com seu próprio clock. A convergência ainda é garantida, mas pode levar mais ou menos iterações dependendo da ordem de processamento.

### Counting to ∞

Demonstra uma vulnerabilidade do Distance Vector: quando um enlace direto ao destino é removido, dois vizinhos podem criar um **loop de roteamento** entre si, incrementando suas distâncias indefinidamente. Soluções clássicas incluem *split horizon* e *poison reverse*.

---

## Complexidade

| Métrica | Valor |
|---------|-------|
| Tempo (por iteração síncrona) | O(E) |
| Tempo (convergência completa) | O(V · E) |
| Espaço | O(V + E) |

Onde V = número de nós e E = número de arestas.

---

## Diferença para Dijkstra

| Característica | Bellman-Ford | Dijkstra |
|----------------|-------------|---------|
| Pesos negativos | ✅ Suporta | ❌ Não suporta |
| Detecção de ciclos negativos | ✅ Sim | ❌ Não |
| Complexidade | O(V·E) | O((V+E) log V) |
| Modelo de execução | Distribuído | Centralizado |
| Uso em redes | Distance Vector (RIP) | Link State (OSPF) |
