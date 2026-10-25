"""Boundary spectra: the undriven spectrum for the two boundary conditions, and the residual bound
nu^(1/3) + nu^(1/5) |omega|^(2/5) of the wave packets as the collision rate nu falls (constant C = 1)."""
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle

from style import COL, MONO, WIDTH, clean, kicker, mono_ticks, save

plt.rcParams["hatch.linewidth"] = 1.3
fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 5.3))
fig.get_layout_engine().set(wspace=0.08)
X, Y = 2.2, 1.5
for ax, title, half in [(axs[0], "zero inflow", True), (axs[1], "periodic boundaries", False)]:
    ax.set_xlim(-X, X)
    ax.set_ylim(-Y, Y)
    ax.set_aspect("equal")
    ax.axis("off")
    if half:
        ax.add_patch(Rectangle((-X, -Y), X, 2 * Y, facecolor=COL["pale"], edgecolor=COL["accent2"], hatch="///", lw=0, zorder=0))
    ax.plot([-X, X], [0, 0], color=COL["faint"], lw=1.4, zorder=1)
    ax.plot([0, 0], [-Y, Y], color=COL["accent"], lw=6, zorder=3, solid_capstyle="butt")
    ax.text(X - 0.05, -0.14, "Re", ha="right", va="top", fontproperties=MONO, fontsize=19, color=COL["muted"])
    ax.text(0.12, Y - 0.05, "Im", ha="left", va="top", fontproperties=MONO, fontsize=19, color=COL["muted"])
    kicker(ax, -X, Y + 0.22, title, ha="left", size=18, color=COL["text"])
save(fig, "boundary-spectra")

nu = np.logspace(-8, -1, 200)
fig, ax = plt.subplots(figsize=(WIDTH, 7.6))
clean(ax, grid="both")
for w, col in [(0.25, COL["faint"]), (1.0, COL["accent"]), (4.0, COL["accent2"])]:
    y = nu ** (1 / 3) + nu ** (1 / 5) * abs(w) ** (2 / 5)
    ax.loglog(nu, y, color=col, lw=4)
    ax.text(nu[-1] * 1.25, y[-1], rf"$|\omega| = {w:g}$", va="center", fontsize=24, color=col)
ax.set_xlim(1e-8, 1e-1 * 9)
ax.set_ylim(0.01, 3)
ax.set_xticks([1e-8, 1e-6, 1e-4, 1e-2])
ax.set_yticks([0.01, 0.1, 1])
ax.set_yticklabels(["0.01", "0.1", "1"])
ax.set_xlabel(r"collision rate $\nu$")
ax.set_ylabel("residual bound")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "with C = 1", transform=ax.transAxes, size=17)
save(fig, "boundary-residual")
print("boundary ok")
