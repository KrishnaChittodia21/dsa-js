class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        int n = heights.size();
        stack<int> st;                                   // indices, heights increasing
        int best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];             // sentinel flushes the stack
            while (!st.empty() && heights[st.top()] >= h) {
                int height = heights[st.top()];
                st.pop();
                int left = st.empty() ? -1 : st.top();   // previous smaller bar
                best = max(best, height * (i - left - 1)); // i = next smaller bar
            }
            st.push(i);
        }
        return best;
    }
};
