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
    public int[] minSpanningForest(int n, int[][] edges) {
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));
        UnionFind uf = new UnionFind(n);
        int total = 0;
        for (int[] e : sorted) {
            if (uf.union(e[0], e[1])) total += e[2];   // joins two components → part of the forest
        }
        return new int[]{total, uf.count};             // count = number of components left
    }
}
