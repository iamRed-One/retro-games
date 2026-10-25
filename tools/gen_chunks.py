"""
Generates src/game/levels/chunks.ts: reusable 20-row level pieces.

Conventions:
  - Height 20 rows. Ground top is row 17 at both edges unless a chunk says otherwise
    (the assembler builds stairs between pieces whose edges differ).
  - Reach (from TUNING): normal bounce 3 rows up / ~7 cols across, super bounce 5 up,
    spring 8 up, puff 6 up, fan hover ~8 above the fan's floor.
"""
import sys

H = 20


class Chunk:
    def __init__(self, w, ground="#"):
        self.w = w
        self.g = [["." for _ in range(w)] for _ in range(H)]
        self.groundch = ground

    def fill(self, c0, c1, r0, r1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                self.g[r][c] = ch
        return self

    def ground(self, c0, c1, top=17, ch=None):
        return self.fill(c0, c1, top, H - 1, ch or self.groundch)

    def put(self, c, r, ch):
        self.g[r][c] = ch
        return self

    def seeds(self, c0, c1, r, step=1, ch="o"):
        for c in range(c0, c1 + 1, step):
            if self.g[r][c] in ".~":
                self.g[r][c] = ch if self.g[r][c] == "." else "*"
        return self

    def water(self, c0, c1, r0, r1, ch="~"):
        """Fill empty cells with water (keeps terrain and entities)."""
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                cur = self.g[r][c]
                if cur == ".":
                    self.g[r][c] = ch
                elif cur == "o":
                    self.g[r][c] = "*"
                elif cur == "^":
                    self.g[r][c] = "!"
        return self

    def rows(self):
        return ["".join(r) for r in self.g]


CH = {}

# ------------------------------------------------------------------ basic (any grassy world)
c = Chunk(34).ground(0, 5).ground(30, 33)
c.fill(9, 12, 15, 19, "#").fill(16, 19, 13, 19, "#").fill(23, 26, 15, 19, "#")
c.seeds(9, 12, 13).seeds(16, 19, 11).seeds(23, 26, 13)
CH["b_steps"] = c

c = Chunk(36).ground(0, 35)
for a, b in [(6, 8), (14, 18), (25, 27)]:
    c.fill(a, b, 16, 16, "^")
c.fill(13, 19, 13, 13, "-").seeds(13, 19, 12).put(31, 16, "M").seeds(3, 4, 15)
CH["b_spikes"] = c

c = Chunk(36).ground(0, 35)
c.fill(12, 15, 10, 16, "#").put(9, 16, "T").seeds(12, 15, 9)
c.put(24, 16, "T").fill(26, 30, 7, 7, "-").seeds(26, 30, 6).put(20, 16, "M")
CH["b_springs"] = c

c = Chunk(40).ground(0, 4).ground(35, 39)
c.put(6, 15, "H").fill(16, 18, 13, 13, "-").put(21, 13, "H").put(29, 15, "H")
c.seeds(7, 11, 13).seeds(16, 18, 11).seeds(22, 26, 11).seeds(30, 34, 13)
CH["b_movers"] = c

c = Chunk(36).ground(0, 35)
c.fill(10, 13, 6, 16, "#").put(5, 15, "I").fill(7, 9, 8, 8, "-").seeds(10, 13, 5).seeds(18, 22, 16, 2)
CH["b_lift"] = c

c = Chunk(40).ground(0, 39)
for col in (8, 20, 32):
    c.put(col, 16, "M")
c.fill(14, 17, 13, 13, "-").fill(26, 29, 13, 13, "-").seeds(14, 17, 12).seeds(26, 29, 12)
CH["b_murks"] = c

c = Chunk(32).ground(0, 31)
c.fill(14, 17, 12, 16, "#").fill(10, 11, 14, 14, "-").seeds(14, 17, 7).seeds(20, 24, 16, 2)
CH["b_super"] = c

c = Chunk(36).ground(0, 5).ground(30, 35)
c.fill(11, 14, 17, 19, "#").fill(21, 24, 16, 19, "#")
c.seeds(7, 9, 14).seeds(16, 19, 14).seeds(26, 28, 14)
CH["b_pitjumps"] = c

# ------------------------------------------------------------------ crumble
c = Chunk(36).ground(0, 4).ground(31, 35)
c.fill(5, 30, 17, 17, "X").seeds(6, 29, 15, 2)
CH["c_bridge"] = c

c = Chunk(36).ground(0, 35)
for col, row in [(6, 15), (10, 13), (14, 11)]:
    c.fill(col, col + 1, row, row, "X")
c.fill(18, 23, 10, 16, "#").seeds(18, 23, 9).put(28, 16, "M")
CH["c_stairs"] = c

c = Chunk(40).ground(0, 39)
c.fill(4, 6, 15, 16, "#").fill(7, 30, 13, 13, "X").fill(7, 30, 16, 16, "^").fill(31, 34, 13, 16, "#")
c.seeds(8, 29, 12, 3)
CH["c_overspikes"] = c

c = Chunk(40).ground(0, 3).ground(36, 39)
c.fill(7, 8, 15, 15, "X").fill(13, 14, 15, 15, "X").put(18, 15, "H").fill(28, 29, 14, 14, "X").fill(33, 34, 15, 15, "X")
c.seeds(7, 8, 13).seeds(13, 14, 13).seeds(19, 21, 13).seeds(28, 29, 12).seeds(33, 34, 13)
CH["c_islands"] = c

# ------------------------------------------------------------------ wind
c = Chunk(36).ground(0, 35)
c.put(8, 16, "W").fill(11, 18, 10, 11, "#").fill(21, 24, 9, 16, "#").seeds(11, 18, 9).seeds(8, 8, 12).seeds(8, 8, 13)
CH["w_fanwall"] = c

c = Chunk(40).ground(0, 39)
c.fill(5, 34, 16, 16, "^").put(9, 16, "W").put(21, 16, "W")
c.fill(12, 16, 10, 10, "-").fill(24, 28, 10, 10, "-").seeds(12, 16, 9).seeds(24, 28, 9)
CH["w_spikefans"] = c

c = Chunk(40).ground(0, 39)
c.put(5, 16, "W").fill(8, 13, 10, 16, "#").put(12, 9, "W").fill(15, 24, 3, 4, "#").fill(25, 26, 5, 16, "#")
c.seeds(15, 24, 2).seeds(5, 5, 11).seeds(12, 12, 6)
CH["w_stack"] = c

c = Chunk(40).ground(0, 3).ground(34, 39)
c.fill(8, 10, 16, 19, "#").put(9, 15, "W").fill(13, 17, 9, 9, "-")
c.fill(21, 23, 16, 19, "#").put(22, 15, "W").fill(26, 30, 9, 9, "-")
c.seeds(13, 17, 8).seeds(26, 30, 8)
CH["w_pillars"] = c

# ------------------------------------------------------------------ water (banks at row 14)
c = Chunk(36).ground(0, 5, top=14).ground(30, 35, top=14).ground(6, 29, top=19)
c.water(6, 29, 14, 18).seeds(12, 22, 12, 2)
for col in range(10, 26, 2):
    c.put(col, 17, "*")
c.fill(14, 15, 18, 18, "!").fill(22, 23, 18, 18, "!")
CH["a_pond"] = c

c = Chunk(40).ground(0, 3, top=14).ground(36, 39, top=14).ground(4, 35, top=19)
c.water(4, 35, 14, 18)
c.fill(8, 30, 16, 17, ">")
c.put(12, 17, "*").put(18, 16, "*").put(24, 17, "*").fill(10, 11, 18, 18, "!").fill(27, 28, 18, 18, "!")
CH["a_current"] = c

c = Chunk(40).ground(0, 3, top=14).ground(36, 39, top=14).ground(4, 35, top=19)
c.water(4, 35, 14, 18).put(8, 13, "H").put(22, 13, "H").seeds(9, 11, 11).seeds(23, 25, 11)
c.put(16, 17, "*").put(30, 17, "*").fill(18, 20, 18, 18, "!")
CH["a_logs"] = c

# ------------------------------------------------------------------ sky (cloud ground K, bottomless)
c = Chunk(38, "K").ground(0, 3).ground(34, 37)
c.fill(7, 9, 15, 15, "K").fill(13, 15, 13, 13, "K").fill(19, 21, 11, 11, "K").fill(25, 28, 13, 13, "=").fill(31, 33, 15, 15, "K")
c.seeds(7, 9, 13).seeds(13, 15, 11).seeds(19, 21, 9).seeds(25, 28, 11).seeds(31, 33, 13)
CH["s_hops"] = c

c = Chunk(40, "K").ground(0, 3).ground(36, 39)
c.fill(7, 9, 17, 17, "K").put(8, 16, "P").fill(13, 16, 11, 11, "K").put(15, 10, "P")
c.fill(22, 25, 13, 13, "K").fill(26, 28, 17, 17, "K").put(27, 16, "P").fill(31, 34, 12, 12, "K")
c.seeds(13, 16, 9).seeds(14, 16, 4).seeds(31, 34, 10)
CH["s_puffs"] = c

c = Chunk(40, "K").ground(0, 3).ground(34, 39)
c.fill(8, 10, 16, 16, "K").put(9, 15, "W").fill(13, 17, 9, 9, "=").fill(21, 23, 16, 16, "K").put(22, 15, "W").fill(26, 30, 9, 9, "=")
c.seeds(13, 17, 8).seeds(26, 30, 8).seeds(9, 9, 11).seeds(22, 22, 11)
CH["s_fans"] = c

c = Chunk(40, "K").ground(0, 4).ground(35, 39)
c.put(6, 15, "H").fill(16, 18, 13, 13, "=").put(21, 13, "H").put(29, 15, "H")
c.seeds(7, 11, 13).seeds(16, 18, 11).seeds(22, 26, 11).seeds(30, 34, 13)
CH["s_movers"] = c

c = Chunk(38, "K").ground(0, 3).ground(34, 37)
c.fill(4, 33, 17, 17, "X").seeds(5, 32, 15, 3).put(18, 16, "M")
CH["s_crumble"] = c

c = Chunk(38, "K").ground(0, 3).ground(34, 37)
c.fill(6, 8, 17, 17, "K").put(7, 16, "P").fill(12, 14, 12, 12, "X").fill(18, 20, 14, 14, "K").put(19, 13, "P")
c.fill(24, 27, 8, 8, "=").fill(29, 31, 13, 13, "X")
c.seeds(12, 14, 10).seeds(24, 27, 6).seeds(29, 31, 11)
CH["s_puffs2"] = c

c = Chunk(36, "K").ground(0, 35)
c.fill(10, 13, 6, 16, "K").put(5, 15, "I").fill(7, 9, 8, 8, "=").seeds(10, 13, 5).fill(20, 21, 16, 16, "^").fill(27, 28, 16, 16, "^")
CH["s_lift"] = c

c = Chunk(40, "K").ground(0, 3).ground(36, 39)
c.fill(6, 8, 15, 15, "K").put(7, 14, "M").fill(12, 15, 13, 13, "X").fill(19, 21, 15, 15, "K").fill(25, 27, 12, 12, "=")
c.fill(25, 27, 8, 8, "v").fill(31, 33, 14, 14, "K").put(32, 13, "P")
c.seeds(12, 15, 11).seeds(25, 27, 10).seeds(31, 33, 6)
CH["s_gauntlet"] = c

# ------------------------------------------------------------------ ocean (underwater: surface at row 3)
def ocean(w):
    return Chunk(w).ground(0, w - 1)


c = ocean(40)
c.fill(8, 10, 12, 16, "#").fill(20, 22, 11, 16, "#").fill(14, 16, 3, 8, "#").fill(27, 29, 3, 9, "#")
c.put(18, 10, "J").put(25, 13, "J").fill(31, 33, 16, 16, "^")
c.seeds(12, 12, 14).seeds(17, 17, 13).seeds(24, 24, 10).seeds(32, 34, 12)
c.water(0, 39, 3, 16)
CH["o_reef"] = c

c = ocean(44)
c.fill(6, 37, 3, 9, "#").fill(8, 35, 11, 15, ">")
c.put(16, 13, "J").put(27, 12, "J").fill(12, 13, 16, 16, "^").fill(30, 31, 16, 16, "^")
c.seeds(10, 34, 13, 4)
c.water(0, 43, 3, 16)
CH["o_current"] = c

c = ocean(40)
for x, top in [(7, True), (14, False), (21, True), (28, False)]:
    if top:
        c.fill(x, x + 1, 9, 16, "#")
    else:
        c.fill(x, x + 1, 3, 10, "#")
c.seeds(4, 4, 6).seeds(11, 11, 14).seeds(18, 18, 6).seeds(25, 25, 14).seeds(32, 32, 6)
c.put(11, 8, "J").put(25, 8, "J")
c.water(0, 39, 3, 16)
CH["o_kelp"] = c

c = ocean(40)
c.fill(8, 31, 8, 10, "<").put(10, 13, "J").put(16, 6, "J").put(22, 13, "J").put(28, 6, "J")
c.fill(14, 15, 16, 16, "^").fill(24, 25, 16, 16, "^")
c.seeds(6, 34, 12, 4).seeds(6, 34, 5, 7)
c.water(0, 39, 3, 16)
CH["o_jellies"] = c

c = ocean(40)
c.fill(5, 34, 3, 6, "#").fill(10, 12, 13, 16, "#").fill(19, 21, 7, 11, "#").fill(27, 29, 13, 16, "#")
c.put(15, 12, "J").put(24, 14, "J").fill(31, 32, 16, 16, "^")
c.seeds(7, 9, 9).seeds(14, 16, 15).seeds(23, 25, 9).seeds(31, 33, 10)
c.water(0, 39, 3, 16)
CH["o_cave"] = c

c = ocean(44)
c.fill(10, 30, 12, 15, ">").fill(10, 30, 5, 8, "<").fill(8, 32, 9, 11, "#")
c.put(20, 14, "J").fill(16, 17, 16, 16, "^").fill(26, 27, 16, 16, "^")
c.seeds(12, 28, 13, 4).seeds(12, 28, 6, 4)
c.water(0, 43, 3, 16)
CH["o_split"] = c

# ------------------------------------------------------------------ lava
c = Chunk(40).ground(0, 4).ground(35, 39).fill(5, 34, 18, 19, "L").fill(5, 34, 17, 17, "L")
c.fill(9, 11, 15, 19, "#").fill(16, 18, 14, 19, "#").fill(23, 25, 15, 19, "#").fill(30, 32, 16, 19, "#")
c.seeds(9, 11, 13).seeds(16, 18, 12).seeds(23, 25, 13).seeds(30, 32, 14)
CH["l_hops"] = c

c = Chunk(40).ground(0, 39)
for col in (8, 12, 16, 22, 26, 30):
    c.put(col, 16, "G")
c.fill(18, 20, 12, 12, "-").seeds(18, 20, 11).seeds(9, 11, 15).seeds(27, 29, 15)
CH["l_geysers"] = c

c = Chunk(40).ground(0, 3).ground(36, 39).fill(4, 35, 18, 19, "L").fill(4, 35, 17, 17, "X")
c.seeds(5, 34, 15, 3)
CH["l_bridge"] = c

c = Chunk(40).ground(0, 3).ground(34, 39).fill(4, 33, 17, 19, "L")
c.fill(8, 10, 16, 19, "#").put(9, 15, "W").fill(13, 17, 9, 9, "-")
c.fill(21, 23, 16, 19, "#").put(22, 15, "W").fill(26, 30, 9, 9, "-")
c.seeds(13, 17, 8).seeds(26, 30, 8)
CH["l_fans"] = c

c = Chunk(40).ground(0, 4).ground(35, 39).fill(5, 34, 17, 19, "L")
c.fill(8, 10, 15, 19, "#").put(9, 14, "G").fill(15, 17, 13, 19, "#").fill(22, 24, 15, 19, "#").put(23, 14, "G").fill(29, 31, 14, 19, "#")
c.seeds(15, 17, 11).seeds(29, 31, 12)
CH["l_ventjumps"] = c

c = Chunk(40).ground(0, 39)
c.fill(6, 9, 16, 16, "^").put(13, 16, "G").fill(17, 22, 13, 13, "X").fill(17, 22, 16, 16, "^").put(26, 16, "G").put(31, 16, "M")
c.seeds(17, 22, 12).seeds(10, 12, 14)
CH["l_mix"] = c

# ------------------------------------------------------------------ fortress / storm mixes
c = Chunk(44).ground(0, 43)
c.fill(6, 11, 16, 16, "^").fill(5, 12, 13, 13, "-").fill(6, 11, 9, 9, "v")
c.put(16, 16, "M").fill(20, 27, 13, 13, "X").fill(20, 27, 16, 16, "^")
c.put(31, 16, "M").fill(34, 39, 16, 16, "^").fill(34, 39, 13, 13, "X")
# Step blocks so each bridge is a 2-row climb (a normal bounce reaches 3).
c.fill(3, 4, 15, 16, "#").fill(18, 19, 15, 16, "#").fill(32, 33, 15, 16, "#")
c.seeds(5, 12, 12, 2).seeds(20, 27, 12, 2).seeds(34, 39, 12, 2)
CH["f_gauntlet"] = c

c = Chunk(40).ground(0, 39)
c.put(6, 16, "T").fill(9, 12, 9, 16, "#").fill(15, 17, 9, 9, "X").put(21, 16, "W").fill(19, 23, 4, 4, "-")
c.fill(26, 29, 7, 16, "#").fill(26, 29, 6, 6, "."). seeds(19, 23, 3).seeds(26, 29, 6)
c.fill(32, 35, 16, 16, "^")
CH["f_tower"] = c

c = Chunk(40).ground(0, 3).ground(36, 39)
c.fill(6, 8, 15, 19, "#").put(7, 14, "M").fill(12, 14, 13, 19, "#").fill(18, 20, 15, 19, "#").put(19, 14, "T")
c.fill(24, 26, 9, 9, "X").fill(30, 32, 14, 19, "#").put(31, 13, "M")
c.seeds(12, 14, 11).seeds(24, 26, 8).seeds(30, 32, 12)
CH["f_pillars"] = c


# ------------------------------------------------------------------ secret rooms
# A big block you normally spring over; a fake wall (F) at ground level hides a room of seeds.
def vault(ground="#", fake="F", water_level=None):
    c = Chunk(36, ground).ground(0, 35)
    c.put(6, 16, "T").fill(10, 21, 10, 16, ground).fill(12, 19, 12, 16, ".")
    c.fill(10, 11, 12, 16, fake)
    c.seeds(13, 18, 15).seeds(13, 18, 16).seeds(14, 17, 14)
    c.seeds(11, 20, 9)
    if water_level is not None:
        c.water(0, 35, water_level, 16)
    return c


CH["x_vault"] = vault()
CH["x_vault_sky"] = vault(ground="K")
CH["x_vault_ocean"] = vault(fake="f", water_level=3)


def emit(path):
    out = [
        "/* eslint-disable */",
        "// Generated level pieces (see the generator notes at the top of each world).",
        "// 20 rows tall; ground top on row 17 at both edges unless noted. Edit freely: the",
        "// assembler builds stairs between pieces whose edge heights differ.",
        "",
        "export const CHUNKS: Record<string, string[]> = {",
    ]
    for name, chunk in CH.items():
        rows = chunk.rows()
        assert len(rows) == H and all(len(r) == chunk.w for r in rows), name
        out.append(f"  {name}: [")
        out += [f"    '{r}'," for r in rows]
        out.append("  ],")
    out.append("};")
    open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"wrote {len(CH)} chunks")


emit(sys.argv[1])
