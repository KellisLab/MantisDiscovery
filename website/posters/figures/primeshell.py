"""Dissociated irreducibles over F_q[t]: the shell trade-off and the divisor ceiling.

Two computed pictures for a theorem about random sets of same-degree irreducible polynomials.
  shell:   how many degree-k irreducibles a modulus of degree n can leave, against theta*n/k,
           so the usable count peaks near k = log_q(n).
  ceiling: the largest number of monic divisors of a^l over deg a <= N, by an exact knapsack
           over degrees, against the paper's limit exp(log(l+1) N / log_q N).
"""
from math import gcd, log

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, WIDTH, clean, kicker, mono_ticks, save

Q, N_MOD = 2, 1000


def mobius(n):
    m, p = 1, 2
    while p * p <= n:
        if n % p == 0:
            n //= p
            if n % p == 0:
                return 0
            m = -m
        p += 1
    return -m if n > 1 else m


def irreducibles(q, k):
    """Gauss's count of monic irreducibles of degree k over F_q."""
    return sum(mobius(d) * q ** (k // d) for d in range(1, k + 1) if k % d == 0) // k


def divisor_ceiling(q, l, nmax):
    """T_l(N): most monic divisors of a^l over deg a <= N, by knapsack over degrees."""
    best = [1] * (nmax + 1)
    for d in range(1, nmax + 1):
        avail = min(irreducibles(q, d), nmax // d)
        for _ in range(avail):  # each prime of this degree used at most once in a
            for budget in range(nmax, d - 1, -1):
                cap = budget // d
                best[budget] = max(best[budget], max(best[budget - a * d] * (l * a + 1) for a in range(1, cap + 1)))
    return best


counts = [irreducibles(Q, k) for k in range(1, 21)]
print("pi_2(1..16):", counts[:16])
assert counts[:8] == [2, 1, 2, 3, 6, 9, 18, 30], "irreducible counts are off"

ks = np.arange(1, 21)
room = np.array([N_MOD // k for k in ks])  # a degree-n modulus can hide at most n/k of them
usable = np.minimum(counts, room)
peak = int(ks[usable.argmax()])
print(f"peak at k = {peak}, usable {usable.max()}, theta n / log_q n = {N_MOD / np.log2(N_MOD):.2f}")
assert peak == int(np.ceil(np.log2(N_MOD))), "peak is not at ceil(log_q n)"

fig, ax = plt.subplots(figsize=(WIDTH, 7.0))
clean(ax, grid="y")
ax.set_yscale("log")
ax.plot(ks, counts, color=COL["light"], lw=2.6, zorder=2)
ax.plot(ks, room, color=COL["light"], lw=2.6, ls=(0, (6, 5)), zorder=2)
ax.plot(ks, usable, color=COL["accent"], lw=5, zorder=3)
ax.scatter([peak], [usable.max()], s=320, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.annotate("too few polynomials\nof this degree exist", xy=(5, usable[4]), xytext=(1.3, 140),
            fontsize=21, color=COL["muted"], linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate("the modulus can\nswallow them all", xy=(17, usable[16]), xytext=(12.4, 2.1),
            fontsize=21, color=COL["muted"], linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.annotate(f"$k = {peak}$ leaves {usable.max()}", xy=(peak, usable.max()), xytext=(peak - 4.6, 900),
            fontsize=23, color=COL["signal"], fontweight="medium",
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
ax.set_xlim(0.5, 20.5)
ax.set_ylim(0.8, 3e3)
ax.set_xticks([1, 5, 10, 15, 20])
ax.set_yticks([1, 10, 100, 1000])
ax.set_yticklabels(["1", "10", "100", "1,000"])
ax.set_xlabel("degree $k$ of the shell")
ax.set_ylabel("polynomials we can use")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, f"q = {Q}, modulus of degree {N_MOD:,}", transform=ax.transAxes, size=16)
save(fig, "primeshell-shell")

# How many residue classes the divisors reach, against how many there are. The gap is the point: the
# construction keeps products distinct, and it does not come close to covering the group.
NMAX = 1000
T2 = divisor_ceiling(Q, 2, NMAX)
small = [T2[n] for n in range(1, 13)]
print("T_2(1..12):", small)
assert small == [3, 9, 15, 27, 45, 75, 105, 147, 225, 315, 441, 675], "divisor ceiling is off"
ns = np.arange(8, NMAX + 1)
bits = np.array([log(T2[n], 2) for n in ns])
print(f"at N = {NMAX}: {bits[-1]:.0f} bits reachable, about {NMAX} bits of residue classes")
assert 200 < bits[-1] < 215, "reachable bits moved"

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
ax.fill_between(ns, bits, ns, color=COL["pale"], lw=0, zorder=1)
ax.plot(ns, ns, color=COL["ink"], lw=2.6, ls=(0, (5, 4)), zorder=3)
ax.plot(ns, bits, color=COL["accent"], lw=4.6, zorder=4)
ax.text(NMAX * 1.03, NMAX, "all residue\nclasses", va="center", fontsize=21, color=COL["ink"], linespacing=1.15)
ax.text(NMAX * 1.03, bits[-1], "classes our\ndivisors reach", va="center", fontsize=21, color=COL["accent"],
        fontweight="medium", linespacing=1.15)
ax.text(430, 560, "never covered", fontsize=23, color=COL["muted"], rotation=16, rotation_mode="anchor")
ax.set_xlim(0, NMAX * 1.33)
ax.set_ylim(0, NMAX * 1.08)
ax.set_xticks([0, 250, 500, 750, 1000])
ax.set_yticks([0, 250, 500, 750, 1000])
ax.set_xlabel("degree bound $N$")
ax.set_ylabel("bits of information")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "q = 2, squarefree products with every exponent up to 2", transform=ax.transAxes, size=16)
save(fig, "primeshell-ceiling")
print("primeshell ok")

# What the proof does with exponents divisible by the characteristic: squaring collapses the group, and
# the modulus can be replaced by a smaller one. We measure that collapse exactly for Q = t^n over F_2.
def square_image_bits(n):
    """Bits of the image of F -> F^2 on the units of F_2[t]/t^n, by exhaustive search."""
    mask = (1 << n) - 1
    seen = set()
    for f in range(1, 1 << n, 2):  # odd constant term: exactly the units
        s = 0
        for i in range(n):
            if f >> i & 1:
                s ^= f << i
        seen.add(s & mask)
    return np.log2(len(seen)), n - 1


ns_sq = range(2, 15)
img, tot = zip(*[square_image_bits(n) for n in ns_sq])
print("units:", list(tot)[-3:], "bits; squares:", [round(b, 1) for b in img][-3:], "bits")
for n, b in zip(ns_sq, img):
    assert abs(b - (np.ceil(n / 2) - 1)) < 1e-9, f"the image at n = {n} is not the expected size"

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
ax.fill_between(list(ns_sq), img, tot, color=COL["pale"], lw=0, zorder=1)
ax.plot(list(ns_sq), tot, color=COL["ink"], lw=2.8, ls=(0, (5, 4)), zorder=3)
ax.plot(list(ns_sq), img, color=COL["accent"], lw=4.6, zorder=4)
ax.scatter(list(ns_sq), img, s=110, color=COL["accent"], edgecolor="white", linewidth=2, zorder=5)
ax.text(14.3, tot[-1], "all units", va="center", fontsize=21, color=COL["ink"])
ax.text(14.3, img[-1], "their squares", va="center", fontsize=21, color=COL["accent"], fontweight="medium")
ax.text(8.2, 9.2, "what squaring\nthrows away", fontsize=21, color=COL["muted"], linespacing=1.2)
ax.set_xlim(2, 17.4)
ax.set_ylim(0, 14)
ax.set_xticks([2, 5, 8, 11, 14])
ax.set_xlabel("$n$, for the modulus $t^{n}$")
ax.set_ylabel("bits")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "q = 2, counted exhaustively", transform=ax.transAxes, size=16)
save(fig, "primeshell-frobenius")
