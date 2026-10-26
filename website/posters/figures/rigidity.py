"""Homogeneous integer optimization: when rounding the real optimum fails, and the law of the correction.

  rounding: m(n) = min{x^3 + y^3 : 2x + 3y = n, x, y >= 0 integers}. Rounding the real optimum to the
            nearest integer point is exact except on a set that grows like log n. We find the failures
            by exhaustive search and compare the count with 2 log N / log(5 + 2 sqrt 6).
  law:      the scaled correction E(n) = (m(n) - n^3/A^2)/n for two weight pairs. For g = (2,3) the real
            optimum is irrational and E has a continuous law; for g = (1,4) it is rational with period 9
            and E takes five values.
"""
from math import isqrt, log, sqrt

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, MONO_MED, WIDTH, clean, kicker, mono_ticks, save


def cubic_min(g, n):
    """min of sum z_i^3 over nonnegative integers with g . z = n, for two weights."""
    a, b = g
    best = None
    for y in range(n // b + 1):
        r = n - b * y
        if r % a:
            continue
        v = (r // a) ** 3 + y ** 3
        if best is None or v < best:
            best = v
    return best


# The real optimum for g = (2,3) puts a fraction theta of n into the first coordinate.
THETA = (5 + sqrt(6)) / 19
NMAX = 20000
fails, losses = [], []
for n in range(18, NMAX + 1):
    t = (10 * n + 19 + isqrt(24 * n * n)) // 38  # nint(n theta), exactly, in integers
    x, y = 3 * t - n, n - 2 * t
    rounded = x ** 3 + y ** 3 if x >= 0 and y >= 0 else None
    exact = min(v for v in (((3 * s - n) ** 3 + (n - 2 * s) ** 3) for s in range(max(0, t - 3), t + 4)
                            if 3 * s - n >= 0 and n - 2 * s >= 0))
    if rounded is None or rounded > exact:
        fails.append(n)
        losses.append(rounded - exact)
print("rounding failures up to", NMAX, ":", fails)
assert fails[:4] == [37, 88, 366, 871], "failure set is off"
assert set(losses) == {1}, "every failure should cost exactly 1"
for n in (37, 88):
    assert cubic_min((2, 3), n) == (854 if n == 37 else 10744), "exact minimum is off"

fig, ax = plt.subplots(figsize=(WIDTH, 7.0))
clean(ax, grid="y")
xs = np.array(fails, dtype=float)
ax.step(np.concatenate([[18], xs]), np.arange(len(xs) + 1), where="post", color=COL["accent"], lw=4, zorder=3)
Ns = np.logspace(log(18, 10), log(NMAX, 10), 200)
ax.plot(Ns, 2 * np.log(Ns) / log(5 + 2 * sqrt(6)) - 2.52, color=COL["ink"], lw=2, ls=(0, (5, 4)), zorder=2)
ax.scatter(xs, np.arange(1, len(xs) + 1), s=170, color=COL["accent"], edgecolor="white", linewidth=2.6, zorder=4)
for n, k in zip(fails[:2], [1, 2]):
    ax.annotate(f"$n = {n}$", xy=(n, k), xytext=(n * 1.25, k - 1.25), fontsize=22, color=COL["signal"],
                fontweight="medium", arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.text(NMAX * 1.1, 2 * log(NMAX) / log(5 + 2 * sqrt(6)) - 2.52, "predicted\nrate", va="center", fontsize=21,
        color=COL["ink"], linespacing=1.15)
ax.set_xscale("log")
ax.set_xlim(16, NMAX * 3.2)
ax.set_ylim(-0.6, len(xs) + 0.8)
ax.set_yticks(range(0, len(xs) + 1, 2))
ax.set_xlabel("scale $n$")
ax.set_ylabel("failures up to $n$")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "every failure costs exactly 1", transform=ax.transAxes, size=16)
save(fig, "rigidity-rounding")

# The scaled correction, for an irrational and a rational real optimum. For weights 1 and 4 the real
# optimum is rational with period 9, and the minimum is exactly n^3/81 + B(r)n + C(r) on each class
# r = n mod 9, so the correction tends to five values. For weights 2 and 3 it is irrational.
def dist_to_int(t):
    return abs(t - round(t))


B_EXACT = [6 * dist_to_int(2 * r / 9) ** 2 for r in range(9)]
for r in range(9):
    sample = [(cubic_min((1, 4), n) - n ** 3 / 81) / n for n in range(900 + r, 2000, 9)]
    drift = [sample[i] - B_EXACT[r] for i in range(len(sample))]
    assert max(abs(d) for d in drift) < 0.01, ("class %d does not settle" % r, drift[:3])
atoms = sorted(set(round(b, 9) for b in B_EXACT))
print("weights 1 and 4: five limiting values", [round(a, 4) for a in atoms])
assert len(atoms) == 5 and abs(atoms[-1] - 32 / 27) < 1e-9, "the limiting values are off"

fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 6.6))
fig.get_layout_engine().set(wspace=0.09)
LO, HI = 400, 4000
for ax, g, name, note, col in [(axs[0], (2, 3), "weights 2 and 3", "a continuum", COL["accent"]),
                               (axs[1], (1, 4), "weights 1 and 4", "five values", COL["signal"])]:
    A = sum(w ** 1.5 for w in g)
    E = np.array([(cubic_min(g, n) - n ** 3 / A ** 2) / n for n in range(LO, HI + 1)])
    clean(ax, grid="y")
    ax.hist(E, bins=90, color=COL["accent"], zorder=2)
    ax.set_xlabel("scaled correction")
    ax.set_yticks([])
    mono_ticks(ax)
    kicker(ax, 0.0, 1.03, name, transform=ax.transAxes, size=17, color=COL["text"])
    ax.text(0.97, 0.92, note, transform=ax.transAxes, ha="right", va="top", fontsize=23, color=col, fontweight="medium")
axs[0].set_ylabel("how often")
save(fig, "rigidity-law")
print("rigidity ok")

# Why "eventually quasipolynomial" is the right phrase: with weights 1 and 4 the real optimum is rational
# with period 9, so the minimum settles onto nine straight lines, one per residue class.
fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
ns = np.arange(200, 401)
resid = np.array([cubic_min((1, 4), int(n)) - n ** 3 / 81 for n in ns])
for r in range(9):
    m = ns % 9 == r
    col = COL["accent"] if r in (0, 3, 6) else (COL["accent2"] if r in (1, 4, 7) else COL["faint"])
    ax.plot(ns[m], resid[m], color=col, lw=3, zorder=3)
    coef = np.polyfit(ns[m], resid[m], 1)
    assert np.max(np.abs(np.polyval(coef, ns[m]) - resid[m])) < 1e-6, f"class {r} is not a straight line"
ax.text(404, resid[ns % 9 == 2][-1], "$n \\equiv 2$", va="center", fontsize=21, color=COL["faint"])
ax.text(404, resid[ns % 9 == 0][-1], "$n \\equiv 0$", va="center", fontsize=21, color=COL["accent"],
        fontweight="medium")
print("all nine residue classes are exactly straight in n")
ax.set_xlim(200, 440)
ax.set_xticks([200, 250, 300, 350, 400])
ax.set_xlabel("scale $n$")
ax.set_ylabel("minimum, above the real one")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "weights 1 and 4: nine classes, nine lines", transform=ax.transAxes, size=16)
save(fig, "rigidity-classes")
