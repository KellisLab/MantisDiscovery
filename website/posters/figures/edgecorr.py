"""Pair correlations at the edge of complex-symmetric spectra, against complex Ginibre.

g = 1 means two eigenvalues sit at independent positions, and g < 1 means close pairs are rarer than
that. We draw the deep-bulk correlation the paper identifies, the Ginibre bulk for comparison, and how
each falls away outside the disk: complex-symmetric like 1/sigma, Ginibre like 1/sigma squared.
"""
import matplotlib.pyplot as plt
import numpy as np
from scipy.special import erfcx, exp1, k0e, wofz

from style import COL, MONO, WIDTH, clean, kicker, mono_ticks, save


def bulk_sym(t):
    """The deep-bulk correlation for complex-symmetric matrices, at squared separation t."""
    return ((t * np.cosh(t / 2) + 2 * np.sinh(t / 2)) * exp1(t / 2) / 4 + (3 - np.exp(-t)) / 4
            + np.exp(-t) / t - (1 - np.exp(-t)) / t ** 2)


def phi(r):
    """The exterior profile: sigma * g tends to this as sigma grows."""
    return r ** 2 * k0e(r ** 2 / 4) / np.sqrt(2 * np.pi)


def ginibre(sigma, d):
    """Ginibre's pair correlation at midpoint offset sigma and separation d, written to stay stable."""
    x, y = np.real(d), np.imag(d)
    return 1 - abs(wofz((-y + 1j * sigma) / np.sqrt(2))) ** 2 / (
        erfcx((sigma + x) / np.sqrt(2)) * erfcx((sigma - x) / np.sqrt(2)))


for t, want in [(0.25, 0.33530), (1.0, 0.69744), (4.0, 0.96130)]:
    assert abs(bulk_sym(t) - want) < 1e-5, f"bulk value at {t} is off"
assert abs(phi(1.0) - 0.789640) < 1e-6, "the exterior profile is off"
for s, want in [(8, 0.916113), (16, 0.977241), (32, 0.994184), (64, 0.998538)]:
    assert abs(s ** 2 * ginibre(s, 1.0) - want) < 1e-5, f"Ginibre at sigma {s} is off"
for d, want in [(1.0, 0.3110034), (1j, 0.2977018)]:
    assert abs(ginibre(0.0, d) - want) < 1e-6, f"Ginibre at the edge is off for d = {d}"
print("bulk, exterior and Ginibre values all reproduce")

fig, axs = plt.subplots(1, 2, figsize=(WIDTH - 0.26, 7.0))
fig.get_layout_engine().set(wspace=0.1)

ax = axs[0]
clean(ax, grid="y")
r = np.linspace(0.08, 3, 400)
ax.plot(r, bulk_sym(r ** 2), color=COL["accent"], lw=4.4, zorder=4)
ax.plot(r, 1 - np.exp(-r ** 2), color=COL["faint"], lw=3.4, ls=(0, (6, 5)), zorder=3)
ax.axhline(1, color=COL["ink"], lw=1.8, ls=(0, (2, 4)), zorder=2)
EDGE = [(0.5, 0.21714), (1.0, 0.50209), (2.0, 0.84850)]
ax.scatter([e[0] for e in EDGE], [e[1] for e in EDGE], s=240, facecolor="white",
           edgecolor=COL["signal"], linewidth=3.2, zorder=5)
ax.annotate("complex symmetric", xy=(2.2, bulk_sym(2.2 ** 2)), xytext=(1.05, 0.80), fontsize=21,
            color=COL["accent"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("Ginibre", xy=(1.55, 1 - np.exp(-1.55 ** 2)), xytext=(2.05, 0.50), fontsize=21, color=COL["muted"],
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("at the edge", xy=(1.0, 0.50209), xytext=(1.12, 0.265), fontsize=21, color=COL["signal"],
            fontweight="medium", arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(0, 3.25)
ax.set_ylim(0, 1.12)
ax.set_xticks([0, 1, 2, 3])
ax.set_yticks([0, 0.5, 1])
ax.set_xlabel("separation between the pair")
ax.set_ylabel("pair correlation")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "deep inside the disk, with edge values marked", transform=ax.transAxes, size=16)

ax = axs[1]
clean(ax, grid="both")
sig = np.logspace(np.log10(2), np.log10(60), 200)
ax.loglog(sig, phi(1.0) / sig, color=COL["accent"], lw=4.4, zorder=4)
ax.loglog(sig, [ginibre(s, 1.0) for s in sig], color=COL["faint"], lw=3.4, ls=(0, (6, 5)), zorder=3)
ax.annotate("complex symmetric,\nfalls like $1/\\sigma$", xy=(22, phi(1.0) / 22), xytext=(3.1, 0.0032),
            fontsize=21, color=COL["accent"], fontweight="medium", linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("Ginibre,\nlike $1/\\sigma^2$", xy=(30, ginibre(30, 1.0)), xytext=(6.2, 0.00042), fontsize=21,
            color=COL["muted"], linespacing=1.2, arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(2.2, 75)
ax.set_ylim(2e-4, 0.5)
ax.set_xticks([2, 10, 60])
ax.set_xticklabels(["2", "10", "60"])
ax.set_yticks([1e-3, 1e-2, 1e-1])
ax.set_yticklabels(["0.001", "0.01", "0.1"])
ax.set_xlabel("distance outside the disk")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "at separation 1: pairs survive further out", transform=ax.transAxes, size=16)
save(fig, "edgecorr-pairs")
print("edgecorr ok")

# The ensemble itself: eigenvalues of one complex-symmetric Gaussian matrix, and how sharply they stop.
rng = np.random.default_rng(5)


def csym(n):
    """A complex-symmetric Gaussian matrix: off-diagonal variance 1/(2n), diagonal 1/n."""
    x = (rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) / np.sqrt(2 * n)
    m = np.triu(x, 1)
    m = m + m.T + np.diag((rng.normal(size=n) + 1j * rng.normal(size=n)) / np.sqrt(n))
    return m


N_ONE = 900
ev = np.linalg.eigvals(csym(N_ONE))
radii = np.abs(np.concatenate([np.linalg.eigvals(csym(400)) for _ in range(14)]))
inside = (np.abs(ev) <= 1).mean()
print(f"one matrix of size {N_ONE}: {inside:.3f} of its eigenvalues lie inside the unit disk")
assert 0.9 < inside < 1.0, "the spectrum should nearly fill the unit disk"
assert (radii > 1.08).mean() < 0.01, "too many eigenvalues stray outside"

fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 6.6), width_ratios=[1, 1.25])
fig.get_layout_engine().set(wspace=0.08)
ax = axs[0]
ax.set_aspect("equal")
ax.set_anchor("W")
ax.axis("off")
th = np.linspace(0, 2 * np.pi, 400)
ax.plot(np.cos(th), np.sin(th), color=COL["signal"], lw=2.6, zorder=3)
ax.scatter(ev.real, ev.imag, s=7, color=COL["accent"], alpha=0.5, lw=0, zorder=2)
ax.set_xlim(-1.3, 1.3)
ax.set_ylim(-1.3, 1.3)
kicker(ax, -1.32, 1.34, f"one matrix, {N_ONE} eigenvalues", size=16)

ax = axs[1]
clean(ax, grid="y")
ax.hist(radii, bins=90, range=(0, 1.2), color=COL["accent"], zorder=2)
ax.axvline(1, color=COL["signal"], lw=2.6, zorder=3)
ax.text(1.03, ax.get_ylim()[1] * 0.78, "edge of\nthe disk", fontsize=21, color=COL["signal"], linespacing=1.2,
        fontweight="medium")
ax.set_xlim(0, 1.2)
ax.set_yticks([])
ax.set_xticks([0, 0.5, 1])
ax.set_xlabel("distance from the centre")
ax.set_ylabel("eigenvalues")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "14 matrices of size 400", transform=ax.transAxes, size=16)
save(fig, "edgecorr-spectrum")

# How far each eigenvalue sits from its nearest neighbour, for the two ensembles, after dividing by the
# mean spacing. Close pairs are rarer for complex-symmetric matrices than for Ginibre.
def ginibre_matrix(n):
    return (rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) / np.sqrt(2 * n)


def nearest_gaps(maker, n, reps):
    out = []
    for _ in range(reps):
        z = np.linalg.eigvals(maker(n))
        z = z[np.abs(z) < 0.75]  # stay in the bulk, away from the edge
        d = np.abs(z[:, None] - z[None, :])
        np.fill_diagonal(d, np.inf)
        out.append(d.min(axis=1) * np.sqrt(n))
    return np.concatenate(out)


gap_sym = nearest_gaps(csym, 400, 12)
gap_gin = nearest_gaps(ginibre_matrix, 400, 12)
close = [(g < 0.5).mean() for g in (gap_sym, gap_gin)]
print(f"pairs closer than half a spacing: complex symmetric {close[0]:.3f}, Ginibre {close[1]:.3f}")
assert close[0] > close[1], "complex-symmetric matrices should hold more close pairs, as the correlation says"

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
bins = np.linspace(0, 3, 70)
ax.hist(gap_gin, bins=bins, density=True, color=COL["light"], zorder=2)
ax.hist(gap_sym, bins=bins, density=True, histtype="step", color=COL["accent"], lw=4, zorder=3)
ax.text(1.62, 0.78, "complex symmetric", fontsize=22, color=COL["accent"], fontweight="medium")
ax.text(1.62, 0.66, "Ginibre", fontsize=22, color=COL["muted"])
ax.annotate("more very close pairs,\nthe same weaker repulsion", xy=(0.34, 0.30), xytext=(0.5, 0.86),
            fontsize=21, color=COL["signal"], fontweight="medium", linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(0, 3)
ax.set_yticks([])
ax.set_xticks([0, 1, 2, 3])
ax.set_xlabel("distance to the nearest other eigenvalue, in mean spacings")
ax.set_ylabel("how often")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "12 matrices of size 400 each, inner part of the disk", transform=ax.transAxes, size=16)
save(fig, "edgecorr-gaps")
