class Solution {
    public int minimumTime(int n, int[][] relations, int[] time) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] r : relations) {                // 1-based → 0-based
            adj.get(r[0] - 1).add(r[1] - 1);
            indeg[r[1] - 1]++;
        }
        int[] finish = time.clone();               // at least its own duration
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.add(i);
        while (!queue.isEmpty()) {
            int u = queue.poll();                  // finish[u] is final
            for (int v : adj.get(u)) {
                finish[v] = Math.max(finish[v], finish[u] + time[v]);
                if (--indeg[v] == 0) queue.add(v);
            }
        }
        int best = 0;
        for (int f : finish) best = Math.max(best, f);
        return best;
    }
}
