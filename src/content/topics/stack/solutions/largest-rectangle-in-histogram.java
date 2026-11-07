class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> st = new ArrayDeque<>();          // indices, heights increasing
        int best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];             // sentinel flushes the stack
            while (!st.isEmpty() && heights[st.peek()] >= h) {
                int height = heights[st.pop()];
                int left = st.isEmpty() ? -1 : st.peek();    // previous smaller bar
                best = Math.max(best, height * (i - left - 1)); // i = next smaller bar
            }
            st.push(i);
        }
        return best;
    }
}
