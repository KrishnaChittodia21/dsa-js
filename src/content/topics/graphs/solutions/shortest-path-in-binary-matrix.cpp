class Solution {
public:
    int shortestPathBinaryMatrix(vector<vector<int>>& grid) {
        int n = grid.size();
        if (grid[0][0] != 0 || grid[n - 1][n - 1] != 0) return -1;
        int dirs[8][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, 1}, {1, -1}, {-1, 1}, {-1, -1}};
        queue<array<int, 3>> q;
        q.push({0, 0, 1});                         // {row, col, cells on the path so far}
        grid[0][0] = 1;                            // visited
        while (!q.empty()) {
            auto [r, c, d] = q.front();
            q.pop();
            if (r == n - 1 && c == n - 1) return d;
            for (auto& dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr < 0 || nr >= n || nc < 0 || nc >= n || grid[nr][nc] != 0) continue;
                grid[nr][nc] = 1;
                q.push({nr, nc, d + 1});
            }
        }
        return -1;
    }
};
