class Solution {
    public int secondBestMst(int n, int[][] edges) {
        // 1. Kruskal: MST weight + which edges were used
        Integer[] order = new Integer[edges.length];
        for (int i = 0; i < edges.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(edges[a][2], edges[b][2]));
        UnionFind uf = new UnionFind(n);
        boolean[] inTree = new boolean[edges.length];
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int best = 0;
        for (int i : order) {
            int u = edges[i][0], v = edges[i][1], w = edges[i][2];
            if (uf.union(u, v)) {
                inTree[i] = true;
                best += w;
                adj.get(u).add(new int[]{v, w});
                adj.get(v).add(new int[]{u, w});
            }
        }
        if (uf.count != 1) return -1;                // disconnected

        // 2. For every source, largest (M1) and strictly second-largest (M2) edge on tree paths
        final int NONE = Integer.MIN_VALUE;          // stands for -Infinity
        int[][] M1 = new int[n][n], M2 = new int[n][n];
        for (int s = 0; s < n; s++) {
            Deque<int[]> stack = new ArrayDeque<>();
            stack.push(new int[]{s, -1, NONE, NONE});
            while (!stack.isEmpty()) {
                int[] top = stack.pop();
                int u = top[0], parent = top[1], m1 = top[2], m2 = top[3];
                M1[s][u] = m1;
                M2[s][u] = m2;
                for (int[] e : adj.get(u)) {
                    int v = e[0], w = e[1];
                    if (v == parent) continue;
                    int a = m1, b = m2;              // push w into the (max, strict second max) pair
                    if (w > a) { b = a; a = w; }
                    else if (w < a && w > b) b = w;
                    stack.push(new int[]{v, u, a, b});
                }
            }
        }

        // 3. Try every single swap
        int answer = Integer.MAX_VALUE;
        for (int i = 0; i < edges.length; i++) {
            if (inTree[i]) continue;
            int u = edges[i][0], v = edges[i][1], w = edges[i][2];
            if (u == v) continue;                    // a self-loop never helps
            if (w > M1[u][v]) answer = Math.min(answer, best - M1[u][v] + w);
            else if (M2[u][v] != NONE) answer = Math.min(answer, best - M2[u][v] + w);
        }
        return answer == Integer.MAX_VALUE ? -1 : answer;
    }
}

class UnionFind {
    int[] parent, rank;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
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
        count--;
        return true;
    }
}
