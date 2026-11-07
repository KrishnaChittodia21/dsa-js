class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        unordered_set<string> seen;
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char d = board[r][c];
                if (d == '.') continue;
                int b = (r / 3) * 3 + c / 3;
                string keys[] = { "r" + to_string(r) + ":" + d, "c" + to_string(c) + ":" + d, "b" + to_string(b) + ":" + d };
                for (const string& k : keys) {
                    if (!seen.insert(k).second) return false;   // same digit twice in a row/col/box
                }
            }
        }
        return true;
    }
};
