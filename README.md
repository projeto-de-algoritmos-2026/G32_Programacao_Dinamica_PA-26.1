## Vídeo de apresentação

<!-- [![YouTube](https://img.shields.io/badge/YouTube-Assista-red?logo=youtube)](LINK_DO_VIDEO) -->

## Alunos

- Daniel Ferreira Nunes - 211061565
- Felipe de Sousa Coelho - 211061707 

## Sobre

Visualizador interativo do **algoritmo de Bellman-Ford** aplicado ao protocolo de roteamento por vetor de distâncias (*Distance Vector Routing*). O projeto simula como roteadores de uma rede calculam o menor caminho até um destino **T** de forma distribuída, iteração por iteração.

Três modos de execução são suportados:

- **Síncrono** — todos os roteadores atualizam suas tabelas ao mesmo tempo a cada iteração.
- **Assíncrono** — a cada passo, um roteador aleatório processa as mensagens recebidas.
- **Counting to ∞** — simula a remoção de um enlace direto ao destino, expondo o problema de contagem ao infinito presente em protocolos como o RIP.

## Screenshots

### Tela Inicial

![Tela inicial com 8 nós](docs/images/tela-inicial.png)

### Novo Grafo Gerado

![Novo grafo com 11 nós gerado aleatoriamente](docs/images/novo-grafo.png)

### Iteração em Andamento

![Iteração 1 — nós em laranja foram atualizados](docs/images/iteracao-em-andamento.png)

### Convergência (modo síncrono)

![Algoritmo convergiu em 4 iterações — caminho A→E→I→T destacado](docs/images/convergencia.png)

### Modo Assíncrono com Counting to ∞

![Link I-T removido (tracejado vermelho), modo counting to ∞ ativado](docs/images/modo-assíncrono.png)

### Convergência com Counting to ∞

![Convergência em 5 iterações mesmo após remoção de enlace](docs/images/counting-to-infinity.png)

## Instalação

```bash
npm install
npm run dev
```

O servidor de desenvolvimento inicia em [http://localhost:5173](http://localhost:5173).

## Uso

1. Acesse a aplicação no navegador.
2. O grafo padrão com **8 nós** (A–G + T) é carregado automaticamente.
3. Clique em **"Próxima Iteração"** para avançar o algoritmo passo a passo.
4. Ative **"Auto"** para execução automática contínua.
5. Use **"Novo Grafo"** para gerar um grafo aleatório (4–11 nós).
6. Ajuste o contador de nós com os botões **+** e **−** antes de gerar.
7. Alterne entre os modos **Síncrono**, **Modo Assíncrono** e **Counting to ∞** pelo cabeçalho.
8. Após a convergência, o caminho mínimo até **T** é destacado em amarelo.
9. Use **"Reiniciar"** para voltar ao estado inicial sem trocar o grafo.

## Algoritmo

O **Bellman-Ford** resolve o problema de menor caminho com pesos arbitrários (sem ciclos negativos). No contexto de roteamento, cada nó mantém um vetor de distâncias `M[v]` e um ponteiro sucessor `succ[v]`.

**Equação de Bellman:**

```
M[v] = min_{u ∈ vizinhos(v)} { w(v, u) + M[u] }
```

A convergência é garantida em no máximo `|V| − 1` iterações (onde `|V|` é o número de nós). O modo **Counting to ∞** demonstra a instabilidade quando um enlace é removido e os vizinhos não possuem informação de rota alternativa, fazendo as distâncias crescerem indefinidamente até um limite.

**Complexidade:** O(V · E) por execução completa.
