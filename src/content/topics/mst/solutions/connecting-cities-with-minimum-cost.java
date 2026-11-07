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
    public int minimumCost(int n, int[][] connections) {
        if (n == 1) return 0;
        Arrays.sort(connections, (x, y) -> Integer.compare(x[2], y[2]));
        UnionFind uf = new UnionFind(n + 1);   // cities are 1..n
        int total = 0, used = 0;
        for (int[] c : connections) {
            if (uf.union(c[0], c[1])) {
                total += c[2];
                if (++used == n - 1) return total;
            }
        }
        return -1;
    }
}
