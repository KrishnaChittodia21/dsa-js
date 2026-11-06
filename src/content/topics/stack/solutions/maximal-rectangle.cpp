class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {
        int cols = matrix[0].size();
        vector<int> heights(cols, 0);
        int best = 0;
        for (const auto& row : matrix) {
            for (int c = 0; c < cols; c++) {
                heights[c] = row[c] == '1' ? heights[c] + 1 : 0;   // consecutive 1s ending here
            }
            best = max(best, largestInHistogram(heights));
        }
        return best;
    }

private:
    int largestInHistogram(const vector<int>& heights) {
        int cols = heights.size();
        stack<int> st;
        int area = 0;
        for (int i = 0; i <= cols; i++) {
            int h = i == cols ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] >= h) {
                int height = heights[st.top()];
                st.pop();
                int left = st.empty() ? -1 : st.top();
                area = max(area, height * (i - left - 1));
            }
            st.push(i);
        }
        return area;
    }
};
