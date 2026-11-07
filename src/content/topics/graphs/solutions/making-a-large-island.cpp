class Solution {
public:
    int largestIsland(vector<vector<int>>& grid) {
        int n = grid.size();
        const int DIRS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        vector<int> size{0, 0};                 // size[id]; ids start at 2
        int best = 0;

        // 1. label every island with an id and remember its size
        int id = 2;
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 1) continue;
                int count = 0;
                vector<pair<int, int>> stack{{r, c}};
                grid[r][c] = id;
                while (!stack.empty()) {
                    auto [cr, cc] = stack.back();
                    stack.pop_back();
                    count++;
                    for (auto& d : DIRS) {
                        int nr = cr + d[0], nc = cc + d[1];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                            grid[nr][nc] = id;
                            stack.push_back({nr, nc});
                        }
                    }
                }
                size.push_back(count);
                id++;
                best = max(best, count);        // baseline: no flip needed
            }
        }

        // 2. try flipping each 0: join the DISTINCT neighbouring islands
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 0) continue;
                set<int> ids;
                for (auto& d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] > 1) ids.insert(grid[nr][nc]);
                }
                int total = 1;
                for (int k : ids) total += size[k];
                best = max(best, total);
            }
        }
        return best;
    }
};
