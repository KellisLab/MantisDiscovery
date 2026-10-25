"""Calibration limits: the paper's reductions in allocation regret, and a toy picture of bit allocation."""
import itertools

import matplotlib.pyplot as plt
import numpy as np

from style import COL, WIDTH, clean, kicker, mono_ticks, save

# The paper's numbers: output scoring against additive scalar scoring, normalized allocation regret.
fig, ax = plt.subplots(figsize=(WIDTH, 7.0))
ax.axis("off")
ax.set_xlim(0, 100)
ax.set_ylim(-0.5, 3.4)
for y, val, name, col, note, sub in [(2.0, 61.0, "round-to-nearest quantization", COL["accent"], "61.0%", None),
                                       (0.0, 6.7, "after a GPTQ update", COL["light"], "6.7%", "interval includes zero")]:
    ax.barh(y, 100, height=0.62, color=COL["hair"], left=0)
    ax.barh(y, val, height=0.62, color=col, left=0)
    kicker(ax, 0, y + 0.45, name, size=18, color=COL["text"])
    ax.text(val + 1.6, y, note, va="center", fontsize=30, color=col if col == COL["accent"] else COL["ink"], fontweight="semibold")
    if sub:
        kicker(ax, val + 13.5, y - 0.05, sub, va="center", size=16, color=COL["muted"])
save(fig, "calibration-regret")

# A toy (not from the paper): six tensors, bit widths 2, 3, 4 or 8, additive error.
rng = np.random.default_rng(4)
size = rng.integers(1, 9, 6) * 1.0
sens = rng.uniform(0.2, 2.0, 6)
pts = np.array([((size * np.array(a)).sum(), (sens * 2.0 ** (-np.array(a))).sum()) for a in itertools.product([2, 3, 4, 8], repeat=6)])
order = np.argsort(pts[:, 0])
front, best = [], np.inf
for i in order:
    if pts[i, 1] < best:
        best = pts[i, 1]
        front.append(pts[i])
front = np.array(front)
budget = np.percentile(pts[:, 0], 40)
fig, ax = plt.subplots(figsize=(WIDTH, 7.0))
clean(ax, grid="y")
ax.scatter(pts[:, 0], pts[:, 1], s=7, color=COL["light"], lw=0, zorder=1)
ax.step(front[:, 0], front[:, 1], where="post", color=COL["accent"], lw=3.6, zorder=3)
ax.axvline(budget, color=COL["faint"], lw=2.2, ls=(0, (6, 5)), zorder=2)
ok = pts[pts[:, 0] <= budget]
pick = ok[np.argmin(ok[:, 1])]
ax.scatter([pick[0]], [pick[1]], s=300, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.set_yscale("log")
ax.set_xlabel("storage, toy units")
ax.set_ylabel("error, toy model")
mono_ticks(ax)
kicker(ax, budget + 3, ax.get_ylim()[1] * 0.8, "storage budget", va="top", size=17)
ax.annotate("best within budget", xy=tuple(pick), xytext=(pick[0] - 78, pick[1] * 0.3), fontsize=23, color=COL["signal"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("best trade-offs", xy=(front[-8][0], front[-8][1]), xytext=(front[-8][0] - 70, front[-8][1] * 0.35), fontsize=23, color=COL["accent"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
save(fig, "calibration-toy")
print("calibration ok")
