class Solution {
public:
    int shortestBridge(vector<vector<int>>& grid) {
        int n = grid.size();
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        vector<pair<int, int>> frontier;

        // 1. mark the first island with 2 and collect its cells (iterative DFS)
        bool found = false;
        for (int r = 0; r < n && !found; r++) {
            for (int c = 0; c < n && !found; c++) {
                if (grid[r][c] != 1) continue;
                found = true;
                vector<pair<int, int>> stack = {{r, c}};
                grid[r][c] = 2;
                while (!stack.empty()) {
                    auto [cr, cc] = stack.back();
                    stack.pop_back();
                    frontier.push_back({cr, cc});
                    for (auto& d : dirs) {
                        int nr = cr + d[0], nc = cc + d[1];
                        if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 1) {
                            grid[nr][nc] = 2;
                            stack.push_back({nr, nc});
                        }
                    }
                }
            }
        }

        // 2. multi-source BFS through water
        for (int flips = 0; !frontier.empty(); flips++) {
            vector<pair<int, int>> next;
            for (auto [r, c] : frontier) {
                for (auto& d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                    if (grid[nr][nc] == 1) return flips;   // reached the other island
                    if (grid[nr][nc] == 0) {
                        grid[nr][nc] = 2;
                        next.push_back({nr, nc});
                    }
                }
            }
            frontier = next;
        }
        return -1;
    }
};
