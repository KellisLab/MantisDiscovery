"""Sidon subsets: a planar difference set modulo 31 (checked), and where the constant in l(N) ~ c sqrt(N) stands."""
import math

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, MONO_MED, WIDTH, kicker, mono_ticks, clean, save

V, D = 31, [1, 5, 11, 24, 25, 27]
diffs = sorted((a - b) % V for a in D for b in D if a != b)
assert diffs == list(range(1, V)), "not a planar difference set"

# The difference set on the circle of residues, beside its difference table: the 30 entries a - b are the
# nonzero residues, each once. One chord and its two differences are picked out.
HI = (11, 27)
fig = plt.figure(figsize=(WIDTH, 6.55))
gs = fig.add_gridspec(1, 2, width_ratios=[1, 1.02])
ax = fig.add_subplot(gs[0])
ax.set_aspect("equal")
ax.set_anchor("W")
ax.axis("off")
ang = lambda r: math.pi / 2 - 2 * math.pi * r / V
pts = {r: (math.cos(ang(r)), math.sin(ang(r))) for r in range(V)}
t = np.linspace(0, 2 * np.pi, 400)
ax.plot(np.cos(t), np.sin(t), color=COL["hair"], lw=1.6, zorder=1)
for i, a in enumerate(D):
    for b in D[i + 1:]:
        (x0, y0), (x1, y1) = pts[a], pts[b]
        hi = {a, b} == set(HI)
        ax.plot([x0, x1], [y0, y1], color=COL["signal"] if hi else COL["accent"], lw=3.4 if hi else 2.2,
                alpha=1 if hi else 0.42, zorder=3 if hi else 2)
for r in range(V):
    x, y = pts[r]
    if r in D:
        ax.scatter([x], [y], s=330, color=COL["accent"], edgecolor="white", linewidth=3, zorder=4)
        ax.text(1.17 * x, 1.17 * y, str(r), ha="center", va="center", fontsize=25, color=COL["ink"], fontweight="semibold")
    else:
        ax.scatter([x], [y], s=34, color=COL["light"], zorder=3)
        ax.text(1.13 * x, 1.13 * y, str(r), ha="center", va="center", fontproperties=MONO, fontsize=15, color=COL["faint"])
ax.set_xlim(-1.27, 1.27)
ax.set_ylim(-1.24, 1.24)

tb = fig.add_subplot(gs[1])
tb.set_aspect("equal")
tb.set_anchor("E")
tb.axis("off")
n = len(D)
tb.set_xlim(-0.05, n + 1.05)
tb.set_ylim(-0.05, n + 1.62)
top = n  # header row sits at y = n
for j in range(n + 1):
    tb.plot([0, n + 1], [n - j + 0.0, n - j + 0.0], color=COL["hair"], lw=1.4, zorder=0) if j else None
tb.plot([1, 1], [0, n + 1], color=COL["light"], lw=1.6)
tb.plot([0, n + 1], [n, n], color=COL["light"], lw=1.6)
tb.text(0.5, n + 0.5, "$a - b$", ha="center", va="center", fontsize=23, color=COL["muted"])
for j, b in enumerate(D):
    tb.text(j + 1.5, n + 0.5, str(b), ha="center", va="center", fontsize=23, color=COL["accent"], fontweight="semibold")
for i, a in enumerate(D):
    yc = n - i - 0.5
    tb.text(0.5, yc, str(a), ha="center", va="center", fontsize=23, color=COL["accent"], fontweight="semibold")
    for j, b in enumerate(D):
        xc = j + 1.5
        if a == b:
            tb.scatter([xc], [yc], s=16, color=COL["light"], zorder=2)
            continue
        hi = {a, b} == set(HI)
        if hi:
            tb.add_patch(plt.Rectangle((xc - 0.5, yc - 0.5), 1, 1, color=COL["signal"], alpha=0.12, lw=0, zorder=0))
        tb.text(xc, yc, str((a - b) % V), ha="center", va="center", fontproperties=MONO_MED if hi else MONO, fontsize=22,
                color=COL["signal"] if hi else COL["ink"])
kicker(tb, 0, n + 1.22, "differences mod 31", size=17)
save(fig, "sidon-difference-set")

prev, ours = 1 / (3 * math.sqrt(3)), 2 / (3 * math.sqrt(3))
fig, ax = plt.subplots(figsize=(WIDTH, 7.2))
ax.set_xlim(0, 1.08)
ax.set_ylim(-0.25, 2.5)
clean(ax, left=False)
ax.set_yticks([])
ax.set_xticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
mono_ticks(ax)
ax.set_xlabel(r"constant $c$ in $\ell(N) \approx c\sqrt{N}$")
ax.fill_between([ours, 1.0], 0, 1.05, color=COL["pale"], lw=0, zorder=0)
ax.text((ours + 1) / 2, 0.52, "open", ha="center", va="center", color=COL["accent"], fontsize=30, fontweight="medium")
for x, k, v, col in [(prev, "earlier", "0.192", COL["faint"]), (ours, "ours", "0.385", COL["accent"]), (1.0, "upper limit", "1", COL["ink"])]:
    ax.plot([x, x], [0, 1.25], color=col, lw=4, solid_capstyle="butt")
    ax.text(x, 1.42, v, ha="center", va="bottom", fontsize=27, color=col, fontweight="semibold")
    kicker(ax, x, 1.98, k, color=col, ha="center", size=17)
save(fig, "sidon-constant")
print("sidon ok")
