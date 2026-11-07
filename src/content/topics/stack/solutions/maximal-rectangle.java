class Solution {
    public int maximalRectangle(char[][] matrix) {
        int cols = matrix[0].length;
        int[] heights = new int[cols];
        int best = 0;
        for (char[] row : matrix) {
            for (int c = 0; c < cols; c++) {
                heights[c] = row[c] == '1' ? heights[c] + 1 : 0;   // consecutive 1s ending here
            }
            best = Math.max(best, largestInHistogram(heights));
        }
        return best;
    }

    private int largestInHistogram(int[] heights) {
        int cols = heights.length;
        Deque<Integer> st = new ArrayDeque<>();
        int area = 0;
        for (int i = 0; i <= cols; i++) {
            int h = i == cols ? 0 : heights[i];
            while (!st.isEmpty() && heights[st.peek()] >= h) {
                int height = heights[st.pop()];
                int left = st.isEmpty() ? -1 : st.peek();
                area = Math.max(area, height * (i - left - 1));
            }
            st.push(i);
        }
        return area;
    }
}
