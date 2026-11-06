class Solution {
public:
    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {
        int old = image[sr][sc];
        if (old == color) return image;         // nothing to do (and avoids infinite recursion)
        fill(image, sr, sc, old, color);
        return image;
    }

private:
    void fill(vector<vector<int>>& image, int r, int c, int old, int color) {
        if (r < 0 || r >= (int)image.size() || c < 0 || c >= (int)image[0].size() || image[r][c] != old) return;
        image[r][c] = color;                    // paint = mark visited
        fill(image, r + 1, c, old, color);
        fill(image, r - 1, c, old, color);
        fill(image, r, c + 1, old, color);
        fill(image, r, c - 1, old, color);
    }
};
