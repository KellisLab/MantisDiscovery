"""Matching cofactor matrices: W_uv = pm(G - u - v), zero diagonal. We compute W exactly and its inertia
(positive, negative, zero eigenvalues) for graphs from the families in the paper.
"""
import itertools
from functools import lru_cache

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO_MED, WIDTH, clean, kicker, mono_ticks, save


def pm_counter(n, edges):
    adj = [0] * n
    for u, v in edges:
        adj[u] |= 1 << v
        adj[v] |= 1 << u

    @lru_cache(maxsize=None)
    def pm(mask):
        if mask == 0:
            return 1
        u = (mask & -mask).bit_length() - 1
        rest = mask & ~(1 << u)
        total, nb = 0, adj[u] & rest
        while nb:
            b = nb & -nb
            total += pm(rest & ~b)
            nb ^= b
        return total

    return pm


def cofactor_matrix(n, edges):
    pm = pm_counter(n, edges)
    full = (1 << n) - 1
    W = np.zeros((n, n))
    for u in range(n):
        for v in range(u + 1, n):
            W[u, v] = W[v, u] = pm(full & ~(1 << u) & ~(1 << v))
    return W


def inertia(W):
    ev = np.linalg.eigvalsh(W)
    tol = 1e-9 * max(1, np.abs(ev).max())
    return (int((ev > tol).sum()), int((ev < -tol).sum()), int((np.abs(ev) <= tol).sum())), ev


def line_graph(n, edges):
    E = [tuple(sorted(e)) for e in edges]
    L = [(i, j) for i, j in itertools.combinations(range(len(E)), 2) if set(E[i]) & set(E[j])]
    return len(E), L


def cycle(n):
    return n, [(i, (i + 1) % n) for i in range(n)]


def petersen():
    out = [(i, (i + 1) % 5) for i in range(5)] + [(5 + i, 5 + (i + 2) % 5) for i in range(5)] + [(i, i + 5) for i in range(5)]
    return 10, out


def triangular5():  # T(5) = L(K5), strongly regular, least eigenvalue -2
    return line_graph(5, list(itertools.combinations(range(5), 2)))


def lattice4():  # L2(4) = K4 x K4 rook graph, strongly regular, least eigenvalue -2
    V = [(i, j) for i in range(4) for j in range(4)]
    return 16, [(a, b) for a, b in itertools.combinations(range(16), 2) if (V[a][0] == V[b][0]) != (V[a][1] == V[b][1])]


def bridged():  # line graph of two triangles joined by a path of two bridges (8 edges, subcubic)
    base = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 5), (5, 6), (6, 4)]
    return line_graph(7, base)


graphs = [
    ("4-cycle $C_4$", cycle(4)),
    ("Petersen graph", petersen()),
    ("triangular graph $T(5)$", triangular5()),
    ("lattice graph $L_2(4)$", lattice4()),
    ("line graph, two non-pendant bridges", bridged()),
]
rows = []
for name, (n, E) in graphs:
    W = cofactor_matrix(n, E)
    (p, q, z), ev = inertia(W)
    rows.append((name, n, (p, q, z), ev / np.abs(ev).max()))
    print(f"{name:40s} n={n:2d} inertia={(p, q, z)}")

fig, ax = plt.subplots(figsize=(WIDTH, 8.2))
clean(ax, left=False)
for k, (name, n, (p, q, z), ev) in enumerate(rows):
    y = len(rows) - 1 - k
    ax.plot([-1.05, 1.05], [y, y], color=COL["hair"], lw=1.4, zorder=0)
    for e in ev:
        if e > 1e-9:
            ax.scatter([e], [y], s=230, color=COL["accent"], edgecolor="white", linewidth=2.5, zorder=4)
        elif e < -1e-9:
            ax.scatter([e], [y], s=90, color=COL["faint"], alpha=0.85, zorder=3)
        else:
            ax.scatter([e], [y], s=150, color=COL["signal"], edgecolor="white", linewidth=2, zorder=4)
    ax.text(-1.05, y + 0.28, name, ha="left", va="bottom", fontsize=22, color=COL["text"], fontweight="medium")
    ax.text(1.05, y + 0.28, f"({p}, {q}, {z})", ha="right", va="bottom", fontproperties=MONO_MED, fontsize=21, color=COL["accent"])
ax.plot([0, 0], [-0.5, len(rows) - 0.35], color=COL["faint"], lw=1.6, ls=(0, (4, 5)), zorder=1)
ax.set_xlim(-1.08, 1.08)
ax.set_ylim(-0.6, len(rows) - 0.15)
ax.set_yticks([])
ax.set_xticks([-1, -0.5, 0, 0.5, 1])
mono_ticks(ax)
ax.set_xlabel("eigenvalues of $W$, scaled by the largest")
kicker(ax, 1.0, 1.01, "inertia: positive, negative, zero", transform=ax.transAxes, ha="right", size=17)
save(fig, "cofactors-spectra")

# The five graphs, drawn. T(5) and the bridged graph are line graphs: each vertex sits at the midpoint of the
# edge of the base graph it stands for (K5, and two triangles joined by a path of two bridges).
def ring(n, r=1.0, start=90):
    return [(r * np.cos(np.deg2rad(start + 360 * i / n)), r * np.sin(np.deg2rad(start + 360 * i / n))) for i in range(n)]

def midpoints(base_pos, base_edges):
    return [((base_pos[a][0] + base_pos[b][0]) / 2, (base_pos[a][1] + base_pos[b][1]) / 2) for a, b in base_edges]

k5 = ring(5)
k5_edges = list(itertools.combinations(range(5), 2))
h_pos = [(-1.0, 0.55), (-1.0, -0.55), (-0.45, 0.0), (0.0, 0.0), (0.45, 0.0), (1.0, 0.55), (1.0, -0.55)]
h_edges = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 5), (5, 6), (6, 4)]
drawings = [
    ("$C_4$", cycle(4), [(-0.7, 0.7), (0.7, 0.7), (0.7, -0.7), (-0.7, -0.7)], None),
    ("Petersen", petersen(), ring(5) + ring(5, 0.46), None),
    ("$T(5)$", triangular5(), midpoints(k5, k5_edges), (k5, k5_edges)),
    ("$L_2(4)$", lattice4(), [(-0.9 + 0.6 * j, 0.9 - 0.6 * i) for i in range(4) for j in range(4)], None),
    ("line graph,\ntwo bridges", bridged(), midpoints(h_pos, h_edges), (h_pos, h_edges)),
]
fig, axs = plt.subplots(1, 5, figsize=(WIDTH, 3.5))
fig.get_layout_engine().set(wspace=0.02)
for ax, (name, (n, E), pos, base) in zip(axs, drawings):
    ax.set_aspect("equal")
    ax.axis("off")
    if base is not None:  # the base graph, faint, under its line graph
        bp, be = base
        for a, b in be:
            ax.plot([bp[a][0], bp[b][0]], [bp[a][1], bp[b][1]], color=COL["hair"], lw=5, zorder=0, solid_capstyle="round")
    for a, b in E:
        (x0, y0), (x1, y1) = pos[a], pos[b]
        if name == "$L_2(4)$" and abs(a - b) not in (1, 4):  # rook moves past a neighbour: draw as an arc
            t = np.linspace(0, 1, 30)
            nx, ny = -(y1 - y0), x1 - x0
            bend = 0.22
            xs = x0 + (x1 - x0) * t + nx * bend * np.sin(np.pi * t)
            ys = y0 + (y1 - y0) * t + ny * bend * np.sin(np.pi * t)
            ax.plot(xs, ys, color=COL["light"], lw=1.3, zorder=1)
        else:
            ax.plot([x0, x1], [y0, y1], color=COL["light"], lw=1.6, zorder=1)
    xy = np.array(pos)
    ax.scatter(xy[:, 0], xy[:, 1], s=70, color=COL["accent"], edgecolor="white", linewidth=1.6, zorder=3)
    ax.set_xlim(-1.25, 1.25)
    ax.set_ylim(-1.25, 1.25)
    ax.text(0, -1.42, name, ha="center", va="top", fontsize=22, color=COL["text"], fontweight="medium", linespacing=1.15)
save(fig, "cofactors-graphs")
