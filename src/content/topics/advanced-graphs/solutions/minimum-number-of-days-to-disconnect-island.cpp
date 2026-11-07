class Solution {
    const int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    int m = 0, n = 0, time = 0;
    vector<int> disc, low;
    bool hasCut = false;

    bool isLand(const vector<vector<int>>& grid, int r, int c) {
        return r >= 0 && r < m && c >= 0 && c < n && grid[r][c] == 1;
    }

    void dfs(const vector<vector<int>>& grid, int u, int parent) {
        disc[u] = low[u] = time++;
        int r = u / n, c = u % n;
        int children = 0;
        for (auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (!isLand(grid, nr, nc)) continue;
            int v = nr * n + nc;
            if (v == parent) continue;               // grids have no parallel edges
            if (disc[v] == -1) {
                children++;
                dfs(grid, v, u);
                low[u] = min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) hasCut = true;
            } else {
                low[u] = min(low[u], disc[v]);
            }
        }
        if (parent == -1 && children >= 2) hasCut = true;
    }

public:
    int minDays(vector<vector<int>>& grid) {
        m = grid.size();
        n = grid[0].size();

        // 1. Count land cells and islands
        int land = 0, islands = 0, first = -1;
        vector<bool> seen(m * n, false);
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (!isLand(grid, r, c)) continue;
                land++;
                if (seen[r * n + c]) continue;
                islands++;
                if (first == -1) first = r * n + c;
                vector<pair<int, int>> stack = {{r, c}};
                seen[r * n + c] = true;
                while (!stack.empty()) {
                    auto [x, y] = stack.back();
                    stack.pop_back();
                    for (auto& d : dirs) {
                        int nx = x + d[0], ny = y + d[1];
                        if (isLand(grid, nx, ny) && !seen[nx * n + ny]) { seen[nx * n + ny] = true; stack.push_back({nx, ny}); }
                    }
                }
            }
        }
        if (islands != 1) return 0;
        if (land == 1) return 1;

        // 2. Low-link DFS: does the island have an articulation point?
        disc.assign(m * n, -1);
        low.assign(m * n, 0);
        time = 0;
        hasCut = false;
        dfs(grid, first, -1);
        return hasCut ? 1 : 2;
    }
};
