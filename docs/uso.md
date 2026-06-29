# Como Usar

## Instalação

### Pré-requisitos

- Node.js 18+
- npm

### Passos

```bash
# Clone o repositório
git clone https://github.com/Mach1r0/G32_Programacao_Dinamica_PA-26.1.git
cd G32_Programacao_Dinamica_PA-26.1

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no navegador.

---

## Interface

### Cabeçalho

| Controle | Descrição |
|----------|-----------|
| Badge de modo | Indica o modo ativo: **SÍNCRONO**, **ASSÍNCRONO** ou **COUNTING TO ∞** |
| Reiniciar | Reseta as distâncias para o estado inicial sem trocar o grafo |
| Nós (− / +) | Ajusta o número de nós do próximo grafo gerado (4–11) |
| Novo Grafo | Gera um grafo aleatório conexo com o número de nós selecionado |
| Próxima Iteração | Avança um passo do algoritmo |
| Auto | Liga/desliga execução automática contínua |
| Modo Assíncrono | Alterna entre execução síncrona e assíncrona |
| Counting to ∞ | Ativa o modo de simulação do problema de contagem ao infinito |

### Painel Lateral

- **Iteração** — contador da rodada atual
- **Status** — `Aguardando`, `N atualiz.` ou `✓ Convergiu`
- **Log** — histórico das iterações com nós atualizados
- **Tabela de Distâncias** — `M[v]` e `Successor` de cada nó
- **Vizinhos Diretos** — lista de adjacências com pesos

### Legenda de Cores

| Cor | Significado |
|-----|-------------|
| 🔵 Azul | Roteador padrão |
| 🟢 Verde | Servidor destino (T) |
| 🟠 Laranja | Atualizado na iteração atual |
| 🟡 Amarelo/Dourado | No caminho mínimo (após convergência) |
| 🟣 Roxo | Nó em modo Counting to ∞ |

---

## Passo a Passo

### Explorando o Modo Síncrono

1. Abra a aplicação — o grafo padrão de **8 nós** é carregado.
2. Observe a **Tabela de Distâncias**: M[T] = 0, M[demais] = ∞.
3. Clique em **"Próxima Iteração"** — os nós diretamente conectados a T ficam laranjas.
4. Continue clicando até o status mostrar **✓ Convergiu**.
5. O caminho mínimo de cada nó até T fica destacado em amarelo.

### Testando com Grafo Aleatório

1. Ajuste o contador para **11** usando o botão **+**.
2. Clique em **"Novo Grafo"** — um grafo conexo aleatório é gerado.
3. Ative **"Auto"** para executar automaticamente até convergir.
4. Observe quantas iterações foram necessárias no painel lateral.

### Simulando Counting to ∞

1. Gere qualquer grafo e deixe o algoritmo **convergir** completamente.
2. Clique em **"Counting to ∞"** no cabeçalho — o modo muda para roxo.
3. Um enlace direto a **T** é removido (aparece como tracejado vermelho).
4. Avance as iterações manualmente ou com **Auto** e observe:
   - Os nós vizinhos ao enlace removido incrementam suas distâncias.
   - O algoritmo pode demorar mais iterações para encontrar uma rota alternativa.

### Comparando Síncrono vs. Assíncrono

1. Execute o algoritmo em **modo síncrono** e anote o número de iterações.
2. Clique em **"Reiniciar"** para voltar ao estado inicial.
3. Ative **"Modo Assíncrono"**.
4. Execute e compare: o número de iterações pode ser diferente porque a ordem de atualização varia.

---

## Build para Produção

```bash
npm run build
```

Os arquivos estáticos são gerados em `dist/`. Para prévia local:

```bash
npm run preview
```
