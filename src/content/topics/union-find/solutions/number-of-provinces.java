class UnionFind {
    private final int[] parent, size;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
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
        parent[rb] = ra; // union by size
        size[ra] += size[rb];
        count--;
        return true;
    }
}

class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        UnionFind uf = new UnionFind(n); // count starts at n
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) { // symmetric: upper triangle is enough
                if (isConnected[i][j] == 1) uf.union(i, j);
            }
        }
        return uf.count;
    }
}
