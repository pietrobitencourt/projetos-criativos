# Coração de "eu te amo" ❤

![Animação do coração](img/preview.gif)

Um coração formado por "eu te amo" em vários idiomas, com animação de entrada.
Feito com HTML, CSS e JavaScript puro (sem nenhuma biblioteca externa) e também em Python.

🔗 **Demonstração:** https://pietrobitencourt.github.io/projetos-criativos/coracao/

## Tecnologias

- **Versão web:** HTML5 (Canvas), CSS e JavaScript, com 71 frases em vários idiomas
- **Versão Python:** `turtle` e `tkinter`, com 68 frases

## Como funciona

1. **O formato:** o contorno do coração vem de uma fórmula matemática (curva paramétrica).
2. **O preenchimento:** o coração é dividido em linhas horizontais. Em cada linha, o programa mede a largura real de cada frase e sorteia combinações que preenchem o espaço sem sobrepor nada.
3. **A animação:** primeiro surge o contorno, a partir do topo e no sentido horário. Depois o miolo se preenche. Cada frase aparece brilhando e esmaece até o vermelho.

## Estrutura

```
coracao/
├── index.html        # página (é o que o navegador abre)
├── css/
│   └── style.css     # fundo, tela cheia e mensagem final
├── js/
│   ├── frases.js     # frases e mensagem final (edite aqui)
│   └── script.js     # o coração e a animação
├── python/
│   └── love.py       # versão em Python
├── img/              # prévia do projeto (GIF e imagem do link)
└── README.md
```

## Como personalizar

| O que mudar | Onde |
|---|---|
| Frases e mensagem final | `js/frases.js` |
| Cores, velocidade e tamanho das letras | começo de `js/script.js` |
| Tocar no coração repetir a animação | `replayOnTap` em `js/script.js` (`false` por padrão) |
| Cor de fundo da página | `css/style.css` |

## Como ver no computador

**Versão web:** dê dois cliques em `index.html`.

**Versão Python:** precisa do Python 3 instalado (o `tkinter` já vem junto na instalação do Windows). No terminal, dentro da pasta `python/`:

```
python love.py
```

## Como publicar (GitHub Pages)

1. No repositório, vá em **Settings → Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main** e pasta **/ (root)**, e clique em **Save**.
3. Em 1 ou 2 minutos o site fica no ar. Cada projeto abre pelo nome da sua pasta:
   `https://pietrobitencourt.github.io/projetos-criativos/coracao/`

> Se este projeto ficar sozinho em um repositório, o `index.html` precisa estar na raiz dele.

## Observações

- Cada pessoa vê o texto com as fontes do próprio aparelho, então o visual muda um pouco entre Windows, iPhone e Android. Se algum idioma aparecer quebrado, é só apagar essa frase de `js/frases.js`.
- Quem abrir o link vê a animação uma vez. Para repetir, é só recarregar a página.

## Créditos

Inspirado em um vídeo do perfil @buildmeri no Instagram. O código foi reescrito do zero.
