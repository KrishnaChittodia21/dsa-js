class Solution {
    int n;
    vector<bool> cols, diag, anti; // diag index: row - col + n - 1; anti index: row + col
    vector<int> queenCol;          // queenCol[row] = column of the queen in that row
    vector<vector<string>> result;

    void place(int row) {
        if (row == n) {
            vector<string> board;
            for (int c : queenCol) board.push_back(string(c, '.') + 'Q' + string(n - c - 1, '.'));
            result.push_back(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;
            if (cols[c] || diag[d] || anti[a]) continue; // attacked
            cols[c] = diag[d] = anti[a] = true;           // choose
            queenCol.push_back(c);
            place(row + 1);                               // explore
            cols[c] = diag[d] = anti[a] = false;          // undo
            queenCol.pop_back();
        }
    }

public:
    vector<vector<string>> solveNQueens(int n) {
        this->n = n;
        cols.assign(n, false);
        diag.assign(2 * n - 1, false);
        anti.assign(2 * n - 1, false);
        place(0);
        return result;
    }
};
