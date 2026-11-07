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
    private int n;
    private int[][] edges, sorted;

    public int[][] findCriticalAndPseudoCriticalEdges(int n, int[][] edges) {
        this.n = n;
        this.edges = edges;
        // keep original indices, then sort by weight once
        sorted = new int[edges.length][];
        for (int i = 0; i < edges.length; i++) sorted[i] = new int[]{edges[i][0], edges[i][1], edges[i][2], i};
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));

        int best = mst(-1, -1);
        List<Integer> critical = new ArrayList<>(), pseudo = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            if (mst(i, -1) > best) critical.add(i);        // cannot live without it
            else if (mst(-1, i) == best) pseudo.add(i);    // can be in some MST
        }
        return new int[][]{
            critical.stream().mapToInt(Integer::intValue).toArray(),
            pseudo.stream().mapToInt(Integer::intValue).toArray()
        };
    }

    // MST weight with edge 'skip' banned and edge 'force' pre-added (original indices)
    private int mst(int skip, int force) {
        UnionFind uf = new UnionFind(n);
        int total = 0;
        if (force != -1) {
            uf.union(edges[force][0], edges[force][1]);
            total += edges[force][2];
        }
        for (int[] e : sorted) {
            if (e[3] == skip || e[3] == force) continue;
            if (uf.union(e[0], e[1])) total += e[2];
        }
        return uf.count == 1 ? total : Integer.MAX_VALUE;   // disconnected → impossible
    }
}
