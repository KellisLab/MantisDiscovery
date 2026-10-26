"""Cell-state response bounds when treatment kills cells and capture depends on state.

Two states, control mix a, treated mix b, survival ratio s, and capture that can vary between states by
at most a factor Gamma. The bound is the smallest fraction of treated survivors that must have changed
state. We compute it two ways: when both arms share one capture vector (the shared mechanism), and when
they may differ independently. We then plot how far treatment-relative capture drift, Lambda, has to go
before the bound collapses.
"""
import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, WIDTH, clean, kicker, mono_ticks, save

A = (0.3, 0.7)   # control mix
B = (0.6, 0.4)   # treated mix
S = 0.8          # treated-to-control survival ratio


def shared(gamma):
    """Both arms reweighted by the same capture vector, at the edge h = (Gamma, 1)."""
    return max(0.0, B[0] * gamma / (B[0] * gamma + B[1]) - (1 / S) * A[0] * gamma / (A[0] * gamma + A[1]))


def independent(gamma):
    """Each arm free to pick its own capture vector, so the two can cancel."""
    return max(0.0, B[0] / (B[0] + B[1] * gamma) - (1 / S) * A[0] * gamma / (A[0] * gamma + A[1]))


def brute(gamma, grid=1200):
    """Check the shared value by searching the whole box [1, Gamma]^2."""
    best = None
    for h0 in np.linspace(1, gamma, grid):
        for h1 in np.linspace(1, gamma, grid):
            wa = np.array([A[0] * h0, A[1] * h1]); wa /= wa.sum()
            wb = np.array([B[0] * h0, B[1] * h1]); wb /= wb.sum()
            v = max(0.0, max(wb[i] - wa[i] / S for i in range(2)))
            best = v if best is None else min(best, v)
    return best


exact = shared(2.0)
print(f"shared minimum at Gamma = 2: {exact:.6f} (9/52 = {9/52:.6f}); independent: {independent(2.0):.6f}")
assert abs(exact - 9 / 52) < 1e-12, "the shared minimum is not 9/52"
assert independent(2.0) == 0.0, "the independent minimum should vanish"
assert abs(brute(2.0) - exact) < 2e-4, "a box search beats the edge value"
assert abs(shared(1.0) - 0.225) < 1e-12 and abs(independent(1.0) - 0.225) < 1e-12, "the two should agree at 1"

fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 6.4))
fig.get_layout_engine().set(wspace=0.1)

ax = axs[0]
clean(ax, grid="y")
gs = np.linspace(1, 4, 400)
ax.plot(gs, [shared(g) for g in gs], color=COL["accent"], lw=4.4, zorder=3)
ax.plot(gs, [independent(g) for g in gs], color=COL["faint"], lw=3.4, ls=(0, (6, 5)), zorder=2)
ax.scatter([2], [exact], s=300, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.annotate("17.3% of survivors\nmust have changed", xy=(2, exact), xytext=(2.08, 0.209), fontsize=21,
            color=COL["signal"], fontweight="medium", linespacing=1.2, va="top",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.text(1.62, 0.027, "capture free to differ\nbetween the arms", fontsize=20, color=COL["muted"], linespacing=1.2)
ax.text(3.22, 0.132, "one shared\ncapture pattern", fontsize=20, color=COL["accent"], linespacing=1.2,
        fontweight="medium")
ax.set_xlim(1, 4)
ax.set_ylim(-0.012, 0.25)
ax.set_xticks([1, 2, 3, 4])
ax.set_yticks([0, 0.05, 0.1, 0.15, 0.2])
ax.set_yticklabels(["0", "5%", "10%", "15%", "20%"])
ax.set_xlabel(r"capture may vary between states by $\Gamma$")
ax.set_ylabel("survivors that changed state")
mono_ticks(ax)

ax = axs[1]
clean(ax, grid="y")
lam = np.linspace(1, 3, 400)
err = (np.sqrt(lam) - 1) / (np.sqrt(lam) + 1)
ax.plot(lam, np.maximum(0, exact - err), color=COL["accent"], lw=4.4, zorder=3)
breaks = 11 / 5
conservative = (61 / 43) ** 2
print(f"breaks at Lambda = {breaks}; the conservative bound reaches zero at {conservative:.4f}")
assert abs(exact - (np.sqrt(conservative) - 1) / (np.sqrt(conservative) + 1)) < 1e-12, "the crossing is off"
ax.axvspan(conservative, breaks, color=COL["pale"], zorder=0)
for x, col in [(conservative, COL["accent"]), (breaks, COL["signal"])]:
    ax.axvline(x, color=col, lw=2.6, ls=(0, (5, 4)), zorder=2)
ax.annotate("our bound gives\nup at 2.01", xy=(conservative, 0.055), xytext=(1.08, 0.112), fontsize=20,
            color=COL["accent"], linespacing=1.2, arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("selection alone could\nexplain it at 2.20", xy=(breaks, 0.018), xytext=(2.3, 0.108), fontsize=20,
            color=COL["signal"], linespacing=1.2, arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(1, 3)
ax.set_ylim(-0.012, 0.25)
ax.set_xticks([1, 1.5, 2, 2.5, 3])
ax.set_yticks([0, 0.05, 0.1, 0.15, 0.2])
ax.set_yticklabels(["0", "5%", "10%", "15%", "20%"])
ax.set_xlabel(r"capture drift between arms, $\Lambda$")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "how much drift the bound survives", transform=ax.transAxes, size=16)
save(fig, "survival-bound")
print("survival ok")

# How the bound depends on how many cells survived. The more death, the less the mixes can prove.
fig, ax = plt.subplots(figsize=(WIDTH, 5.3))
clean(ax, grid="y")
ss = np.linspace(0.4, 1.0, 400)


def bound_at(s_val, gamma=2.0):
    return max(0.0, B[0] * gamma / (B[0] * gamma + B[1]) - (1 / s_val) * A[0] * gamma / (A[0] * gamma + A[1]))


vals = np.array([bound_at(v) for v in ss])
zero_at = ss[vals > 0][0]
print(f"at Gamma = 2 the bound is empty below a survival ratio of {zero_at:.3f}")
assert abs(bound_at(S) - exact) < 1e-12, "the curve misses the worked case"
ax.plot(ss, vals, color=COL["accent"], lw=4.6, zorder=3)
ax.fill_between(ss, 0, vals, color=COL["pale"], lw=0, zorder=1)
ax.scatter([S], [exact], s=300, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.annotate("the case above", xy=(S, exact), xytext=(0.84, 0.115), fontsize=21, color=COL["signal"],
            fontweight="medium", arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.text(0.425, 0.045, "too much death:\nthe mixes prove nothing", fontsize=21, color=COL["muted"], linespacing=1.2)
ax.set_xlim(0.4, 1.0)
ax.set_ylim(-0.015, 0.31)
ax.set_xticks([0.4, 0.6, 0.8, 1.0])
ax.set_yticks([0, 0.1, 0.2, 0.3])
ax.set_yticklabels(["0", "10%", "20%", "30%"])
ax.set_xlabel("treated survivors per control cell")
ax.set_ylabel("survivors that changed state")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "capture may vary between states by 2", transform=ax.transAxes, size=16)
save(fig, "survival-death")

# A three-state case where the best capture pattern is not a corner of the box. The minimum sits part way
# along an edge, which is why a search over corners alone reports too large a number.
A3 = np.array([1 / 9, 1 / 9, 7 / 9])
B3 = np.array([1 / 2, 2 / 9, 5 / 18])
S3 = 3 / 5


def value3(h):
    """The survival-weighted divergence: what the treated mix carries beyond what survival can supply."""
    wa, wb = A3 * h, B3 * h
    wa, wb = wa / wa.sum(), wb / wb.sum()
    return float(np.clip(wb - wa / S3, 0, None).sum())


xs = np.linspace(1, 2, 601)
vals = np.array([value3(np.array([x, 2.0, 1.0])) for x in xs])
j = int(vals.argmin())
corners = {(a, b, c): value3(np.array([a, b, c], dtype=float))
           for a in (1, 2) for b in (1, 2) for c in (1, 2)}
best_corner = min(corners.values())
print(f"edge minimum {vals[j]:.5f} at x = {xs[j]:.3f}; best corner {best_corner:.5f}")
assert abs(vals[j] - 215 / 816) < 2e-5, "the edge minimum is off"
assert abs(best_corner - 3 / 11) < 1e-12, "the corner minimum is off"
assert vals[j] < best_corner, "the edge should beat every corner"

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
ax.plot(xs, vals, color=COL["accent"], lw=4.6, zorder=3)
ax.axhline(best_corner, color=COL["faint"], lw=2.6, ls=(0, (5, 4)), zorder=2)
ax.scatter([xs[j]], [vals[j]], s=320, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.scatter([1, 2], [vals[0], vals[-1]], s=220, facecolor="white", edgecolor=COL["faint"], linewidth=3, zorder=4)
ax.annotate("the real minimum,\npart way along the edge", xy=(xs[j], vals[j]), xytext=(1.36, 0.2685),
            fontsize=21, color=COL["signal"], fontweight="medium", linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.text(1.72, best_corner + 0.0012, "best corner of the box", fontsize=21, color=COL["muted"])
ax.set_xlim(1, 2)
ax.set_ylim(0.2605, 0.2765)
ax.set_xticks([1, 1.25, 1.5, 1.75, 2])
ax.set_yticks([0.265, 0.27, 0.275])
ax.set_yticklabels(["26.5%", "27.0%", "27.5%"])
ax.set_xlabel("capture weight on the first state")
ax.set_ylabel("survivors that changed state")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "three states, along one edge of the capture box", transform=ax.transAxes, size=16)
save(fig, "survival-edge")
