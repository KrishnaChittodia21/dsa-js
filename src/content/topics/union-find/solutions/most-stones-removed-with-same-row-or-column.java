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
    public int removeStones(int[][] stones) {
        final int OFFSET = 10001;                    // columns live in ids 10001..20001
        UnionFind uf = new UnionFind(2 * OFFSET);
        for (int[] st : stones) uf.union(st[0], st[1] + OFFSET);

        Set<Integer> groups = new HashSet<>();
        for (int[] st : stones) groups.add(uf.find(st[0])); // only ids that hold stones
        return stones.length - groups.size();
    }
}
