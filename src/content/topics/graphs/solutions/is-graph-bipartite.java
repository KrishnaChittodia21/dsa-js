class Solution {
    public boolean isBipartite(int[][] graph) {
        int n = graph.length;
        int[] color = new int[n];
        Arrays.fill(color, -1);
        for (int s = 0; s < n; s++) {
            if (color[s] != -1) continue;          // already handled with its component
            color[s] = 0;
            ArrayDeque<Integer> queue = new ArrayDeque<>();
            queue.add(s);
            while (!queue.isEmpty()) {
                int u = queue.poll();
                for (int v : graph[u]) {
                    if (color[v] == -1) {
                        color[v] = 1 - color[u];   // forced opposite colour
                        queue.add(v);
                    } else if (color[v] == color[u]) {
                        return false;              // same colour on both ends → odd cycle
                    }
                }
            }
        }
        return true;
    }
}
