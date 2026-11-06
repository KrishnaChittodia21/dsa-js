class Solution {
public:
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int best = 1;
        for (int i = 0; i < n; i++) {
            map<pair<int, int>, int> slopes;         // normalised direction -> count
            int localBest = 0;
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = gcd(abs(dx), abs(dy));
                dx /= g;
                dy /= g;
                if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }   // one sign per direction
                localBest = max(localBest, ++slopes[{dy, dx}]);
            }
            best = max(best, localBest + 1);         // + the anchor itself
        }
        return best;
    }
};
