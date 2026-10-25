"""Log-Sobolev: a density with a small far bump carried by the Ornstein-Uhlenbeck flow toward the standard
Gaussian. A Gaussian mixture stays a mixture under the flow: mean m e^-t, variance s^2 e^-2t + 1 - e^-2t."""
import matplotlib.pyplot as plt
import numpy as np

from style import COL, WIDTH, clean, kicker, mono_ticks, save

comps = [(0.92, -0.35, 0.8), (0.08, 4.5, 0.4)]
x = np.linspace(-8, 10, 6000)
dx = x[1] - x[0]
gauss = np.exp(-x**2 / 2) / np.sqrt(2 * np.pi)

def density(t):
    p = np.zeros_like(x)
    for w, m, s in comps:
        mt, vt = m * np.exp(-t), s**2 * np.exp(-2 * t) + 1 - np.exp(-2 * t)
        p += w * np.exp(-(x - mt) ** 2 / (2 * vt)) / np.sqrt(2 * np.pi * vt)
    return p


fig, ax1 = plt.subplots(figsize=(WIDTH, 7.1))
clean(ax1, left=False)
for t, a in zip([0, 0.35, 0.8, 1.6], [1.0, 0.62, 0.42, 0.28]):
    ax1.plot(x, density(t), color=COL["accent"], lw=4 if t == 0 else 3, alpha=a)
ax1.plot(x, gauss, color=COL["ink"], lw=2.6, ls=(0, (6, 5)))
ax1.set_xlim(-5, 7)
ax1.set_yticks([])
ax1.set_xlabel("$x$")
ax1.annotate("standard Gaussian", xy=(1.2, 0.195), xytext=(2.6, 0.43), fontsize=23, color=COL["ink"], arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax1.annotate("the far bump at $t = 0$", xy=(4.5, 0.08), xytext=(4.2, 0.27), ha="center", fontsize=23, color=COL["accent"], arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
mono_ticks(ax1)
kicker(ax1, 0.0, 1.02, "the density at four times along the flow", transform=ax1.transAxes, size=16)
save(fig, "logsobolev-flow")
print("logsobolev ok")

# Along the same flow: half the relative Fisher information, the relative entropy and half the squared
# Wasserstein distance to the Gaussian. The log-Sobolev inequality puts the entropy below half the Fisher
# information (the gap is the deficit) and Talagrand's inequality puts half the squared distance below the
# entropy. All three computed numerically; W2 in one dimension from the quantile functions.
from scipy.special import ndtri

u = np.linspace(1e-6, 1 - 1e-6, 200001)
qg = ndtri(u)

def quantities(t):
    p = density(t)
    ratio = np.log(p / gauss)
    ent = float(np.sum(p * ratio) * dx)
    fis = float(np.sum(p * np.gradient(ratio, dx) ** 2) * dx)
    F = np.cumsum(p) * dx
    F /= F[-1]
    qp = np.interp(u, F, x)
    w2 = float(np.trapezoid((qp - qg) ** 2, u))
    return fis / 2, ent, w2 / 2

ts2 = np.linspace(0, 3, 90)
Q = np.array([quantities(t) for t in ts2])
assert (Q[:, 0] >= Q[:, 1] - 1e-9).all() and (Q[:, 1] >= Q[:, 2] - 1e-9).all(), "inequalities out of order"
print("t=0: I/2 = %.4f, H = %.4f, W2^2/2 = %.4f" % tuple(Q[0]))
fig, ax = plt.subplots(figsize=(WIDTH, 7.4))
clean(ax, grid="y")
ax.fill_between(ts2, Q[:, 1], Q[:, 0], color=COL["pale"], lw=0, zorder=0)
for j, col, name, nudge in [(0, COL["accent"], "half the Fisher information", 1.9), (1, COL["accent2"], "entropy", 0.78),
                            (2, COL["faint"], "half the squared $W_2$ distance", 0.8)]:
    ax.semilogy(ts2, Q[:, j], color=col, lw=4, zorder=2)
    ax.text(ts2[-1] + 0.08, Q[-1, j] * nudge, name, va="center", fontsize=21, color=col, fontweight="medium")
mid = 30
ax.annotate("deficit", xy=(ts2[mid], np.sqrt(Q[mid, 0] * Q[mid, 1])), xytext=(ts2[mid] + 0.35, Q[mid, 0] * 9),
            fontsize=22, color=COL["accent"], style="italic", arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(0, 4.75)
ax.set_xticks([0, 0.5, 1, 1.5, 2, 2.5, 3])
ax.set_yticks([1, 1e-2, 1e-4, 1e-6])
ax.set_yticklabels(["1", "$10^{-2}$", "$10^{-4}$", "$10^{-6}$"])
ax.set_xlabel("time $t$ along the flow")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "relative to the Gaussian", transform=ax.transAxes, size=16)
save(fig, "logsobolev-deficit")
