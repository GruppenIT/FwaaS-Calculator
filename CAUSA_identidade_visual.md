# CAUSA — Guia de Naming e Identidade Visual
> Gestão Jurídica On-Premise  
> Versão 1.0 · Março de 2026 · Confidencial

---

## 1. Naming

### Nome do Produto
```
CAUSA
```

### Tagline oficial
```
A sua causa, no seu escritório.
```

### Regras de uso do nome

| Situação | Correto | Incorreto |
|---|---|---|
| Referência ao produto | CAUSA | Causa, causa, C.A.U.S.A |
| Com tagline | CAUSA — A sua causa, no seu escritório. | CAUSA - a sua causa... |
| Nome técnico completo | CAUSA Gestão Jurídica | Sistema CAUSA, App CAUSA |
| Versões / planos | CAUSA Solo, CAUSA Escritório, CAUSA Equipe | Causa Solo, causa escritório |
| Add-on IA | CAUSA + IA | CAUSA IA, Causa com IA |

### Slogans aprovados por contexto

| Contexto | Slogan |
|---|---|
| **Página principal / pitch** | A sua causa, no seu escritório. |
| **Argumento de privacidade** | Todos os seus tribunais. Nenhum dado na nuvem. |
| **Anúncio / redes sociais** | Porque advogado bom não deveria perder tempo com sistema ruim. |
| **Campanha de impacto** | O escritório que não vaza. |
| **Comparação com concorrentes** | Leve de usar. Seus dados, pesados de proteger. |

---

## 2. Paleta de Cores

### Cores primárias

| Nome | Hex | RGB | Uso |
|---|---|---|---|
| **Azul CAUSA** | `#2563A8` | 37, 99, 168 | Cor principal — marca, botões primários, links, destaques |
| **Off-white quente** | `#F7F6F3` | 247, 246, 243 | Background principal da aplicação |
| **Branco suave** | `#FFFFFF` | 255, 255, 255 | Cards, painéis, modais |

### Cores de acento e estado

| Nome | Hex | RGB | Uso |
|---|---|---|---|
| **Verde-água** | `#2A9D8F` | 42, 157, 143 | Sucesso, status OK, confirmações, conectores ativos |
| **Âmbar** | `#E9A800` | 233, 168, 0 | Alertas leves, prazos próximos (3–7 dias), avisos não críticos |
| **Vermelho reservado** | `#DC2626` | 220, 38, 38 | EXCLUSIVO para prazo fatal, erro crítico, falha de conector |

> ⚠️ **Regra inviolável:** vermelho nunca aparece como cor decorativa, de marca ou de destaque positivo. Seu uso exclusivo é alerta crítico. O advogado precisa sentir urgência imediata ao ver vermelho — isso só funciona se vermelho for raro.

### Cores de texto e superfície

| Nome | Hex | RGB | Uso |
|---|---|---|---|
| **Grafite** | `#1E1E2E` | 30, 30, 46 | Texto principal — nunca usar preto puro (#000) |
| **Cinza médio** | `#6B7280` | 107, 114, 128 | Labels, metadados, texto secundário |
| **Cinza claro** | `#E5E7EB` | 229, 231, 235 | Bordas, divisores, separadores |
| **Cinza de fundo** | `#F3F4F6` | 243, 244, 246 | Fundo alternativo de linhas, zebrado em tabelas |

### Modo escuro — variáveis equivalentes

| Papel | Modo claro | Modo escuro |
|---|---|---|
| Background principal | `#F7F6F3` | `#0F0F1A` |
| Superfície (cards) | `#FFFFFF` | `#1A1A2E` |
| Texto principal | `#1E1E2E` | `#E8E8F0` |
| Texto secundário | `#6B7280` | `#9CA3AF` |
| Bordas | `#E5E7EB` | `#2D2D42` |
| Azul CAUSA | `#2563A8` | `#3B82F6` *(versão mais clara para contraste)* |

---

## 3. Tipografia

### Fontes aprovadas

| Papel | Fonte | Pesos a carregar | Formato de importação |
|---|---|---|---|
| **Interface (UI)** | Inter | 400, 500, 600, 700 | Google Fonts / self-hosted |
| **Logotipo / Splash screen** | Lora | 600 | Google Fonts / self-hosted |
| **Campos técnicos / logs / IDs** | JetBrains Mono | 400 | Google Fonts / self-hosted |

> **Nota de implementação:** Inter deve ser carregada como fonte local no bundle do Electron/Tauri para funcionar offline sem dependência de CDN. Fontes não devem ser carregadas de servidores externos em runtime.

### Escala tipográfica

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `text-xs` | 11px | 400 | Metadados, timestamps, badges |
| `text-sm` | 13px | 400 / 500 | Labels de campo, texto de suporte |
| `text-base` | 15px | 400 | Corpo de texto padrão |
| `text-md` | 16px | 500 | Itens de lista, conteúdo de cards |
| `text-lg` | 18px | 600 | Subtítulos de seção |
| `text-xl` | 22px | 700 | Títulos de página / módulo |
| `text-2xl` | 28px | 700 | Splash, títulos de modal importante |

### Hierarquia de uso

```
Título de módulo       → Inter 22px / 700 / Grafite #1E1E2E
Subtítulo de seção     → Inter 18px / 600 / Grafite #1E1E2E
Corpo de texto         → Inter 15px / 400 / Grafite #1E1E2E
Label de campo         → Inter 13px / 500 / Cinza médio #6B7280
Metadado / timestamp   → Inter 11px / 400 / Cinza médio #6B7280
Número de processo     → JetBrains Mono 13px / 400 / Grafite
```

---

## 4. Ícone e Logotipo

### Conceito
A marca é construída sobre a letra **C** de CAUSA com geometria limpa que sugere contenção — um espaço protegido, onde os dados ficam. A forma é aberta (como um C) mas estruturada, comunicando simultaneamente abertura (acessibilidade) e proteção (on-premise).

### Especificações do ícone

| Propriedade | Valor |
|---|---|
| Forma base | Letra C — peso Bold, cantos arredondados (radius proporcional) |
| Cor principal | Azul CAUSA `#2563A8` |
| Fundo (ícone app) | Branco `#FFFFFF` ou transparente |
| Gradiente | **Proibido** — cor sólida em todos os tamanhos |
| Sombra interna | **Proibida** — mantém leitura em 16px |
| Versão modo escuro | C em `#3B82F6` sobre fundo `#1A1A2E` |

### Tamanhos obrigatórios (Windows)

| Uso | Tamanho | Formato |
|---|---|---|
| Ícone de janela (title bar) | 16×16 px | `.ico` |
| Barra de tarefas | 32×32 px | `.ico` |
| Ícone de desktop | 48×48 px | `.ico` |
| Ícone de app (instalador) | 256×256 px | `.ico` |
| Favicon web / portal | 32×32 px | `.png` |
| Splash screen / about | 128×128 px | `.png` / `.svg` |

> **Nota de implementação:** Gerar um único arquivo `.ico` com múltiplos tamanhos embutidos (16, 32, 48, 256) usando ferramentas como `png2ico` ou ImageMagick. O SVG master deve ser construído primeiro e exportado para cada tamanho.

### Logotipo completo (nome + ícone)

```
[C] CAUSA
```

- Ícone à esquerda, nome à direita
- Fonte do nome: Lora 600 para uso em splash/about; Inter 700 para uso em UI
- Espaçamento entre ícone e nome: 8px
- Versão horizontal para splash screen e página de vendas
- Versão somente ícone para barra de tarefas e favicon

---

## 5. Componentes de Interface

### Princípios gerais

| Princípio | Decisão de implementação |
|---|---|
| **Layout base** | Sidebar fixa à esquerda (240px) + área de conteúdo principal |
| **Densidade de informação** | Média — nem minimalismo extremo, nem planilha |
| **Border-radius padrão** | 6px para cards e inputs; 4px para badges; 8px para modais |
| **Sombras** | Apenas 1 nível de elevação: `0 1px 3px rgba(0,0,0,0.08)` |
| **Bordas** | `1px solid #E5E7EB` — nunca mais espesso que 1px para divisores |
| **Modo escuro** | Suportado desde a v1.0 — definir variáveis CSS desde o início |

### Ícones de interface

- Biblioteca: **Lucide Icons** (open source, MIT, tree-shakable)
- Tamanho padrão: 16px em listas e campos; 20px em botões e navegação
- Cor: herda a cor do texto no contexto (`currentColor`)
- **Proibido:** misturar ícones de bibliotecas diferentes na mesma tela

### Botões

| Variante | Uso | Cor de fundo | Cor de texto |
|---|---|---|---|
| **Primary** | Ação principal da tela | `#2563A8` | `#FFFFFF` |
| **Secondary** | Ação secundária | `#FFFFFF` border `#E5E7EB` | `#1E1E2E` |
| **Danger** | Ação destrutiva (excluir) | `#FFFFFF` border `#DC2626` | `#DC2626` |
| **Ghost** | Ação terciária / link | Transparente | `#2563A8` |

- Altura: 36px (padrão); 32px (compacto); 40px (destaque)
- Padding horizontal: 16px
- Border-radius: 6px
- Estado hover: escurecer 8% a cor de fundo

### Inputs e formulários

- Altura: 36px
- Border: `1px solid #E5E7EB`
- Border-radius: 6px
- Foco: `border-color: #2563A8` + `box-shadow: 0 0 0 3px rgba(37,99,168,0.15)`
- Erro: `border-color: #DC2626`
- Label: Inter 13px / 500 / `#6B7280`, acima do campo, 4px de gap

### Sidebar de navegação

- Largura: 240px (fixa, não colapsável no MVP)
- Fundo: `#FFFFFF` com borda direita `1px solid #E5E7EB`
- Item ativo: fundo `rgba(37,99,168,0.08)`, texto `#2563A8`, ícone `#2563A8`
- Item hover: fundo `#F7F6F3`
- Texto de item: Inter 14px / 500
- Agrupamento por seções com label Inter 11px / 600 / `#6B7280` em caixa alta

### Alertas e notificações de prazo

| Urgência | Cor de fundo | Cor de borda | Ícone | Prazo |
|---|---|---|---|---|
| **Informativo** | `rgba(37,99,168,0.08)` | `#2563A8` | info | — |
| **Atenção** | `rgba(233,168,0,0.10)` | `#E9A800` | clock | 4–7 dias |
| **Urgente** | `rgba(233,168,0,0.20)` | `#E9A800` | alert | 2–3 dias |
| **Fatal** | `rgba(220,38,38,0.10)` | `#DC2626` | alert-triangle | 0–1 dia |

### Animações e transições

| Elemento | Duração | Easing |
|---|---|---|
| Hover em botões / itens | 120ms | ease-out |
| Abertura de modal | 180ms | ease-out |
| Transição de página | 150ms | ease-in-out |
| Toast / notificação | 200ms entrada, 150ms saída | ease-out |

> **Regra:** nenhuma animação puramente decorativa. Toda transição deve orientar o usuário sobre o que está acontecendo.

---

## 6. Splash Screen e Estados da Aplicação

### Splash screen (inicialização)

- Fundo: `#0F1829` (azul muito escuro — único uso de fundo escuro por padrão)
- Logo CAUSA centralizado: branco + versão clara do C
- Tagline abaixo do logo: Lora 16px / `rgba(255,255,255,0.7)`
- Barra de progresso fina: Azul CAUSA `#2563A8`, 2px de altura, animada
- Versão do software: Inter 11px / canto inferior direito / `rgba(255,255,255,0.4)`

### Tela de onboarding (primeiro uso)

- Fundo: Off-white `#F7F6F3`
- Wizard em 3 etapas: configurar escritório → instalar certificado → conectar primeiro tribunal
- Progresso visual por steps numerados
- Tom de escrita: direto, sem jargão técnico, como se Diana estivesse guiando pessoalmente

### Estado vazio (sem processos ainda)

- Ícone ilustrativo simples (linha — não preenchido)
- Mensagem encorajadora, não técnica
- Call to action primário para importar primeiro processo ou conectar tribunal

---

## 7. Janela do Aplicativo (Windows)

### Title bar

- Usar title bar nativa do Windows — não customizar
- Ícone 16px à esquerda do título
- Título: `CAUSA — [Nome do Escritório]`

### Dimensões mínimas recomendadas

| Propriedade | Valor |
|---|---|
| Largura mínima da janela | 1024px |
| Altura mínima da janela | 600px |
| Tamanho padrão ao abrir | 1280×800px |
| Tela mínima suportada | 1366×768px (notebook padrão de escritório) |

> **Nota:** testar toda a interface em 1366×768 a 100% de escala antes de cada release. É a resolução mais comum nos notebooks de escritórios jurídicos de pequeno porte no Brasil.

---

## 8. Tokens CSS — Referência Rápida

```css
:root {
  /* Cores */
  --color-primary:        #2563A8;
  --color-primary-hover:  #1D4E8F;
  --color-primary-light:  rgba(37, 99, 168, 0.08);
  --color-success:        #2A9D8F;
  --color-warning:        #E9A800;
  --color-danger:         #DC2626;

  /* Backgrounds */
  --color-bg:             #F7F6F3;
  --color-surface:        #FFFFFF;
  --color-surface-alt:    #F3F4F6;

  /* Texto */
  --color-text:           #1E1E2E;
  --color-text-muted:     #6B7280;

  /* Bordas */
  --color-border:         #E5E7EB;

  /* Tipografia */
  --font-ui:              'Inter', system-ui, sans-serif;
  --font-brand:           'Lora', Georgia, serif;
  --font-mono:            'JetBrains Mono', 'Courier New', monospace;

  /* Espaçamento */
  --radius-sm:            4px;
  --radius-md:            6px;
  --radius-lg:            8px;

  /* Sombra */
  --shadow-sm:            0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md:            0 4px 12px rgba(0, 0, 0, 0.10);

  /* Sidebar */
  --sidebar-width:        240px;
}
```

---

## 9. O que nunca fazer

| ❌ Proibido | Motivo |
|---|---|
| Usar vermelho fora de contexto de erro/prazo fatal | Destrói o sistema de alerta |
| Gradientes no logo ou ícone | Ilegível em 16px |
| Preto puro `#000000` para texto | Contraste duro; usar Grafite `#1E1E2E` |
| Branco puro `#FFFFFF` como fundo de tela inteira | Fadiga visual em uso prolongado |
| Mais de 2 pesos de fonte na mesma tela | Fragmenta a hierarquia |
| Animações sem propósito de orientação | Distração em ambiente de trabalho |
| Misturar ícones de bibliotecas diferentes | Inconsistência visual |
| Fontes carregadas de CDN externo em runtime | Falha em modo offline |
| Customizar a title bar nativa do Windows | Quebra convenções do OS |

---

*Documento preparado pela equipe fundadora — Rodrigo S. da Rocha · Diana Rocha · Michele Fagundes*  
*Março de 2026 · Confidencial · Todos os direitos reservados*
