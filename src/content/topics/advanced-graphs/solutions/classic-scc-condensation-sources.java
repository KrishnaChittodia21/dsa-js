class Solution {
    public int minStartNodes(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>(), rg = new ArrayList<>();
        for (int i = 0; i < n; i++) { g.add(new ArrayList<>()); rg.add(new ArrayList<>()); }
        for (int[] e : edges) { g.get(e[0]).add(e[1]); rg.get(e[1]).add(e[0]); }

        // Kosaraju pass 1: finishing order (iterative)
        boolean[] seen = new boolean[n];
        int[] order = new int[n];
        int finished = 0;
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            seen[s] = true;
            Deque<int[]> stack = new ArrayDeque<>();
            stack.push(new int[]{s, 0});
            while (!stack.isEmpty()) {
                int[] top = stack.peek();
                int u = top[0];
                if (top[1] < g.get(u).size()) {
                    int v = g.get(u).get(top[1]++);
                    if (!seen[v]) { seen[v] = true; stack.push(new int[]{v, 0}); }
                } else { order[finished++] = u; stack.pop(); }
            }
        }

        // Kosaraju pass 2: component ids on the transpose
        int[] comp = new int[n];
        Arrays.fill(comp, -1);
        int c = 0;
        for (int i = n - 1; i >= 0; i--) {
            int s = order[i];
            if (comp[s] != -1) continue;
            comp[s] = c;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(s);
            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : rg.get(u)) if (comp[v] == -1) { comp[v] = c; stack.push(v); }
            }
            c++;
        }

        // Condensation: which components have an incoming edge from another component?
        boolean[] hasIncoming = new boolean[c];
        for (int[] e : edges) {
            if (comp[e[0]] != comp[e[1]]) hasIncoming[comp[e[1]]] = true;
        }
        int sources = 0;
        for (int k = 0; k < c; k++) if (!hasIncoming[k]) sources++;
        return sources;
    }
}
