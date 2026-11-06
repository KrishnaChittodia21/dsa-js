class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        queue<array<int, 3>> q;
        int fresh = 0;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (grid[r][c] == 2) q.push({r, c, 0});   // every source at time 0
                else if (grid[r][c] == 1) fresh++;
            }
        }
        const int DIRS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (!q.empty()) {
            auto [r, c, t] = q.front();
            q.pop();
            for (auto& d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] != 1) continue;
                grid[nr][nc] = 2;                 // rot now = visited
                fresh--;
                minutes = t + 1;
                q.push({nr, nc, t + 1});
            }
        }
        return fresh == 0 ? minutes : -1;
    }
};
