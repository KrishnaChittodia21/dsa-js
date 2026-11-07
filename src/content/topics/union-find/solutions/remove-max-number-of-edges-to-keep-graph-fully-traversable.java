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
    public int maxNumEdgesToRemove(int n, int[][] edges) {
        UnionFind alice = new UnionFind(n + 1);     // nodes 1..n (slot 0 unused)
        UnionFind bob = new UnionFind(n + 1);
        int kept = 0;

        for (int[] e : edges) {                      // shared edges first
            if (e[0] != 3) continue;
            boolean a = alice.union(e[1], e[2]);
            boolean b = bob.union(e[1], e[2]);       // call both: no short-circuit!
            if (a || b) kept++;
        }
        for (int[] e : edges) {
            if (e[0] == 1 && alice.union(e[1], e[2])) kept++;
            else if (e[0] == 2 && bob.union(e[1], e[2])) kept++;
        }

        // count == 2 means {1..n} is one group plus the unused slot 0
        if (alice.count != 2 || bob.count != 2) return -1;
        return edges.length - kept;
    }
}
