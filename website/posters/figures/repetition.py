"""Repetition under a deadline: the order of the history memory exact monitoring needs, as capacity H grows,
for N = 8 vertices. Zero when H <= 2k - 2, else min{N log k, log C(N + S, S)} bits with S = H - 2k + 2
(constants omitted; the cases k = 2, H in {3, 4} need exactly one bit)."""
from math import comb, log2

import matplotlib.pyplot as plt

from style import COL, MONO, WIDTH, clean, kicker, mono_ticks, save

N = 8
fig, ax = plt.subplots(figsize=(WIDTH, 8.2))
clean(ax, grid="y")
for k, col in [(3, COL["accent"]), (6, COL["accent2"]), (12, COL["faint"])]:
    Hs = list(range(0, 61))
    vals = [0 if H <= 2 * k - 2 else min(N * log2(k), log2(comb(N + max(0, H - 2 * k + 2), max(0, H - 2 * k + 2)))) for H in Hs]
    ax.plot(Hs, vals, color=col, lw=4)
    ax.plot([2 * k - 2] * 2, [0, 3.2], color=col, lw=2.6, ls=(0, (1, 2.4)))
    ax.text(61, vals[-1], f"k = {k}", va="center", fontsize=24, color=col, fontweight="medium")
ax.set_xlim(0, 67)
ax.set_xlabel("capacity $H$")
ax.set_ylabel("memory needed, bits")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "order of the bound, N = 8", transform=ax.transAxes, size=17)
save(fig, "repetition-memory")
print("repetition ok")

# The same bound over the whole (H, k) plane, N = 8. Below the line H = 2k - 2 nothing needs remembering.
from matplotlib.colors import LinearSegmentedColormap

def bits(H, k):
    if H <= 2 * k - 2:
        return 0.0
    if k == 2 and H in (3, 4):
        return 1.0
    S = H - 2 * k + 2
    return min(N * log2(k), log2(comb(N + S, S)))

Hs, ks = list(range(0, 61)), list(range(2, 17))
Z = [[bits(H, k) for H in Hs] for k in ks]
import numpy as np
Z = np.array(Z)
Zm = np.ma.masked_where(Z == 0, Z)
cmap = LinearSegmentedColormap.from_list("md", [COL["pale"], COL["accent2"], COL["accent"], "#16244F"])
fig, ax = plt.subplots(figsize=(WIDTH, 6.8))
clean(ax)
mesh = ax.pcolormesh(np.arange(-0.5, 61), np.arange(1.5, 17), Zm, cmap=cmap, vmin=0, vmax=Z.max(), shading="flat", rasterized=True)
kk = np.linspace(1.5, 16.5, 50)
ax.plot(2 * kk - 2, kk, color=COL["ink"], lw=2.2)
ax.text(2.5, 15.2, "no memory\nneeded", fontsize=24, color=COL["muted"], linespacing=1.15, va="top")
ax.text(15.2, 9.4, "$H = 2k - 2$", fontsize=24, color=COL["ink"], ha="center", va="bottom", rotation=np.degrees(np.arctan2(1, 2)),
        transform_rotates_text=True, rotation_mode="anchor")
for k in (3, 6, 12):
    ax.plot([2 * k - 1.5, 60.5], [k, k], color="white", lw=1.6, ls=(0, (3, 4)), alpha=0.9)
ax.set_xlim(-0.5, 60.5)
ax.set_ylim(1.5, 16.5)
ax.set_xticks([0, 10, 20, 30, 40, 50, 60])
ax.set_yticks([2, 4, 6, 8, 10, 12, 14, 16])
ax.set_xlabel("capacity $H$")
ax.set_ylabel("threshold $k$")
mono_ticks(ax)
cb = fig.colorbar(mesh, ax=ax, location="right", shrink=0.86, aspect=22, pad=0.02)
cb.outline.set_visible(False)
cb.ax.tick_params(length=0)
for lab in cb.ax.get_yticklabels():
    lab.set_fontproperties(MONO); lab.set_fontsize(19)
cb.set_label("bits, order of the bound", fontsize=22, labelpad=12)
kicker(ax, 0.0, 1.02, "N = 8; dashed rows are the three slices in figure 1", transform=ax.transAxes, size=16)
save(fig, "repetition-map")
