class Solution {
    public boolean isMstUnique(int n, int[][] edges) {
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));
        UnionFind uf = new UnionFind(n);
        int i = 0;
        while (i < sorted.length) {
            int j = i;
            while (j < sorted.length && sorted[j][2] == sorted[i][2]) j++;  // group [i, j)

            // 1. how many edges of this weight are individually usable?
            int candidates = 0;
            for (int k = i; k < j; k++) {
                if (uf.find(sorted[k][0]) != uf.find(sorted[k][1])) candidates++;
            }
            // 2. how many can actually be used together?
            int merged = 0;
            for (int k = i; k < j; k++) {
                if (uf.union(sorted[k][0], sorted[k][1])) merged++;
            }
            if (candidates > merged) return false;  // a choice existed
            i = j;
        }
        return true;
    }
}

class UnionFind {
    int[] parent, rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }

    boolean union(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (rank[a] < rank[b]) { int t = a; a = b; b = t; }
        parent[b] = a;
        if (rank[a] == rank[b]) rank[a]++;
        return true;
    }
}
