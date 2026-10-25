"""King and rook against king, solved by retrograde analysis: the exact distance to mate of every legal
position with White to move. Saved to out/krvk.npz for certified.py."""
import numpy as np

from style import OUT

sq = lambda f, r: r * 8 + f
F = lambda s: s % 8
R = lambda s: s // 8
KN = [[sq(F(s) + df, R(s) + dr) for df in (-1, 0, 1) for dr in (-1, 0, 1)
       if (df or dr) and 0 <= F(s) + df < 8 and 0 <= R(s) + dr < 8] for s in range(64)]
ADJ = np.zeros((64, 64), bool)
for s in range(64):
    ADJ[s, KN[s]] = True
RAYS = []
for s in range(64):
    rays = []
    for df, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        f, r, ray = F(s) + df, R(s) + dr, []
        while 0 <= f < 8 and 0 <= r < 8:
            ray.append(sq(f, r)); f += df; r += dr
        rays.append(ray)
    RAYS.append(rays)

def rook_hits(wr, target, blockers):
    for ray in RAYS[wr]:
        for s in ray:
            if s == target:
                return True
            if s in blockers:
                break
    return False

idx = lambda wk, wr, bk: (wk * 64 + wr) * 64 + bk
NPOS = 64 ** 3
legalW = np.zeros(NPOS, bool)
legalB = np.zeros(NPOS, bool)
w_succ, w_ptr = [], [0]
b_succ, b_ptr = [], [0]
escape = np.zeros(NPOS, bool)  # Black can take an unprotected rook, or is stalemated: a draw
mate = np.zeros(NPOS, bool)
for wk in range(64):
    for wr in range(64):
        for bk in range(64):
            i = idx(wk, wr, bk)
            ok = wk != wr and wr != bk and wk != bk and not ADJ[wk, bk]
            # White to move: Black's king may not stand in check
            if ok and not rook_hits(wr, bk, (wk,)):
                legalW[i] = True
                for k in KN[wk]:
                    if k != wr and k != bk and not ADJ[k, bk]:
                        w_succ.append(idx(k, wr, bk))
                for ray in RAYS[wr]:
                    for s in ray:
                        if s == wk or s == bk:
                            break
                        w_succ.append(idx(wk, s, bk))
            w_ptr.append(len(w_succ))
            # Black to move
            if ok:
                legalB[i] = True
                n = 0
                for k in KN[bk]:
                    if k == wk or ADJ[k, wk]:
                        continue
                    if k == wr:
                        if not ADJ[wr, wk]:
                            escape[i] = True
                        continue
                    if rook_hits(wr, k, (wk,)):
                        continue
                    b_succ.append(idx(wk, wr, k)); n += 1
                if n == 0 and not escape[i]:
                    if rook_hits(wr, bk, (wk,)):
                        mate[i] = True
                    else:
                        escape[i] = True
            b_ptr.append(len(b_succ))
w_succ, w_ptr = np.array(w_succ), np.array(w_ptr)
b_succ, b_ptr = np.array(b_succ), np.array(b_ptr)

INF = 10 ** 6
lostB = np.full(NPOS, INF); lostB[mate] = 0
winW = np.full(NPOS, INF)
wl = np.flatnonzero(legalW); wn = w_ptr[wl + 1] - w_ptr[wl]
bl = np.flatnonzero(legalB & ~escape & ~mate); bn = b_ptr[bl + 1] - b_ptr[bl]
assert (wn > 0).all() and (bn > 0).all()
def per_position(op, vals, ptr):
    """op over each position's own successors (ptr[i] to ptr[i + 1]); a sentinel keeps trailing indices valid."""
    return op.reduceat(np.append(vals, 0), ptr[:-1])

for ply in range(1, 200):
    changed = 0
    if ply % 2:  # White moves to a position lost for Black
        best = per_position(np.minimum, lostB[w_succ], w_ptr)[wl]
        new = (winW[wl] == INF) & (best == ply - 1)
        winW[wl[new]] = ply; changed = new.sum()
    else:  # every Black move leads to a White win
        worst = per_position(np.maximum, winW[b_succ], b_ptr)[bl]
        new = (lostB[bl] == INF) & (worst == ply - 1)
        lostB[bl[new]] = ply; changed = new.sum()
    if not changed and ply > 4 and ply % 2 == 0 and not ((winW[wl] == ply - 1).any()):
        break
dtm = np.where(winW < INF, (winW + 1) // 2, -1)
won = legalW & (winW < INF)
print("legal positions, White to move:", int(legalW.sum()), "| won:", int(won.sum()), "| not won:", int((legalW & ~won).sum()))
print("longest mate:", int(dtm[won].max()), "moves")
np.savez_compressed(OUT / "krvk.npz", dtm=dtm.astype(np.int16), legal=legalW)
# Black to move: White's moves to mate, and the draws (Black takes the rook, or is stalemated)
lb = legalB & (lostB < INF)
dB = lostB[lb] // 2
print("Black to move: legal", int(legalB.sum()), "| lost", int(lb.sum()), "| drawn", int((legalB & escape).sum()), "| longest", int(dB.max()), "White moves")
print("by depth:", np.bincount(dB).tolist())
np.savez_compressed(OUT / "krvk.npz", dtm=dtm.astype(np.int16), legal=legalW, dtmB=np.where(lostB < INF, lostB // 2, -1).astype(np.int16), legalB=legalB, drawB=legalB & escape)
