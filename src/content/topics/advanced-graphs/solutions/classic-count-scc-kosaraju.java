class Solution {
    public int countSCC(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>(), rg = new ArrayList<>();
        for (int i = 0; i < n; i++) { g.add(new ArrayList<>()); rg.add(new ArrayList<>()); }
        for (int[] e : edges) { g.get(e[0]).add(e[1]); rg.get(e[1]).add(e[0]); }

        // Pass 1: iterative DFS, record nodes in finishing order
        boolean[] seen = new boolean[n];
        int[] order = new int[n];
        int finished = 0;
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            seen[s] = true;
            Deque<int[]> stack = new ArrayDeque<>();
            stack.push(new int[]{s, 0});             // {node, index of next neighbour}
            while (!stack.isEmpty()) {
                int[] top = stack.peek();
                int u = top[0];
                if (top[1] < g.get(u).size()) {
                    int v = g.get(u).get(top[1]++);
                    if (!seen[v]) { seen[v] = true; stack.push(new int[]{v, 0}); }
                } else {
                    order[finished++] = u;           // u has finished
                    stack.pop();
                }
            }
        }

        // Pass 2: flood fill on the transpose in decreasing finish time
        int[] comp = new int[n];
        Arrays.fill(comp, -1);
        int count = 0;
        for (int i = n - 1; i >= 0; i--) {
            int s = order[i];
            if (comp[s] != -1) continue;
            comp[s] = count;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(s);
            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : rg.get(u)) {
                    if (comp[v] == -1) { comp[v] = count; stack.push(v); }
                }
            }
            count++;
        }
        return count;
    }
}
