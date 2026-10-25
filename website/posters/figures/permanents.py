"""Constrained permanents: real critical points of the 3 x 3 permanent on fibers of fixed row and column sums.

On a fiber X = X0 + sum t_i B_i (B_i a basis of the 4-dimensional space of matrices with zero row and column
sums), the critical equations grad_t per = 0 are four quadratics in four unknowns, so there are at most 16
solutions. We find all 16 by total-degree homotopy continuation and count the real ones, for random positive
marginals. The paper proves at least 4 real points in every nondegenerate fiber (topological degree 4).
"""
import itertools

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, MONO_MED, WIDTH, clean, kicker, mono_ticks, save

rng = np.random.default_rng(3)
PERMS = list(itertools.permutations(range(3)))
# basis of 3x3 matrices with zero row and column sums
B = []
for i, j in [(0, 0), (0, 1), (1, 0), (1, 1)]:
    E = np.zeros((3, 3))
    E[i, j], E[i, 2], E[2, j], E[2, 2] = 1, -1, -1, 1
    B.append(E)
B = np.array(B)  # (4, 3, 3)


def grad_X(X):
    G = np.zeros((3, 3), dtype=X.dtype)
    for i in range(3):
        for j in range(3):
            r = [k for k in range(3) if k != i]
            c = [k for k in range(3) if k != j]
            G[i, j] = X[r[0], c[0]] * X[r[1], c[1]] + X[r[0], c[1]] * X[r[1], c[0]]
    return G


def hess_X(X):
    H = np.zeros((3, 3, 3, 3), dtype=X.dtype)
    for i, j, k, l in itertools.product(range(3), repeat=4):
        if i != k and j != l:
            m, n = 3 - i - k, 3 - j - l
            H[i, j, k, l] = X[m, n]
    return H


def F(t, X0):
    X = X0 + np.tensordot(t, B, 1)
    return np.einsum("aij,ij->a", B, grad_X(X))


def J(t, X0):
    X = X0 + np.tensordot(t, B, 1)
    return np.einsum("aij,ijkl,bkl->ab", B, hess_X(X), B)


def solve_all(X0):
    """All 16 critical points by total-degree homotopy with the gamma trick."""
    gamma = np.exp(2j * np.pi * rng.random())
    starts = [np.array(s, dtype=complex) for s in itertools.product([1, -1], repeat=4)]
    G = lambda t: t**2 - 1
    JG = lambda t: np.diag(2 * t)
    sols = []
    for t in starts:
        s, ds = 0.0, 0.02
        while s < 1:
            ds = min(ds, 1 - s)
            # predictor: dt/ds = -H_t^{-1} H_s
            Ht = (1 - s) * gamma * JG(t) + s * J(t, X0)
            Hs = -gamma * G(t) + F(t, X0)
            try:
                t1 = t + ds * np.linalg.solve(Ht, -Hs)
            except np.linalg.LinAlgError:
                break
            s1 = s + ds
            ok = False
            for _ in range(6):  # corrector
                H = (1 - s1) * gamma * G(t1) + s1 * F(t1, X0)
                Ht = (1 - s1) * gamma * JG(t1) + s1 * J(t1, X0)
                step = np.linalg.solve(Ht, -H)
                t1 = t1 + step
                if np.linalg.norm(step) < 1e-10 * (1 + np.linalg.norm(t1)):
                    ok = True
                    break
            if ok:
                t, s = t1, s1
                ds = min(ds * 1.6, 0.08)
            else:
                ds /= 2
                if ds < 1e-9:
                    break
        else:
            # polish at s = 1
            for _ in range(10):
                t = t + np.linalg.solve(J(t, X0), -F(t, X0))
            sols.append(t)
    return sols


def real_count(X0, tries=4):
    """Real critical points of one fiber. The 16 endpoints must be distinct (no path jumped), and a real root
    is one whose imaginary part vanishes and which a real Newton iteration keeps. Complex roots come in
    conjugate pairs, so the count must be even; a fiber that fails a check is solved again with a new gamma."""
    for _ in range(tries):
        sols = solve_all(X0)
        if len(sols) != 16:
            continue
        S = np.array(sols)
        dmin = min(np.linalg.norm(S[i] - S[j]) for i in range(16) for j in range(i + 1, 16))
        if dmin < 1e-6:
            continue
        scale = 1 + np.max(np.abs(S))
        reals = []
        for t in S:
            if np.max(np.abs(t.imag)) < 1e-9 * scale:
                r = t.real.copy()
                for _ in range(8):
                    r = r + np.linalg.solve(J(r, X0), -F(r, X0))
                if np.linalg.norm(F(r, X0)) < 1e-10:
                    reals.append(r)
        if len(reals) % 2 == 0:
            return 16, reals, S
    return None, [], None


import pathlib, sys
CACHE = pathlib.Path(__file__).parent / "out" / "permanents-counts.npy"
if CACHE.exists() and "--recompute" not in sys.argv:
    counts = np.load(CACHE)
else:
    counts, skipped = [], 0
    while len(counts) < 400:
        r = rng.uniform(0.2, 2.0, 3)
        c = rng.uniform(0.2, 2.0, 3)
        c *= r.sum() / c.sum()
        X0 = np.outer(r, c) / r.sum()  # a matrix with these marginals
        n_sol, reals, _ = real_count(X0)
        if n_sol is None:
            skipped += 1
            continue
        counts.append(len(reals))
    counts = np.array(counts)
    print("fibers solved:", len(counts), "set aside as ill-conditioned:", skipped, " real counts:", dict(zip(*np.unique(counts, return_counts=True))))
    assert counts.min() >= 4, "fewer than four real critical points found"

    np.save(CACHE, counts)

fig, ax = plt.subplots(figsize=(WIDTH, 9.4))
clean(ax, grid="y")
vals, freq = np.unique(counts, return_counts=True)
ax.bar(vals, freq, width=1.25, color=COL["accent"], zorder=2)
for v, f in zip(vals, freq):
    ax.text(v, f + 3, str(f), ha="center", va="bottom", fontproperties=MONO_MED, fontsize=21, color=COL["ink"])
ax.plot([4, 4], [0, freq.max() * 1.05], color=COL["signal"], lw=2.6, ls=(0, (5, 4)))
kicker(ax, 3.8, freq.max() * 1.02, "proved\nminimum", color=COL["signal"], ha="right", va="top", size=17)
ax.set_xlim(1.5, 17)
ax.set_xticks(range(2, 17, 2))
ax.set_xlabel("real critical points in a fiber, of 16")
ax.set_ylabel("fibers")
ax.set_ylim(0, freq.max() * 1.15)
mono_ticks(ax)
kicker(ax, 0.0, 1.02, f"{len(counts)} random positive marginals", transform=ax.transAxes, size=17)
save(fig, "permanents-real-counts")

# One fiber in full: its 16 critical points, each drawn by one generic real linear coordinate, so the real
# points fall on the axis and the others appear as conjugate pairs.
frng = np.random.default_rng(21)
for _ in range(200):
    r = frng.uniform(0.2, 2.0, 3)
    c = frng.uniform(0.2, 2.0, 3)
    c *= r.sum() / c.sum()
    X0 = np.outer(r, c) / r.sum()
    n_sol, reals, S = real_count(X0)
    if n_sol and len(reals) == 8:
        break
assert len(reals) == 8
a = np.array([0.61, -0.37, 0.83, 0.29])
z = S @ a
isreal = np.max(np.abs(S.imag), axis=1) < 1e-9 * (1 + np.max(np.abs(S)))
print("one fiber: real", int(isreal.sum()), "of", len(z), "| row sums", np.round(r, 3), "col sums", np.round(c, 3))
fig, ax = plt.subplots(figsize=(WIDTH, 5.0))
clean(ax, left=False, bottom=False)
x0, x1 = z.real.min(), z.real.max()
pad = 0.06 * (x1 - x0)
ymax = 1.55 * np.max(np.abs(z.imag))
ax.axhline(0, color=COL["faint"], lw=1.6, zorder=1)
for w in z[~isreal]:
    if w.imag > 0:
        ax.plot([w.real, w.real], [w.imag, -w.imag], color=COL["hair"], lw=1.6, zorder=0)
ax.scatter(z[~isreal].real, z[~isreal].imag, s=150, facecolor="white", edgecolor=COL["faint"], linewidth=2.6, zorder=2)
ax.scatter(z[isreal].real, z[isreal].imag, s=260, color=COL["accent"], edgecolor="white", linewidth=2.6, zorder=3)
ax.set_xlim(x0 - pad, x1 + pad)
ax.set_ylim(-ymax, ymax)
ax.set_xticks([]); ax.set_yticks([])
kicker(ax, x0 - pad, ymax, "8 real points, on the axis", color=COL["accent"], va="top", size=17)
kicker(ax, x1 + pad, ymax, "4 conjugate pairs", color=COL["muted"], ha="right", va="top", size=17)
ax.text(x1 + pad, -0.05 * ymax, "Re", ha="right", va="top", fontproperties=MONO, fontsize=19, color=COL["muted"])
save(fig, "permanents-one-fiber")
