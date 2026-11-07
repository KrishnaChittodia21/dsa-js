class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        // 1. transpose: (r, c) → (c, r). j starts at i + 1 so each pair swaps once.
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);
            }
        }
        // 2. mirror horizontally: (c, r) → (c, n - 1 - r)
        for (auto& row : matrix) reverse(row.begin(), row.end());
    }
};
