class Solution {
    public int[] eventualSafeNodes(int[][] graph) {
        int n = graph.length;
        // 0 = unvisited, 1 = visiting OR proven unsafe, 2 = safe
        int[] color = new int[n];
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < n; i++) if (isSafe(graph, color, i)) result.add(i);
        return result.stream().mapToInt(Integer::intValue).toArray(); // already ascending
    }

    private boolean isSafe(int[][] graph, int[] color, int u) {
        if (color[u] != 0) return color[u] == 2; // gray here = cycle (or known unsafe)
        color[u] = 1;
        for (int v : graph[u]) {
            if (!isSafe(graph, color, v)) return false; // u stays 1 -> unsafe forever
        }
        color[u] = 2;
        return true;
    }
}
