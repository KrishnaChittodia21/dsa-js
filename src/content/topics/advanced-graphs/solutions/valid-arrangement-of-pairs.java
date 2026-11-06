class Solution {
    public int[][] validArrangement(int[][] pairs) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        Map<Integer, Integer> balance = new HashMap<>();     // out-degree − in-degree
        for (int[] p : pairs) {
            adj.computeIfAbsent(p[0], k -> new ArrayList<>()).add(p[1]);
            balance.merge(p[0], 1, (a, b) -> a + b);
            balance.merge(p[1], -1, (a, b) -> a + b);
        }

        int start = pairs[0][0];
        for (var e : balance.entrySet()) {
            if (e.getValue() == 1) { start = e.getKey(); break; }  // path must begin here
        }

        // Iterative Hierholzer (no recursion → safe for 10^5 pairs)
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        List<Integer> path = new ArrayList<>();
        while (!stack.isEmpty()) {
            List<Integer> out = adj.get(stack.peek());
            if (out != null && !out.isEmpty()) stack.push(out.remove(out.size() - 1));
            else path.add(stack.pop());
        }
        Collections.reverse(path);

        int[][] result = new int[path.size() - 1][];
        for (int i = 0; i + 1 < path.size(); i++) result[i] = new int[]{path.get(i), path.get(i + 1)};
        return result;
    }
}
