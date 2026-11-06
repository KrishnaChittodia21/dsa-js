class Solution {
public:
    int findCenter(vector<vector<int>>& edges) {
        int a = edges[0][0], b = edges[0][1];
        int c = edges[1][0], d = edges[1][1];
        // The center is the only vertex in both of the first two edges.
        return a == c || a == d ? a : b;
    }
};
