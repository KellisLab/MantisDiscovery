"""Regression coresets: with two features and three rows, every weighted least-squares fit (positive weights)
lies in the triangle whose corners are the three two-row interpolants. We solve 3,000 random weightings."""
import itertools

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO_MED, WIDTH, clean, kicker, mono_ticks, save

rng = np.random.default_rng(7)
X = np.array([[1.0, 0.2], [0.3, 1.0], [1.0, 1.4]])
y = np.array([1.0, 0.8, 2.6])
C = np.array([np.linalg.solve(X[[i, j]], y[[i, j]]) for i, j in itertools.combinations(range(3), 2)])
fits = []
for _ in range(3000):
    w = rng.exponential(size=3) ** 2.5
    fits.append(np.linalg.lstsq(np.sqrt(w)[:, None] * X, np.sqrt(w) * y, rcond=None)[0])
fits = np.array(fits)
lam = np.linalg.solve(np.vstack([C.T, np.ones(3)]), np.vstack([fits.T, np.ones(len(fits))]))
assert (lam > -1e-9).all(), "a weighted fit left the triangle"

fig, ax = plt.subplots(figsize=(WIDTH, 8.4))
clean(ax, grid="both")
lo, hi = C.min(0) - 0.6, C.max(0) + 0.6
xs = np.linspace(lo[0], hi[0], 50)
for i in range(3):
    a, b = X[i]
    ax.plot(xs, (y[i] - a * xs) / b, color=COL["faint"], lw=2.2, zorder=1)
    cand = [(xv, (y[i] - a * xv) / b) for xv in np.linspace(hi[0] - 0.08, lo[0] + 0.08, 400)]
    xv, yv = next((q for q in cand if lo[1] + 0.15 < q[1] < hi[1] - 0.15), cand[0])
    ax.text(xv, yv + 0.07, f"ROW {i + 1}", fontproperties=MONO_MED, fontsize=17, color=COL["muted"], ha="right", va="bottom")
tri = np.vstack([C, C[:1]])
ax.fill(tri[:, 0], tri[:, 1], color=COL["pale"], zorder=0)
ax.scatter(fits[:, 0], fits[:, 1], s=9, color=COL["accent2"], alpha=0.45, lw=0, zorder=2)
ax.plot(tri[:, 0], tri[:, 1], color=COL["accent"], lw=3.2, zorder=3)
ax.scatter(C[:, 0], C[:, 1], s=260, color=COL["accent"], edgecolor="white", linewidth=3, zorder=4)
ax.set_xlim(lo[0], hi[0])
ax.set_ylim(lo[1], hi[1])
ax.set_xlabel(r"coefficient $\beta_1$")
ax.set_ylabel(r"coefficient $\beta_2$")
mono_ticks(ax)
save(fig, "coresets-triangle")
print("coresets ok: all", len(fits), "fits inside")

# The ridge path. In two dimensions the Krylov subspace of the covariance and the cross moment is the whole
# plane, so a weighted subset keeps the full ridge path exactly when it matches both moments. We find such a
# subset (five rows, by a linear program) and compare it with five rows weighted equally.
from scipy.optimize import linprog

rng = np.random.default_rng(12)
n = 40
Xr = rng.normal(size=(n, 2)) @ np.array([[1.0, 0.0], [0.75, 0.55]])
yr = Xr @ np.array([1.6, -0.9]) + 0.5 * rng.normal(size=n)
A = np.vstack([Xr[:, 0] ** 2, Xr[:, 0] * Xr[:, 1], Xr[:, 1] ** 2, Xr[:, 0] * yr, Xr[:, 1] * yr])
res = linprog(rng.uniform(1, 2, n), A_eq=A, b_eq=A.sum(1), bounds=(0, None), method="highs")
assert res.success
w = res.x
S = np.flatnonzero(w > 1e-9)
print("matched subset rows:", len(S))
lams = np.logspace(-2, 3.2, 160)
path = lambda XX, Xy: np.array([np.linalg.solve(XX + l * np.eye(2), Xy) for l in lams])
full = path(Xr.T @ Xr, Xr.T @ yr)
Xs, ys, ws = Xr[S], yr[S], w[S]
matched = path(Xs.T @ (ws[:, None] * Xs), Xs.T @ (ws * ys))
assert np.allclose(full, matched, atol=1e-8)
pick = rng.choice(n, len(S), replace=False)
Xe, ye = Xr[pick], yr[pick]
equal = path((n / len(S)) * Xe.T @ Xe, (n / len(S)) * Xe.T @ ye)

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
for j, col in [(0, COL["accent"]), (1, COL["accent2"])]:
    ax.semilogx(lams, equal[:, j], color=COL["faint"], lw=2.4, ls=(0, (6, 5)), zorder=1)
    ax.semilogx(lams, full[:, j], color=col, lw=4.4, zorder=2)
    mk = slice(8, None, 18)
    ax.scatter(lams[mk], matched[mk, j], s=150, facecolor="white", edgecolor=COL["signal"], linewidth=2.6, zorder=3)
    ax.text(lams[0] * 0.8, full[0, j], rf"$\beta_{j + 1}$", ha="right", va="center", fontsize=28, color=col)
ax.axhline(0, color=COL["faint"], lw=1.4, zorder=0)
ax.set_xlim(lams[0] * 0.25, lams[-1])
ax.set_xlabel(r"ridge parameter $\lambda$")
ax.set_ylabel("coefficient")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "solid: all 40 rows   rings: 5 matched rows   dashed: 5 rows, equal weights", transform=ax.transAxes, size=15)
save(fig, "coresets-ridge")
