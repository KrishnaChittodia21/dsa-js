class Solution {
public:
    void solve(vector<vector<char>>& board) {
        int R = board.size(), C = board[0].size();
        queue<pair<int, int>> q;
        auto markSafe = [&](int r, int c) {
            if (board[r][c] == 'O') { board[r][c] = 'S'; q.push({r, c}); }
        };
        // 1. seed with every border O
        for (int r = 0; r < R; r++) { markSafe(r, 0); markSafe(r, C - 1); }
        for (int c = 0; c < C; c++) { markSafe(0, c); markSafe(R - 1, c); }

        // 2. BFS inward: everything reachable from the border is safe
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.empty()) {
            auto [r, c] = q.front();
            q.pop();
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C) markSafe(nr, nc);
            }
        }

        // 3. capture the rest, restore the safe ones
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                board[r][c] = board[r][c] == 'S' ? 'O' : 'X';
    }
};
