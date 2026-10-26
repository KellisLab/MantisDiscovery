"""NS4A windows ranked as LC3-interacting candidates: their acidity, and which match the GABARAP motif.

The four candidate windows are printed in the paper's Table 1. We recompute each window's net charge at
pH 7 and its isoelectric point from the sequence (Henderson-Hasselbalch, EMBOSS pKa values, as Biopython
uses), and we scan every window against the two motif rules: the LIR core [WFY]xx[LIV] and the stricter
GABARAP-interaction motif [WF][VI]x[V]. Nothing here was measured in a laboratory.
"""
import re

import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, MONO_MED, WIDTH, clean, kicker, mono_ticks, save

# Table 1: tier, viruses, window, core, and the paper's reported pI and charge at pH 7.
ROWS = [
    ("1A", "West Nile, Kunjin", "PEHFMGKTWEALDTMYVVATA", "WEAL", 4.65, -1.95),
    ("1B", "Japanese, Murray Valley enc.", "SAVSFIEVLGRMPEHFM", "FIEV", 5.38, -1.45),
    ("2", "Powassan", "LRLRCTAAWDVVYTLLNETPG", "WDVV", 6.06, -0.25),
    ("3", "Tick-borne", "RCVSALDVFYTLMHEEPGSRA", "FYTL", 5.45, -1.16),
]
# Biopython's IsoelectricPoint tables, including its residue-specific terminal values, so the numbers
# match the ones the paper reports.
POS_PK = {"Nterm": 7.5, "K": 10.0, "R": 12.0, "H": 5.98}
NEG_PK = {"Cterm": 3.55, "D": 4.05, "E": 4.45, "C": 9.0, "Y": 10.0}
NTERM_PK = {"A": 7.59, "M": 7.0, "S": 6.93, "P": 8.36, "T": 6.82, "V": 7.44, "E": 7.7}
CTERM_PK = {"D": 4.55, "E": 4.75}


def charge_at(seq, ph):
    """Net charge from the Henderson-Hasselbalch equation, counting both termini."""
    q = 1 / (1 + 10 ** (ph - NTERM_PK.get(seq[0], POS_PK["Nterm"])))
    q -= 1 / (1 + 10 ** (CTERM_PK.get(seq[-1], NEG_PK["Cterm"]) - ph))
    for a in seq:
        if a in POS_PK:
            q += 1 / (1 + 10 ** (ph - POS_PK[a]))
        elif a in NEG_PK:
            q -= 1 / (1 + 10 ** (NEG_PK[a] - ph))
    return q


def isoelectric(seq):
    """The pH where the net charge vanishes, by bisection."""
    lo, hi = 0.0, 14.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if charge_at(seq, mid) > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


CORE = re.compile(r"[WFY]..[LIV]")
GIM = re.compile(r"[WF][VI].V")
for tier, _, seq, core, pi_rep, q_rep in ROWS:
    pi, q = isoelectric(seq), charge_at(seq, 7.0)
    print(f"tier {tier:2s} {core}  pI {pi:.2f} (paper {pi_rep})  charge {q:+.2f} (paper {q_rep:+.2f})  "
          f"core {bool(CORE.fullmatch(core))}  GIM {bool(GIM.fullmatch(core))}  D/E {sum(c in 'DE' for c in seq)}  "
          f"K/R {sum(c in 'KR' for c in seq)}")
    assert abs(pi - pi_rep) < 0.02 and abs(q - q_rep) < 0.01, f"tier {tier} does not reproduce"
    assert CORE.fullmatch(core), f"{core} is not a LIR core"
matches = [r[3] for r in ROWS if GIM.fullmatch(r[3])]
assert matches == ["FIEV"], f"expected only FIEV to match the GABARAP motif, got {matches}"
print("only", matches[0], "matches the GABARAP motif")

fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 7.0), width_ratios=[1.45, 1])
fig.get_layout_engine().set(wspace=0.12)

ax = axs[0]
clean(ax, left=False, grid="x")
ys = np.arange(len(ROWS))[::-1]
for y, (tier, virus, seq, core, pi_rep, q_rep) in zip(ys, ROWS):
    q = charge_at(seq, 7.0)
    hit = bool(GIM.fullmatch(core))
    col = COL["signal"] if hit else COL["accent"]
    ax.barh(y - 0.16, q, height=0.34, color=col, zorder=3)
    ax.text(0.08, y + 0.14, f"{core}", fontsize=23, color=COL["ink"], va="center", fontweight="semibold")
    ax.text(1.62, y + 0.14, f"tier {tier}, {virus}", fontsize=20, color=COL["muted"], va="center")
    ax.text(q - 0.07, y - 0.16, f"{q:+.2f}", ha="right", va="center", fontproperties=MONO_MED, fontsize=21, color=col)
ax.axvline(0, color=COL["faint"], lw=1.6, zorder=2)
ax.set_xlim(-2.5, 4.9)
ax.set_ylim(-0.75, len(ROWS) - 0.2)
ax.set_yticks([])
ax.set_xticks([-2, -1, 0])
ax.set_xlabel("net charge at pH 7")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "computed from each window sequence", transform=ax.transAxes, size=16)

ax = axs[1]
clean(ax, left=False, bottom=False)
ax.set_xlim(-0.4, 6.6)
ax.set_ylim(-0.75, len(ROWS) - 0.2)
ax.set_xticks([])
ax.set_yticks([])
for y, (tier, _, _, core, _, _) in zip(ys, ROWS):
    hit = bool(GIM.fullmatch(core))
    for i, a in enumerate(core):
        ok = hit or i == 0
        ax.text(i, y - 0.05, a, ha="center", va="center", fontsize=30, fontweight="semibold",
                color=COL["signal"] if hit else (COL["ink"] if ok else COL["light"]))
    if hit:
        ax.text(4.1, y - 0.05, "matches", va="center", fontsize=21, color=COL["signal"], fontweight="medium")
    else:
        ax.text(4.1, y - 0.05, "no match", va="center", fontsize=21, color=COL["muted"])
        ax.plot([0.7, 1.3], [y - 0.42, y - 0.42], color=COL["faint"], lw=2.6)
kicker(ax, -0.4, len(ROWS) - 0.2, "against the GABARAP motif [WF][VI]x[V]", va="top", size=16)
save(fig, "ns4a-windows")
print("ns4a ok")

# Where the acid sits in each window: the paper's filter asks for at least two D or E residues around
# the core, and this shows how they fall relative to it.
fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, left=False, bottom=False)
longest = max(len(r[2]) for r in ROWS)
for y, (tier, _, seq, core, _, _) in zip(ys, ROWS):
    start = seq.index(core)
    ax.plot([0, len(seq) - 1], [y, y], color=COL["hair"], lw=2.2, zorder=1)
    ax.add_patch(plt.Rectangle((start - 0.45, y - 0.3), 3.9, 0.6, color=COL["pale"], zorder=0))
    for i, a in enumerate(seq):
        acid, base = a in "DE", a in "KR"
        col = COL["signal"] if acid else (COL["accent2"] if base else COL["light"])
        ax.scatter([i], [y], s=150 if acid or base else 42, color=col,
                   edgecolor="white" if acid or base else "none", linewidth=1.8, zorder=3)
    ax.text(start + 1.5, y + 0.42, core, ha="center", va="bottom", fontsize=21, color=COL["ink"], fontweight="semibold")
    ax.text(-1.1, y, f"tier {tier}", ha="right", va="center", fontproperties=MONO, fontsize=19, color=COL["muted"])
ax.set_xlim(-5.6, longest + 0.6)
ax.set_ylim(-0.8, len(ROWS) - 0.1)
ax.set_xticks([])
ax.set_yticks([])
ax.scatter([0.5], [-0.62], s=150, color=COL["signal"], edgecolor="white", linewidth=1.8)
ax.text(1.3, -0.62, "acidic (D, E)", va="center", fontsize=20, color=COL["text"])
ax.scatter([7.2], [-0.62], s=150, color=COL["accent2"], edgecolor="white", linewidth=1.8)
ax.text(8.0, -0.62, "basic (K, R)", va="center", fontsize=20, color=COL["text"])
ax.text(14.0, -0.62, "shaded: the four-residue core", va="center", fontsize=20, color=COL["muted"])
kicker(ax, -5.6, len(ROWS) - 0.1, "each window, from its first residue to its last", va="top", size=16)
save(fig, "ns4a-windows-track")
print("ns4a track ok")

# The control panel: the related cores the paper names, under both rules. Only one matches the stricter
# motif, which is what makes the others useful as controls.
PANEL = ["WEAL", "FIEV", "FFEV", "FLEV", "WDVV", "FYTL", "YTLL"]
verdict = {c: (bool(CORE.fullmatch(c)), bool(GIM.fullmatch(c))) for c in PANEL}
print("cores matching the GABARAP motif:", [c for c in PANEL if verdict[c][1]])
assert [c for c in PANEL if verdict[c][1]] == ["FIEV"], "only FIEV should match"
assert all(v[0] for v in verdict.values()), "all seven should be LIR cores"

fig, ax = plt.subplots(figsize=(WIDTH, 6.0))
clean(ax, left=False, bottom=False)
ax.set_xlim(-0.6, len(PANEL) - 0.4)
ax.set_ylim(-0.9, 1.75)
ax.set_xticks([])
ax.set_yticks([])
for i, c in enumerate(PANEL):
    core_ok, gim_ok = verdict[c]
    ax.text(i, 1.28, c, ha="center", va="center", fontsize=27, fontweight="semibold",
            color=COL["signal"] if gim_ok else COL["ink"])
    for y, ok in [(0.52, core_ok), (-0.22, gim_ok)]:
        col = COL["signal"] if (ok and y < 0) else (COL["accent"] if ok else COL["light"])
        ax.scatter([i], [y], s=430, color=col, zorder=3)
        if not ok:
            ax.plot([i - 0.17, i + 0.17], [y, y], color="white", lw=3.4, zorder=4)
for y, lab in [(0.52, "a LIR core"), (-0.22, "the GABARAP motif")]:
    ax.text(-0.75, y, lab, ha="right", va="center", fontsize=22, color=COL["text"])
ax.text(len(PANEL) - 1, -0.78, "filled means it matches", ha="right", va="center", fontsize=20, color=COL["muted"])
kicker(ax, -0.6, 1.72, "the candidates and their near relatives", va="top", size=16)
save(fig, "ns4a-panel")
