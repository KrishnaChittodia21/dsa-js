class UnionFind {
    private final int[] parent, rank;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        count--;
        return true;
    }
}

class Solution {
    public int minCostToSupplyWater(int n, int[] wells, int[][] pipes) {
        List<int[]> edges = new ArrayList<>();
        for (int[] p : pipes) edges.add(new int[]{p[0], p[1], p[2]});
        for (int i = 1; i <= n; i++) edges.add(new int[]{0, i, wells[i - 1]});   // well = pipe from source 0
        edges.sort((x, y) -> Integer.compare(x[2], y[2]));

        UnionFind uf = new UnionFind(n + 1);   // node 0 is the virtual water source
        int total = 0, used = 0;
        for (int[] e : edges) {
            if (!uf.union(e[0], e[1])) continue;
            total += e[2];
            if (++used == n) break;            // n + 1 nodes → n edges
        }
        return total;
    }
}
