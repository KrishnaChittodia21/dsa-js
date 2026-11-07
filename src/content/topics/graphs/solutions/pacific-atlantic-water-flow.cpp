class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        vector<pair<int, int>> pacStarts, atlStarts;
        for (int r = 0; r < R; r++) { pacStarts.push_back({r, 0}); atlStarts.push_back({r, C - 1}); }
        for (int c = 0; c < C; c++) { pacStarts.push_back({0, c}); atlStarts.push_back({R - 1, c}); }
        auto pac = climb(heights, pacStarts), atl = climb(heights, atlStarts);

        vector<vector<int>> result;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (pac[r][c] && atl[r][c]) result.push_back({r, c});
        return result;
    }

private:
    // BFS that CLIMBS from the given border cells; returns a visited grid
    vector<vector<bool>> climb(vector<vector<int>>& heights, vector<pair<int, int>>& starts) {
        int R = heights.size(), C = heights[0].size();
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        vector<vector<bool>> seen(R, vector<bool>(C, false));
        queue<pair<int, int>> q;
        for (auto [r, c] : starts) {
            if (!seen[r][c]) { seen[r][c] = true; q.push({r, c}); }
        }
        while (!q.empty()) {
            auto [r, c] = q.front();
            q.pop();
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                if (seen[nr][nc] || heights[nr][nc] < heights[r][c]) continue;
                seen[nr][nc] = true;
                q.push({nr, nc});
            }
        }
        return seen;
    }
};
