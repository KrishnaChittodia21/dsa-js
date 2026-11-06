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
    public boolean equationsPossible(String[] equations) {
        UnionFind uf = new UnionFind(26);
        for (String e : equations) {
            if (e.charAt(1) == '=') uf.union(e.charAt(0) - 'a', e.charAt(3) - 'a'); // pass 1: build groups
        }
        for (String e : equations) {
            if (e.charAt(1) == '!' && uf.connected(e.charAt(0) - 'a', e.charAt(3) - 'a')) return false; // pass 2: verify
        }
        return true;
    }
}
