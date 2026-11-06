class UnionFind {
    private final int[] parent;
    private final int[] size;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        count--;
        return true;
    }

    boolean connected(int a, int b) {
        return find(a) == find(b);
    }
}

class Solution {
    public int regionsBySlashes(String[] grid) {
        int n = grid.length;
        UnionFind uf = new UnionFind(4 * n * n);

        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                int base = 4 * (r * n + c);          // +0 top, +1 right, +2 bottom, +3 left
                char ch = grid[r].charAt(c);
                if (ch == ' ') {
                    uf.union(base, base + 1);
                    uf.union(base + 1, base + 2);
                    uf.union(base + 2, base + 3);
                } else if (ch == '/') {
                    uf.union(base, base + 3);        // top + left
                    uf.union(base + 1, base + 2);    // right + bottom
                } else {
                    uf.union(base, base + 1);        // top + right
                    uf.union(base + 2, base + 3);    // bottom + left
                }
                if (r + 1 < n) uf.union(base + 2, 4 * ((r + 1) * n + c));    // bottom ↔ next top
                if (c + 1 < n) uf.union(base + 1, 4 * (r * n + c + 1) + 3);  // right ↔ next left
            }
        }
        return uf.count;
    }
}
