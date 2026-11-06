class Solution {
    public String crackSafe(int n, int k) {
        Set<String> used = new HashSet<>();      // passwords (edges) already used
        StringBuilder digits = new StringBuilder();
        String start = "0".repeat(n - 1);

        // Iterative Hierholzer DFS (explicit stack) so deep inputs don't overflow the browser's stack.
        // Each frame: the state, the next digit to try, and the edge digit that led here (-1 for start).
        Deque<String> states = new ArrayDeque<>();
        Deque<int[]> frames = new ArrayDeque<>(); // {nextDigit, edgeDigit}
        states.push(start);
        frames.push(new int[]{0, -1});

        while (!states.isEmpty()) {
            String state = states.peek();
            int[] frame = frames.peek();
            if (frame[0] < k) {
                int d = frame[0]++;
                String password = state + d;
                if (!used.add(password)) continue;
                states.push(password.substring(1)); // next state = last n - 1 digits
                frames.push(new int[]{0, d});
            } else {
                states.pop();
                frames.pop();
                if (frame[1] >= 0) digits.append(frame[1]); // post-order: record the edge after its subtree
            }
        }
        return digits.toString() + start;
    }
}
