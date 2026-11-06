class Solution {
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        int R = matrix.size(), C = matrix[0].size();
        const int DIRS[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        // in-degree = number of strictly smaller neighbours (edges go small -> large)
        vector<int> indeg(R * C, 0);
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                for (auto& d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] < matrix[r][c]) indeg[r * C + c]++;
                }

        vector<int> layer;
        for (int i = 0; i < R * C; i++) if (indeg[i] == 0) layer.push_back(i);
        int length = 0;
        while (!layer.empty()) {
            length++; // one more cell on the longest path
            vector<int> next;
            for (int id : layer) {
                int r = id / C, c = id % C;
                for (auto& d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nr >= R || nc < 0 || nc >= C || matrix[nr][nc] <= matrix[r][c]) continue;
                    int nid = nr * C + nc;
                    if (--indeg[nid] == 0) next.push_back(nid);
                }
            }
            layer = move(next);
        }
        return length;
    }
};
