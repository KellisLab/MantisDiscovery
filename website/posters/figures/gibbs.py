"""Relative covariance: an estimate with small absolute error can be far off in a direction of small variance."""
import matplotlib.pyplot as plt
import numpy as np

from style import COL, WIDTH, clean, kicker, mono_ticks, save

theta = np.deg2rad(24)
R = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
true = R @ np.diag([1.0, 0.01]) @ R.T
est = R @ np.diag([1.0, 0.03]) @ R.T
t = np.linspace(0, 2 * np.pi, 400)
circle = np.vstack([np.cos(t), np.sin(t)])

def ellipse(S):
    w, V = np.linalg.eigh(S)
    return V @ np.diag(np.sqrt(w)) @ circle

fig = plt.figure(figsize=(WIDTH, 5.0))
gs = fig.add_gridspec(1, 2, width_ratios=[1.5, 1])
ax = fig.add_subplot(gs[0])
ax.set_aspect("equal")
ax.set_anchor("W")
ax.axis("off")
major = R @ np.array([1.2, 0]); minor = R @ np.array([0, 0.36])
ax.plot([-major[0], major[0]], [-major[1], major[1]], color=COL["hair"], lw=1.6)
ax.plot([-minor[0], minor[0]], [-minor[1], minor[1]], color=COL["hair"], lw=1.6)
e1, e2 = ellipse(true), ellipse(est)
ax.fill(e2[0], e2[1], color=COL["signal"], alpha=0.07, lw=0)
ax.plot(e2[0], e2[1], color=COL["signal"], lw=3.6, ls=(0, (7, 5)))
ax.plot(e1[0], e1[1], color=COL["accent"], lw=4)
ax.annotate("true covariance", xy=(0.55, 0.30), xytext=(0.15, 0.78), fontsize=24, color=COL["accent"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("estimate", xy=(-0.42, -0.08), xytext=(-0.95, 0.42), fontsize=24, color=COL["signal"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(-1.15, 1.15)
ax.set_ylim(-0.62, 0.92)

# the variance along each axis, true and estimated, on a log scale
vt, ve = np.linalg.eigvalsh(true)[::-1], np.linalg.eigvalsh(est)[::-1]
bx = fig.add_subplot(gs[1])
clean(bx, left=False, grid="x")
bx.set_xscale("log")
bx.set_xlim(0.004, 3)
bx.set_ylim(-0.85, 1.75)
for yy, a, b, name in [(1, vt[0], ve[0], "long axis"), (0, vt[1], ve[1], "thin axis")]:
    bx.plot([a, b], [yy, yy], color=COL["light"], lw=3, zorder=1)
    bx.scatter([b], [yy], s=260, facecolor="white", edgecolor=COL["signal"], linewidth=3.4, zorder=3)
    bx.scatter([a], [yy], s=150, color=COL["accent"], zorder=4)
    kicker(bx, 0.0045, yy + 0.28, name, size=16, color=COL["text"])
    r = b / a
    bx.text(max(a, b) * 1.7, yy, "same" if abs(r - 1) < 1e-6 else f"{r:.0f}\u00d7 too large", va="center", fontsize=21,
            color=COL["muted"] if abs(r - 1) < 1e-6 else COL["signal"], fontweight="medium")
    if yy == 0:
        bx.text(a, yy - 0.3, "true", ha="center", va="top", fontsize=18, color=COL["accent"])
        bx.text(b * 1.12, yy - 0.3, "estimate", ha="left", va="top", fontsize=18, color=COL["signal"])
bx.set_yticks([])
bx.set_xticks([0.01, 0.1, 1])
bx.set_xticklabels(["0.01", "0.1", "1"])
bx.set_xlabel("variance")
mono_ticks(bx)
save(fig, "gibbs-ellipses")
print("gibbs ok")

# A toy model (not from the paper): the eight corners of a cube, with energies chosen so that one corner adds
# no new direction. As beta grows the covariance's eigenvalues fall at the energies where the affine span of
# the sublevel set {E <= e} gains a dimension (energies measured from the minimum).
corners = {(0, 0, 0): 0.0, (1, 0, 0): 1.0, (1, 1, 0): 1.6, (0, 1, 0): 2.2, (0, 0, 1): 3.0, (1, 0, 1): 3.4,
           (0, 1, 1): 3.8, (1, 1, 1): 4.4}
P = np.array(list(corners), dtype=float)
E = np.array(list(corners.values()))
order = np.argsort(E)
grows, dims = [], []
for k in range(1, len(order) + 1):
    Q = P[order[:k]]
    d = np.linalg.matrix_rank(Q[1:] - Q[0]) if k > 1 else 0
    if dims and d > dims[-1]:
        grows.append(E[order[k - 1]])
    dims.append(d)
print("span grows at energies", grows)
betas = np.linspace(0, 10, 300)
eig = []
for b in betas:
    w = np.exp(-b * (E - E.min())); w /= w.sum()
    m = w @ P
    C = (P - m).T @ ((P - m) * w[:, None])
    eig.append(np.sort(np.linalg.eigvalsh(C))[::-1])
eig = np.array(eig)
# the observed decay rates at large beta match the energies where the span grows
rates = -(np.log(eig[-1]) - np.log(eig[-40])) / (betas[-1] - betas[-40])
print("observed rates", np.round(rates, 3))
assert np.allclose(rates, grows, atol=0.02), (rates, grows)

fig = plt.figure(figsize=(WIDTH, 6.2))
gs = fig.add_gridspec(1, 2, width_ratios=[0.8, 1.2])
cx = fig.add_subplot(gs[0])
cx.set_aspect("equal")
cx.set_anchor("W")
cx.axis("off")
proj = lambda p: (p[0] + 0.5 * p[1], p[2] + 0.36 * p[1])
for a in P:
    for b in P:
        if np.sum(np.abs(a - b)) == 1 and tuple(a) < tuple(b):
            (x0, y0), (x1, y1) = proj(a), proj(b)
            cx.plot([x0, x1], [y0, y1], color=COL["light"], lw=1.6, zorder=1)
face = [proj(p) for p in [(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)]]
cx.fill([q[0] for q in face], [q[1] for q in face], color=COL["pale"], zorder=0)
(x0, y0), (x1, y1) = proj((0, 0, 0)), proj((1, 0, 0))
cx.plot([x0, x1], [y0, y1], color=COL["accent"], lw=5, zorder=2, solid_capstyle="round")
# where each corner's energy sits: (dx, dy, ha, va)
place = {(0, 0, 0): (-0.06, -0.07, "right", "top"), (1, 0, 0): (0.06, -0.07, "left", "top"),
         (1, 1, 0): (0.07, 0, "left", "center"), (0, 1, 0): (-0.05, 0.06, "right", "bottom"),
         (0, 0, 1): (-0.07, 0, "right", "center"), (1, 0, 1): (0.06, -0.06, "left", "top"),
         (0, 1, 1): (-0.05, 0.06, "right", "bottom"), (1, 1, 1): (0.05, 0.06, "left", "bottom")}
for p, e in corners.items():
    x, y = proj(p)
    new = e in grows or e == 0
    cx.scatter([x], [y], s=200 if new else 110, color=COL["accent"] if new else COL["faint"], edgecolor="white", linewidth=2.4, zorder=4)
    dx, dy, ha, va = place[p]
    cx.text(x + dx, y + dy, f"{e:g}", ha=ha, va=va, fontsize=22, color=COL["ink"] if new else COL["muted"],
            fontweight="semibold" if new else "regular")
cx.set_xlim(-0.42, 1.95)
cx.set_ylim(-0.36, 1.86)
kicker(cx, -0.42, 1.86, "energy at each corner", va="top", size=16)

ex = fig.add_subplot(gs[1])
clean(ex, grid="y")
cols = [COL["accent"], COL["accent2"], COL["faint"]]
for j in range(3):
    ex.semilogy(betas, eig[:, j], color=cols[j], lw=4, zorder=3)
    c0 = eig[-1, j] * np.exp(grows[j] * betas[-1])
    bb = betas[betas >= 2.5]
    ex.semilogy(bb, c0 * np.exp(-grows[j] * bb), color=COL["ink"], lw=1.8, ls=(0, (4, 4)), alpha=0.6, zorder=4)
    ex.text(betas[-1] + 0.25, eig[-1, j], f"rate {grows[j]:g}", va="center", fontsize=22, color=cols[j], fontweight="medium")
ex.set_xlim(0, 12.2)
ex.set_ylim(1e-14, 2)
ex.set_xticks([0, 2, 4, 6, 8, 10])
ex.set_yticks([1, 1e-4, 1e-8, 1e-12])
ex.set_yticklabels(["1", "$10^{-4}$", "$10^{-8}$", "$10^{-12}$"])
ex.set_xlabel(r"inverse temperature $\beta$")
ex.set_ylabel("covariance eigenvalues")
kicker(ex, 0.0, 1.02, "dashed: slope set by the energy", transform=ex.transAxes, size=16)
mono_ticks(ex)
save(fig, "gibbs-toy")
