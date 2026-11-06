class NumMatrix {
    vector<vector<int>> P; // P[r][c] = sum of matrix[0..r-1][0..c-1]; row 0 and column 0 are zeros

public:
    NumMatrix(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        P.assign(m + 1, vector<int>(n + 1, 0));
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                P[r + 1][c + 1] = matrix[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];
            }
        }
    }

    int sumRegion(int row1, int col1, int row2, int col2) {
        return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1];
    }
};
