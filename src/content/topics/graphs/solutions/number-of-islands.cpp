class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int R = grid.size(), C = grid[0].size();
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        int islands = 0;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (grid[r][c] != '1') continue;
                islands++;
                grid[r][c] = '0';                   // sink on push
                vector<pair<int, int>> stack{{r, c}};
                while (!stack.empty()) {
                    auto [cr, cc] = stack.back();
                    stack.pop_back();
                    for (int d = 0; d < 4; d++) {
                        int nr = cr + dr[d], nc = cc + dc[d];
                        if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] != '1') continue;
                        grid[nr][nc] = '0';
                        stack.push_back({nr, nc});
                    }
                }
            }
        }
        return islands;
    }
};
