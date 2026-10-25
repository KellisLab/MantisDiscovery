"""The posters' figure style: Inter for words, IBM Plex Mono for numbers and axis ticks (both from the TeX
tree, as on the posters), STIX Two for mathematics, a deep blue with one warm signal colour, hairline axes,
and labels set on the data instead of in legends. Figures are drawn at 1:1 for a 14.2 in poster column and
saved with a transparent ground, so the poster's paper shows through. Every figure is laid out to the full
column width and placed on the poster at that width, so its type keeps the sizes set here."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import font_manager  # noqa: E402
from matplotlib.font_manager import FontProperties  # noqa: E402

TEX = Path("/usr/local/texlive/2025/texmf-dist/fonts/opentype")
for w in ("Light", "Regular", "Medium", "SemiBold", "Italic", "MediumItalic"):
    font_manager.fontManager.addfont(str(TEX / "public/inter" / f"Inter-{w}.otf"))
for w in ("Regular", "Medium", "SemiBold"):
    font_manager.fontManager.addfont(str(TEX / "ibm/plex" / f"IBMPlexMono-{w}.otf"))

OUT = Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)

COL = {
    "ink": "#141821",
    "text": "#2A303C",
    "muted": "#6B7383",
    "faint": "#9AA2B1",
    "light": "#CDD3DD",
    "hair": "#E4E7EC",
    "accent": "#2D4BA0",
    "accent2": "#7C93D3",
    "pale": "#E8ECF6",
    "signal": "#D2602A",
}
# kept for older scripts
COL.update({"azure": COL["accent"], "sky": COL["accent2"], "grey": COL["faint"], "rule": COL["light"], "tint": COL["pale"], "warm": COL["signal"]})

WIDTH = 14.13  # one poster column, inches: (48 - 2 x 1.3 - 2 x 1.5) / 3
MONO = FontProperties(family="IBM Plex Mono", weight="regular")
MONO_MED = FontProperties(family="IBM Plex Mono", weight="medium")

plt.rcParams.update({
    "font.family": "Inter",
    "font.size": 26,
    "font.weight": "regular",
    "mathtext.fontset": "stix",
    "axes.edgecolor": COL["faint"],
    "axes.labelcolor": COL["text"],
    "axes.labelsize": 26,
    "axes.labelpad": 14,
    "axes.linewidth": 1.4,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": False,
    "grid.color": COL["hair"],
    "grid.linewidth": 1.3,
    "xtick.color": COL["muted"],
    "ytick.color": COL["muted"],
    "xtick.labelsize": 21,
    "ytick.labelsize": 21,
    "xtick.major.width": 1.4,
    "ytick.major.width": 1.4,
    "xtick.major.size": 0,
    "ytick.major.size": 0,
    "xtick.minor.size": 0,
    "ytick.minor.size": 0,
    "xtick.major.pad": 12,
    "ytick.major.pad": 12,
    "lines.linewidth": 3.6,
    "lines.solid_capstyle": "round",
    "lines.dash_capstyle": "round",
    "legend.frameon": False,
    "figure.constrained_layout.use": True,
    "figure.constrained_layout.w_pad": 0.02,
    "figure.constrained_layout.h_pad": 0.02,
    "figure.facecolor": "none",
    "axes.facecolor": "none",
    "savefig.transparent": True,
    "text.color": COL["text"],
})


def mono_ticks(ax):
    """Tick labels in the mono face, as numbers are set on the posters."""
    for lab in ax.get_xticklabels() + ax.get_yticklabels():
        lab.set_fontproperties(MONO)
        lab.set_fontsize(21)


def clean(ax, left=True, bottom=True, grid=None):
    ax.spines["left"].set_visible(left)
    ax.spines["bottom"].set_visible(bottom)
    if grid:
        ax.grid(True, axis=grid, zorder=0)
        ax.set_axisbelow(True)


def kicker(ax, x, y, text, color=None, ha="left", va="bottom", size=19, transform=None):
    """A small uppercase mono label, tracked out a little."""
    ax.text(x, y, " ".join(text.upper()) if False else text.upper(), fontproperties=MONO_MED, fontsize=size,
            color=color or COL["muted"], ha=ha, va=va, transform=transform or ax.transData)


def save(fig, name: str):
    fig.savefig(OUT / f"{name}.pdf", bbox_inches="tight", pad_inches=0.03)
    fig.savefig(OUT / f"{name}.png", bbox_inches="tight", pad_inches=0.03, dpi=40)
    # the poster sets the figure at the column width; say how far that scales its type
    fig.canvas.draw()
    bb = fig.get_tightbbox(fig.canvas.get_renderer())
    w, h = bb.width + 0.06, bb.height + 0.06
    scale = WIDTH / w
    flag = "" if abs(scale - 1) < 0.03 else "   <- type scales by this much"
    print(f"{name}: {w:.2f} x {h:.2f} in natural, {WIDTH * h / w:.2f} in tall on the poster, scale {scale:.2f}{flag}")
    plt.close(fig)
