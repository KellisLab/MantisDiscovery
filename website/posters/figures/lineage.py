"""Predicting a clone's composition from its relatives: what calibration buys, and what it costs in labels.

All values are the ones the manuscript reports (Tables 3, 4, 5 and S9). Gain is the comparator's mean
squared error minus the rule's, so positive means the rule helps. We plot how the gain depends on how
many relatives are measured, and on how many clones are available to fit the rule.
"""
import matplotlib.pyplot as plt
import numpy as np

from style import COL, MONO, MONO_MED, WIDTH, clean, kicker, mono_ticks, save

CAPS = ["1", "3", "5", "10", "all"]
CAL = [(0.00514871, 0.00493627), (0.00708467, 0.00704366), (0.00741745, 0.00741521),
       (0.00755216, 0.00758292), (0.00756685, 0.00760467)]          # fitted within the study
RAW = [(-0.02659037, -0.02775589), (-0.00913583, -0.00849491), (-0.00711478, -0.00626913),
       (-0.00630259, -0.00533332), (-0.00620737, -0.00521190)]      # copy the relative's value
FROZEN = [(-0.022418, -0.000273), (-0.012018, 0.004006), (-0.010192, 0.004704),
          (-0.009170, 0.005030), (-0.008865, 0.005076)]             # reused from the other study
KS = [10, 25, 50, 100, 200, 400]
REFIT = [(-0.000879, -0.001162), (0.000955, 0.000486), (0.002916, 0.002779),
         (0.004145, 0.003955), (0.004693, 0.004517), (0.004938, 0.004744)]

mid = lambda rows: np.array([sum(r) / 2 for r in rows])
print("calibrated gain rises from %.5f at one cell to %.5f with all cells" % (mid(CAL)[0], mid(CAL)[-1]))
assert all(c > 0 for pair in CAL for c in pair), "calibration should always help"
assert all(c < 0 for pair in RAW for c in pair), "raw copying should never help on average"
assert mid(REFIT)[0] < 0 < mid(REFIT)[3], "refitting should cross zero between 10 and 100 clones"

fig, axs = plt.subplots(1, 2, figsize=(WIDTH, 5.0))
fig.get_layout_engine().set(wspace=0.1)

ax = axs[0]
clean(ax, grid="y")
xs = np.arange(len(CAPS))
ax.fill_between(xs, [f[0] for f in FROZEN], [f[1] for f in FROZEN], color=COL["pale"], lw=0, zorder=1)
for rows, col, name, nudge in [(CAL, COL["accent"], "fitted here", 1), (RAW, COL["signal"], "copied straight across", -1)]:
    for j in range(2):
        ax.plot(xs, [r[j] for r in rows], color=col, lw=3.6, alpha=0.95 if j == 0 else 0.55, zorder=3)
    ax.scatter(xs, mid(rows), s=150, color=col, edgecolor="white", linewidth=2.4, zorder=4)
    ax.text(len(CAPS) - 1 + 0.14, mid(rows)[-1] + nudge * 0.0012, name, fontsize=20, color=col, fontweight="medium", va="center")
ax.text(1.05, -0.0175, "reused from\nthe other study", fontsize=20, color=COL["muted"], linespacing=1.2)
ax.axhline(0, color=COL["faint"], lw=1.6, zorder=2)
ax.set_xlim(-0.25, 5.9)
ax.set_xticks(xs)
ax.set_xticklabels(CAPS)
ax.set_xlabel("relatives measured per clone")
ax.set_ylabel("improvement in squared error")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "above zero means the rule beats a constant", transform=ax.transAxes, size=16)

ax = axs[1]
clean(ax, grid="y")
for j, alpha in [(0, 0.95), (1, 0.55)]:
    ax.plot(KS, [r[j] for r in REFIT], color=COL["accent"], lw=3.6, alpha=alpha, zorder=3)
ax.scatter(KS, mid(REFIT), s=150, color=COL["accent"], edgecolor="white", linewidth=2.4, zorder=4)
ax.axhline(0, color=COL["faint"], lw=1.6, zorder=2)
cross = np.interp(0, mid(REFIT), KS)
ax.scatter([cross], [0], s=260, color=COL["signal"], edgecolor="white", linewidth=3, zorder=5)
ax.annotate("about %d clones\nbefore it pays off" % round(cross), xy=(cross, 0), xytext=(11, 0.0031),
            fontsize=21, color=COL["signal"], linespacing=1.2,
            arrowprops=dict(arrowstyle="-", color=COL["faint"], lw=1.4))
print("the fitted rule overtakes a constant at about %d training clones" % round(cross))
ax.set_xscale("log")
ax.set_xlim(8, 520)
ax.set_xticks(KS)
ax.set_xticklabels([str(k) for k in KS])
ax.set_xlabel("clones used to fit the rule")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "one relative measured per clone", transform=ax.transAxes, size=16)
save(fig, "lineage-gain")
print("lineage ok")

# What happens when only part of the existing annotation is kept: fewer clones have a measured relative,
# and the rule stops paying for itself. Both rows are reported (Tables S20 and S21).
KEEP = [0.05, 0.10, 0.25, 0.50, 1.0]
PAIRED = [99.6, 263.0, 706.5, 1207.7, 1801.0]
CAP_GAIN = [(-0.001061, -0.001170), (-0.000293, -0.000479), (0.002021, 0.001866),
            (0.004829, 0.004775), (0.007567, 0.007605)]
assert mid(CAP_GAIN)[0] < 0 < mid(CAP_GAIN)[2], "the capture curve should cross zero"
print("keeping 5%% of annotations leaves %.0f paired clones and a negative gain" % PAIRED[0])

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, grid="y")
for j, alpha in [(0, 0.95), (1, 0.55)]:
    ax.plot(PAIRED, [r[j] for r in CAP_GAIN], color=COL["accent"], lw=3.6, alpha=alpha, zorder=3)
ax.scatter(PAIRED, mid(CAP_GAIN), s=160, color=COL["accent"], edgecolor="white", linewidth=2.4, zorder=4)
ax.axhline(0, color=COL["faint"], lw=1.6, zorder=2)
for x, k in zip(PAIRED, KEEP):
    ax.text(x, -0.00175, f"{k:.0%}", ha="center", va="top", fontproperties=MONO, fontsize=19, color=COL["muted"])
ax.text(PAIRED[0], 0.0012, "fewer clones keep a\nmeasured relative", fontsize=20, color=COL["muted"], linespacing=1.2)
ax.set_xlim(0, 1950)
ax.set_ylim(-0.0027, 0.0092)
ax.set_xticks([0, 500, 1000, 1500])
ax.set_xlabel("clones with a measured relative")
ax.set_ylabel("improvement in squared error")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "share of the existing annotation kept", transform=ax.transAxes, size=16)
save(fig, "lineage-capture")

# The signature check that started the project: in four wells, how much higher the state prevalence is
# among linked relatives than among cells paired at random. All four gaps sit under the five-point gate
# the project set in advance, so the signal is weaker than the rule would need.
WELLS = [("control 1", 267, 4.695, 1.347), ("control 2", 193, 4.700, 1.825),
         ("carboplatin 1", 161, 8.768, 2.246), ("carboplatin 2", 185, 2.901, 0.805)]
GATE = 5.0
assert all(w[3] < GATE for w in WELLS), "a well passed the gate"
print("largest gap %.3f points, against a gate of %.0f" % (max(w[3] for w in WELLS), GATE))

fig, ax = plt.subplots(figsize=(WIDTH, 6.6))
clean(ax, left=False, grid="x")
ys = np.arange(len(WELLS))[::-1]
for y, (name, groups, prev, gap) in zip(ys, WELLS):
    ax.barh(y, gap, height=0.44, color=COL["accent"], zorder=3)
    ax.text(0.1, y + 0.42, f"{name}", fontsize=22, color=COL["text"], va="bottom", fontweight="medium")
    ax.text(gap + 0.12, y, f"{gap:.2f} points", va="center", fontsize=21, color=COL["accent"], fontweight="medium")
    ax.text(5.9, y, f"{groups} groups, {prev:.1f}% in state", va="center", fontsize=20, color=COL["muted"])
ax.axvline(GATE, color=COL["signal"], lw=2.8, ls=(0, (5, 4)), zorder=4)
ax.text(GATE - 0.12, len(WELLS) - 0.55, "the gate we set\nbefore looking", ha="right", va="top", fontsize=21,
        color=COL["signal"], linespacing=1.2, fontweight="medium")
ax.set_xlim(0, 10.4)
ax.set_ylim(-0.7, len(WELLS) - 0.1)
ax.set_yticks([])
ax.set_xticks([0, 2, 4, 6])
ax.set_xlabel("how much higher the prevalence is among relatives, in points")
mono_ticks(ax)
kicker(ax, 0.0, 1.02, "four wells, 13 days", transform=ax.transAxes, size=16)
save(fig, "lineage-wells")
