class Solution {
    public int[][] criticalConnections(int n, int[][] connections) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int id = 0; id < connections.length; id++) {
            int a = connections[id][0], b = connections[id][1];
            adj.get(a).add(new int[]{b, id});
            adj.get(b).add(new int[]{a, id});
        }

        int[] disc = new int[n], low = new int[n];
        Arrays.fill(disc, -1);
        List<int[]> bridges = new ArrayList<>();
        int time = 0;

        for (int s = 0; s < n; s++) {
            if (disc[s] != -1) continue;
            disc[s] = low[s] = time++;
            Deque<int[]> stack = new ArrayDeque<>();
            stack.push(new int[]{s, -1, 0});                 // {node, parentEdgeId, next neighbour index}
            while (!stack.isEmpty()) {
                int[] frame = stack.peek();
                int u = frame[0];
                if (frame[2] < adj.get(u).size()) {
                    int[] e = adj.get(u).get(frame[2]++);
                    int v = e[0], id = e[1];
                    if (id == frame[1]) continue;            // the cable we arrived through
                    if (disc[v] == -1) {                     // tree edge: "recurse"
                        disc[v] = low[v] = time++;
                        stack.push(new int[]{v, id, 0});
                    } else {                                 // back edge to an ancestor
                        low[u] = Math.min(low[u], disc[v]);
                    }
                } else {                                     // u is finished: "return" to parent
                    stack.pop();
                    if (!stack.isEmpty()) {
                        int p = stack.peek()[0];
                        low[p] = Math.min(low[p], low[u]);
                        if (low[u] > disc[p]) bridges.add(new int[]{p, u});
                    }
                }
            }
        }
        return bridges.toArray(new int[0][]);
    }
}
