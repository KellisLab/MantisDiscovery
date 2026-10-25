"""Certified compression: storage for 26 complete pawnless chess classes, ours against the published Syzygy
WDL/DTZ inventory for the same classes (derived from the paper's 61.64% reduction)."""
import matplotlib.pyplot as plt

from style import COL, WIDTH, kicker, save

ours = 7_585_632
syzygy = ours / (1 - 0.6164)
fig, ax = plt.subplots(figsize=(WIDTH, 6.8))
ax.axis("off")
ax.set_xlim(0, 27)
ax.set_ylim(-0.75, 3.15)
for y, val, name, col, note in [(2.0, syzygy / 1e6, "Syzygy WDL/DTZ files", COL["light"], f"about {syzygy / 1e6:.1f} MB"),
                                  (0.0, ours / 1e6, "certified partial tables", COL["accent"], f"{ours / 1e6:.2f} MB")]:
    ax.barh(y, val, height=0.62, color=col, left=0)
    kicker(ax, 0, y + 0.45, name, size=18, color=COL["text"])
    ax.text(val + 0.4, y, note, va="center", fontsize=28, color=COL["ink"] if col != COL["accent"] else COL["accent"], fontweight="semibold")
kicker(ax, ours / 1e6 + 0.4, -0.62, "61.64% less", color=COL["accent"], size=18)
save(fig, "certified-storage")
print("certified ok")

# One small class in full: king and rook against king, solved by krvk.py (retrograde analysis).
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

from style import MONO, OUT, clean, mono_ticks

d = np.load(OUT / "krvk.npz")
dtm, legal = d["dtm"], d["legal"]
moves = dtm[legal]
counts = np.bincount(moves, minlength=17)[1:]
print("KRvK, White to move:", int(legal.sum()), "positions; longest", int(moves.max()), "moves")
bk = np.arange(64 ** 3) % 64
mean_by_bk = np.array([dtm[legal & (bk == s)].mean() for s in range(64)]).reshape(8, 8)  # [rank, file]
print("average by Black king square: corner %.2f, centre %.2f" % (mean_by_bk[0, 0], mean_by_bk[3:5, 3:5].mean()))

fig = plt.figure(figsize=(WIDTH, 6.0))
gs = fig.add_gridspec(1, 2, width_ratios=[1.3, 1])
hx = fig.add_subplot(gs[0])
clean(hx, grid="y")
hx.bar(np.arange(1, 17), counts / 1000, width=0.72, color=COL["accent"], zorder=2)
hx.set_xticks([1, 4, 8, 12, 16])
hx.set_xlim(0.3, 16.7)
hx.set_xlabel("moves to mate")
hx.set_ylabel("positions, thousands")
mono_ticks(hx)
kicker(hx, 0.0, 1.03, f"White to move: {int(legal.sum()):,} positions", transform=hx.transAxes, size=16)
bx = fig.add_subplot(gs[1])
bx.set_aspect("equal")
bx.set_anchor("E")
cmap = LinearSegmentedColormap.from_list("md", [COL["pale"], COL["accent2"], COL["accent"], "#16244F"])
im = bx.imshow(mean_by_bk, origin="lower", cmap=cmap, extent=(-0.5, 7.5, -0.5, 7.5))
for s in range(9):
    bx.plot([s - 0.5, s - 0.5], [-0.5, 7.5], color="white", lw=1.2)
    bx.plot([-0.5, 7.5], [s - 0.5, s - 0.5], color="white", lw=1.2)
bx.set_xticks(range(8))
bx.set_xticklabels(list("abcdefgh"))
bx.set_yticks(range(8))
bx.set_yticklabels([str(i) for i in range(1, 9)])
for sp in bx.spines.values():
    sp.set_visible(False)
mono_ticks(bx)
cb = fig.colorbar(im, ax=bx, location="right", shrink=0.92, aspect=18, pad=0.03)
cb.outline.set_visible(False)
cb.ax.tick_params(length=0)
for lab in cb.ax.get_yticklabels():
    lab.set_fontproperties(MONO); lab.set_fontsize(19)
kicker(bx, -0.5, 7.5 + 0.35, "average, by Black king square", va="bottom", size=16)
save(fig, "certified-krvk")
