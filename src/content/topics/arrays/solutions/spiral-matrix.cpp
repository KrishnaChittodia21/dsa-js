class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> out;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);    // → top row
            top++;
            for (int r = top; r <= bottom; r++) out.push_back(matrix[r][right]);  // ↓ right column
            right--;
            if (top <= bottom) {                                                  // a bottom row still exists
                for (int c = right; c >= left; c--) out.push_back(matrix[bottom][c]); // ← bottom row
                bottom--;
            }
            if (left <= right) {                                                  // a left column still exists
                for (int r = bottom; r >= top; r--) out.push_back(matrix[r][left]);   // ↑ left column
                left++;
            }
        }
        return out;
    }
};
