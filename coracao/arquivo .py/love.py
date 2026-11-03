import math as m
import random as r
import turtle as t
import tkinter.font as tkf

# ---------- CONFIGURAÇÕES (mexa aqui para personalizar) ----------
W, H = 700, 620          # tamanho da janela (se cortar na tela, diminua)
BG = "#050008"           # cor de fundo
FONT = "Segoe UI"        # fonte (precisa suportar vários alfabetos)
SIZES = [9, 10, 11, 12, 13]   # tamanhos de letra sorteados
GAP = 10                 # espaço mínimo entre frases (pixels)
ROW_GAP = 1.0            # altura da linha (maior = linhas mais afastadas)
MARGIN = 0.90            # quanto da janela o coração ocupa (0 a 1)

# animação (1 quadro = 16 ms, ou seja ~60 quadros por segundo)
OUTLINE_DELAY = 4        # quadros entre uma frase e outra no contorno
INTERIOR_DELAY = 2       # quadros entre uma frase e outra no miolo
FADE_FRAMES = 24         # duração do brilho -> vermelho de cada frase
FLASH = (255, 220, 205)  # cor do "brilho" quando a frase aparece (R, G, B)

COLORS = ["#ff1a3c", "#ff3355", "#ff5533", "#ff7a2f", "#e8103a"]

PHRASES = [
    # Português, espanhol e outras línguas latinas
    "Eu te amo", "Te amo", "Te quiero", "Je t'aime", "Ti amo",
    "T'estimo", "Quérote", "Te iubesc", "Inħobbok",
    # Inglês e línguas germânicas
    "I love you", "Ich liebe dich", "Ik hou van jou", "Jag älskar dig",
    "Jeg elsker deg", "Jeg elsker dig", "Ég elska þig", "Ek is lief vir jou",
    # Eslavas e bálticas
    "Kocham cię", "Miluji tě", "Ľúbim ťa", "Я тебя люблю", "Я тебе кохаю",
    "Обичам те", "Volim te", "Ljubim te", "Es tevi mīlu", "Aš tave myliu",
    # Outras da Europa
    "Σ' αγαπώ", "Seni seviyorum", "Szeretlek", "Rakastan sinua",
    "Ma armastan sind", "Të dua", "Maite zaitut", "Mi amas vin",
    "Tá grá agam duit", "Rwy'n dy garu di", "Tha gaol agam ort",
    # Cáucaso e Ásia Central
    "მიყვარხარ", "Ես քեզ սիրում եմ", "Mən səni sevirəm",
    "Мен сені жақсы көремін", "Men seni sevaman", "Би чамд хайртай",
    # Ásia
    "사랑해", "愛してる", "我爱你", "ฉันรักเธอ", "Anh yêu em",
    "Aku cinta kamu", "Saya cintakan awak", "Mahal kita",
    "मैं तुमसे प्यार करता हूँ", "আমি তোমাকে ভালোবাসি",
    "நான் உன்னை காதலிக்கிறேன்", "నేను నిన్ను ప్రేమిస్తున్నాను",
    "माझे तुझ्यावर प्रेम आहे", "હું તને પ્રેમ કરું છું", "म तिमीलाई माया गर्छु",
    # África, Oceania e Américas
    "Nakupenda", "Ngiyakuthanda", "Mo nifẹ rẹ", "Ina son ka",
    "Waan ku jeclahay", "Aloha au iā ʻoe", "Aroha au ki a koe",
    "Mwen renmen ou", "Rohayhu",
]

# ---------- JANELA ----------
s = t.Screen()
s.setup(W, H, startx=None, starty=10)   # starty=10: janela perto do topo
s.bgcolor(BG)
s.title("Love Heart")
s.tracer(0)                 # desliga a animação automática da tartaruga

cv = s.getcanvas()          # canvas do tkinter por baixo do turtle
rng = r.Random(11)          # semente fixa: o desenho sai sempre igual

# ---------- FONTES E MEDIDAS (guardadas em cache) ----------
_fonts = {}
_widths = {}


def font_for(size):
    if size not in _fonts:
        _fonts[size] = tkf.Font(
            root=cv, family=FONT, size=size, weight="bold"
        )
    return _fonts[size]


def measure(text, size):
    """Largura real (em pixels) que a frase vai ocupar."""
    key = (text, size)
    if key not in _widths:
        _widths[key] = font_for(size).measure(text)
    return _widths[key]


# ---------- FORMATO DO CORAÇÃO ----------
def heart(a):
    x = 16 * m.sin(a) ** 3
    y = (
        13 * m.cos(a)
        - 5 * m.cos(2 * a)
        - 2 * m.cos(3 * a)
        - m.cos(4 * a)
    )
    return x, y


def build_outline():
    """Contorno do coração, já ajustado e centralizado na janela."""
    raw = [heart(2 * m.pi * i / 720) for i in range(720)]
    xs = [p[0] for p in raw]
    ys = [p[1] for p in raw]
    sc = min(MARGIN * W / (max(xs) - min(xs)),
             MARGIN * H / (max(ys) - min(ys)))
    cx = (max(xs) + min(xs)) / 2
    cy = (max(ys) + min(ys)) / 2
    return [((x - cx) * sc, (y - cy) * sc) for x, y in raw]


def intervals(poly, y):
    """Trechos [esquerda, direita] do coração na altura y."""
    xs = []
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 <= y < y2) or (y2 <= y < y1):
            xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    xs.sort()
    return [(xs[i], xs[i + 1]) for i in range(0, len(xs) - 1, 2)]


def row_intervals(poly, y, h):
    """Trechos da linha, garantindo que o texto não passe da borda."""
    result = []
    for left, right in intervals(poly, y):
        for other in (intervals(poly, y + h / 2),
                      intervals(poly, y - h / 2)):
            best, best_ov = None, 0
            for a, b in other:
                ov = min(b, right) - max(a, left)
                if ov > best_ov:
                    best, best_ov = (a, b), ov
            if best:
                left, right = max(left, best[0]), min(right, best[1])
        if right - left > 40:
            result.append((left + 4, right - 4))
    return result


# ---------- ENCAIXA AS FRASES EM CADA LINHA ----------
_used = {p: 0 for p in PHRASES}     # quantas vezes cada frase já apareceu


def pick_phrase(already):
    """Sorteia entre as frases menos usadas, para todas aparecerem."""
    pool = [p for p in PHRASES if p not in already]
    least = min(_used[p] for p in pool)
    return rng.choice([p for p in pool if _used[p] == least])


def pack_row(width):
    """Sorteia frases e escolhe a combinação que melhor preenche a linha."""
    best = None
    for _ in range(40):
        row, used = [], 0
        while True:
            text = pick_phrase([x[0] for x in row])
            size = rng.choice(SIZES)
            w = measure(text, size)
            need = w if not row else w + GAP
            if used + need > width:
                break
            row.append((text, size, w))
            used += need
        if row and (best is None or width - used < best[0]):
            best = (width - used, row)
    if not best:
        return []
    for text, _, _ in best[1]:
        _used[text] += 1
    return best[1]


def build_items():
    """Devolve (x, y, frase, tamanho, cor, é_do_contorno) para cada frase."""
    poly = build_outline()
    row_h = max(font_for(z).metrics("linespace") for z in SIZES) * ROW_GAP
    top = max(p[1] for p in poly)
    bottom = min(p[1] for p in poly)
    ys = []
    y = top - row_h / 2
    while y > bottom + row_h / 3:
        ys.append(y)
        y -= row_h

    items = []
    for n, y in enumerate(ys):
        for left, right in row_intervals(poly, y, row_h):
            row = pack_row(right - left)
            if not row:
                continue
            total = sum(w for _, _, w in row)
            gap = (right - left - total) / (len(row) - 1) if len(row) > 1 else 0
            x = left if len(row) > 1 else (left + right - total) / 2
            for k, (text, size, w) in enumerate(row):
                # contorno = primeira e última frase da linha + linhas das pontas
                edge = k in (0, len(row) - 1) or n < 2 or n >= len(ys) - 2
                items.append((x + w / 2, y, text, size,
                              rng.choice(COLORS), edge))
                x += w + gap
    return items, row_h


# ---------- ORDEM E TEMPO DE APARIÇÃO ----------
def schedule(items, row_h):
    """Contorno primeiro (girando no sentido horário a partir do topo),
    depois o miolo, mais ou menos de cima para baixo."""
    outline = [it for it in items if it[5]]
    inside = [it for it in items if not it[5]]
    # ângulo medido a partir do topo, no sentido horário
    outline.sort(key=lambda it: m.atan2(it[0], it[1]) % (2 * m.pi))
    # de cima para baixo, com uma "bagunça" para parecer natural
    inside.sort(key=lambda it: -it[1] + rng.uniform(-2.2, 2.2) * row_h)

    plan = []
    for i, it in enumerate(outline):
        plan.append((i * OUTLINE_DELAY, it))
    base = len(outline) * OUTLINE_DELAY + 20
    for j, it in enumerate(inside):
        plan.append((base + j * INTERIOR_DELAY, it))
    return plan


PLAN = schedule(*build_items())


# ---------- ANIMAÇÃO (cada frase surge brilhando e esmaece até o vermelho) ----------
def to_rgb(hexcolor):
    return tuple(int(hexcolor[i:i + 2], 16) for i in (1, 3, 5))


def mix(c1, c2, f):
    f = max(0.0, min(1.0, f))
    return "#%02x%02x%02x" % tuple(round(a + (b - a) * f) for a, b in zip(c1, c2))


BG_RGB = to_rgb(BG)
RISE = 4                    # quadros para "acender" até o brilho

frame = 0
nxt = 0                     # próxima frase do PLAN a aparecer
active = []                 # frases ainda esmaecendo: [id, quadro_inicial, cor]


def color_at(age, target):
    if age < RISE:
        return mix(BG_RGB, FLASH, age / RISE)
    return mix(FLASH, target, (age - RISE) / (FADE_FRAMES - RISE))


def tick():
    global frame, nxt
    while nxt < len(PLAN) and PLAN[nxt][0] <= frame:
        x, y, text, size, color, _ = PLAN[nxt][1]
        # no canvas do tkinter o eixo Y cresce para baixo, por isso -y
        item_id = cv.create_text(x, -y, text=text, fill=BG,
                                 font=font_for(size))
        active.append([item_id, frame, to_rgb(color)])
        nxt += 1

    for a in active[:]:
        age = frame - a[1]
        cv.itemconfigure(a[0], fill=color_at(age, a[2]))
        if age >= FADE_FRAMES:
            active.remove(a)

    s.update()
    frame += 1
    if nxt < len(PLAN) or active:
        s.ontimer(tick, 16)


tick()
s.mainloop()