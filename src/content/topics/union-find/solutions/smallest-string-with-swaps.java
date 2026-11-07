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
    public String smallestStringWithSwaps(String s, int[][] pairs) {
        int n = s.length();
        UnionFind uf = new UnionFind(n);
        for (int[] p : pairs) uf.union(p[0], p[1]);

        Map<Integer, List<Integer>> groups = new HashMap<>(); // root -> indices (increasing)
        for (int i = 0; i < n; i++) {
            groups.computeIfAbsent(uf.find(i), k -> new ArrayList<>()).add(i);
        }

        char[] out = new char[n];
        for (List<Integer> idx : groups.values()) {
            char[] chars = new char[idx.size()];
            for (int k = 0; k < chars.length; k++) chars[k] = s.charAt(idx.get(k));
            Arrays.sort(chars);
            for (int k = 0; k < chars.length; k++) out[idx.get(k)] = chars[k];
        }
        return new String(out);
    }
}
