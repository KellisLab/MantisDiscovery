"""Ascent sequences avoiding 0120, 0121 and 0122: exact counts by exhaustive search, beside all ascent
sequences (the Fishburn numbers), and one example with its repetition arcs.

An ascent sequence starts at 0 and each entry is at most 1 + (ascents so far). It contains 0120, 0121 or 0122
when some increasing triple x_i < x_j < x_k is followed later by a repeat of x_i, x_j or x_k.
"""
import random
import sys

import matplotlib.pyplot as plt
import numpy as np

from style import COL, WIDTH, clean, kicker, mono_ticks, save

sys.setrecursionlimit(10000)
NMAX = 13


def count_avoiders(nmax):
    counts = [0] * (nmax + 1)

    def dfs(seq, asc, bad):
        n = len(seq)
        counts[n] += 1
        if n == nmax:
            return
        for v in range(asc + 2):
            if v in bad:
                continue
            new = set()
            # increasing triples that end at the new entry: x_i < x_j < v with i < j
            lows = set()
            for x in seq:
                if x < v:
                    for y in lows:
                        if y < x:
                            new.update((y, x, v))
                    lows.add(x)
            nb = bad | new if new else bad
            dfs(seq + [v], asc + (1 if v > seq[-1] else 0), nb)

    dfs([0], 0, frozenset())
    return counts


def fishburn(nmax):
    # states: (last value, ascents) -> count
    out = [0, 1]
    states = {(0, 0): 1}
    for n in range(2, nmax + 1):
        nxt = {}
        for (last, a), c in states.items():
            for v in range(a + 2):
                key = (v, a + (v > last))
                nxt[key] = nxt.get(key, 0) + c
        states = nxt
        out.append(sum(states.values()))
    return out


A = count_avoiders(NMAX)
Fb = fishburn(NMAX)
print("n, avoiders, all ascent sequences")
for n in range(1, NMAX + 1):
    print(n, A[n], Fb[n])

ns = np.arange(1, NMAX + 1)
fig, ax = plt.subplots(figsize=(WIDTH, 8.0))
clean(ax, grid="y")
la, lf = [np.log(A[n]) for n in ns], [np.log(Fb[n]) for n in ns]
ax.plot(ns, lf, "-", color=COL["light"], lw=4)
ax.plot(ns, lf, "o", color=COL["faint"], ms=9)
ax.plot(ns, la, "-", color=COL["accent"], lw=4.4)
ax.plot(ns, la, "o", color=COL["accent"], ms=11, markeredgecolor="white", markeredgewidth=2)
ax.text(NMAX + 0.3, lf[-1], "all ascent\nsequences", va="center", fontsize=23, color=COL["muted"], linespacing=1.1)
ax.text(NMAX + 0.3, la[-1], "avoiding\n0120, 0121, 0122", va="center", fontsize=23, color=COL["accent"], linespacing=1.1, fontweight="medium")
ax.set_xlim(0.5, NMAX + 3.6)
ax.set_xticks(range(1, NMAX + 1, 2))
ax.set_xlabel("length $n$")
ax.set_ylabel("log of the count")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "exhaustive search, lengths 1 to 13", transform=ax.transAxes, size=17)
save(fig, "ascent-counts")

# One example: a random avoiding sequence of length 34, built by random search with backtracking.
random.seed(11)


def sample(n):
    def go(seq, asc, bad):
        if len(seq) == n:
            return seq
        opts = [v for v in range(asc + 2) if v not in bad]
        random.shuffle(opts)
        for v in opts:
            new, lows = set(), set()
            for x in seq:
                if x < v:
                    for y in lows:
                        if y < x:
                            new.update((y, x, v))
                    lows.add(x)
            r = go(seq + [v], asc + (v > seq[-1]), bad | new)
            if r:
                return r
        return None

    return go([0], 0, frozenset())


# keep the sample, of many, with the most repeated values (the arcs of the repetition graph)
best = None
for _ in range(400):
    cand = sample(30)
    reps = len(cand) - len(set(cand))
    if best is None or reps > best[0]:
        best = (reps, cand)
seq = best[1]
print("example:", seq, "repeats:", best[0])
fig, ax = plt.subplots(figsize=(WIDTH, 6.8))
clean(ax, grid="y")
xs = np.arange(len(seq))
ax.plot(xs, seq, "-", color=COL["hair"], lw=2.4, zorder=1)
last = {}
for i, v in enumerate(seq):
    if v in last:
        j = last[v]
        t = np.linspace(0, np.pi, 50)
        ax.plot(j + (i - j) * (1 - np.cos(t)) / 2, v + 0.55 * np.sin(t) * (1 + (i - j) / 10), color=COL["accent2"], lw=3, zorder=2)
    last[v] = i
ax.scatter(xs, seq, s=120, color=COL["accent"], edgecolor="white", linewidth=2, zorder=3)
ax.set_xlabel("position")
ax.set_ylabel("value")
ax.set_xlim(-1, len(seq))
mono_ticks(ax)
save(fig, "ascent-example")
np.save(__import__("pathlib").Path(__file__).parent / "out" / "ascent-counts.npy", np.array(A))
