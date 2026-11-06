class Solution {
public:
    int nearestExit(vector<vector<char>>& maze, vector<int>& entrance) {
        int R = maze.size(), C = maze[0].size();
        int sr = entrance[0], sc = entrance[1];
        maze[sr][sc] = '+';                        // mark visited
        vector<pair<int, int>> frontier = {{sr, sc}};
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int steps = 0; !frontier.empty(); steps++) {
            vector<pair<int, int>> next;
            for (auto [r, c] : frontier) {
                for (auto& d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nc < 0 || nr >= R || nc >= C || maze[nr][nc] != '.') continue;
                    if (nr == 0 || nc == 0 || nr == R - 1 || nc == C - 1) return steps + 1;
                    maze[nr][nc] = '+';            // mark when enqueued
                    next.push_back({nr, nc});
                }
            }
            frontier = next;
        }
        return -1;
    }
};
