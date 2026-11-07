class Solution {
    public boolean validPath(int n, int[][] edges, int source, int destination) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }

        boolean[] visited = new boolean[n];
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(source);
        visited[source] = true;
        while (!stack.isEmpty()) {
            int u = stack.pop();
            if (u == destination) return true;
            for (int v : adj.get(u)) {
                if (!visited[v]) { visited[v] = true; stack.push(v); }
            }
        }
        return false;
    }
}
