class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        int perimeter = 0;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (grid[r][c] != 1) continue;
                perimeter += 4;
                if (r + 1 < R && grid[r + 1][c] == 1) perimeter -= 2; // shared edge below
                if (c + 1 < C && grid[r][c + 1] == 1) perimeter -= 2; // shared edge right
            }
        }
        return perimeter;
    }
};
