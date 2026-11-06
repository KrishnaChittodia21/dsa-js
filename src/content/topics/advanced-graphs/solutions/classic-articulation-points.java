class Solution {
    private List<List<int[]>> adj;
    private int[] disc, low;
    private boolean[] cut;
    private int time;

    public int[] articulationPoints(int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int id = 0; id < edges.length; id++) {
            int u = edges[id][0], v = edges[id][1];
            adj.get(u).add(new int[]{v, id});
            adj.get(v).add(new int[]{u, id});
        }

        disc = new int[n];
        low = new int[n];
        Arrays.fill(disc, -1);
        cut = new boolean[n];
        time = 0;

        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s, -1);
        // scanning 0..n-1 gives the cut vertices already sorted, each once
        return IntStream.range(0, n).filter(i -> cut[i]).toArray();
    }

    private void dfs(int u, int parentEdge) {
        disc[u] = low[u] = time++;
        int children = 0;
        for (int[] e : adj.get(u)) {
            int v = e[0], id = e[1];
            if (id == parentEdge) continue;          // skip only the edge we came through
            if (disc[v] == -1) {
                children++;
                dfs(v, id);
                low[u] = Math.min(low[u], low[v]);
                // v's subtree cannot climb above u without passing through u
                if (parentEdge != -1 && low[v] >= disc[u]) cut[u] = true;
            } else {
                low[u] = Math.min(low[u], disc[v]);  // back edge to an ancestor
            }
        }
        if (parentEdge == -1 && children >= 2) cut[u] = true;  // root rule
    }
}
