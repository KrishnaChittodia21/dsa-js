class Solution {
    public int maximumInvitations(int[] favorite) {
        int n = favorite.length;
        int[] indeg = new int[n];
        for (int f : favorite) indeg[f]++;

        // 1. Peel tree nodes (Kahn). depth[v] = longest chain of tree nodes ending at v.
        int[] depth = new int[n];
        int[] queue = new int[n];
        int tail = 0;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
        for (int head = 0; head < tail; head++) {
            int u = queue[head], v = favorite[u];
            depth[v] = Math.max(depth[v], depth[u] + 1);
            if (--indeg[v] == 0) queue[tail++] = v;
        }

        // 2. Remaining nodes lie on cycles. Measure each cycle once.
        int bestCycle = 0, pairsTotal = 0;
        boolean[] done = new boolean[n];
        for (int i = 0; i < n; i++) {
            if (indeg[i] == 0 || done[i]) continue;
            int len = 0, j = i;
            while (!done[j]) { done[j] = true; j = favorite[j]; len++; }
            if (len == 2) pairsTotal += 2 + depth[i] + depth[favorite[i]];
            else bestCycle = Math.max(bestCycle, len);
        }
        return Math.max(bestCycle, pairsTotal);
    }
}
