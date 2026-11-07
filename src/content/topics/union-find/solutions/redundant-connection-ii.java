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
    public int[] findRedundantDirectedConnection(int[][] edges) {
        int n = edges.length;
        int[] parentOf = new int[n + 1];
        int[] cand1 = null, cand2 = null;

        for (int[] e : edges) {
            int u = e[0], v = e[1];
            if (parentOf[v] != 0) {                  // v already has a parent
                cand1 = new int[]{parentOf[v], v};   // earlier edge into v
                cand2 = new int[]{u, v};             // later edge into v
            } else {
                parentOf[v] = u;
            }
        }

        UnionFind uf = new UnionFind(n + 1);
        for (int[] e : edges) {
            int u = e[0], v = e[1];
            if (cand2 != null && u == cand2[0] && v == cand2[1]) continue; // pretend cand2 is removed
            if (!uf.union(u, v)) {
                return cand1 != null ? cand1 : new int[]{u, v}; // cycle remains
            }
        }
        return cand2;                                // removing cand2 fixed everything
    }
}
