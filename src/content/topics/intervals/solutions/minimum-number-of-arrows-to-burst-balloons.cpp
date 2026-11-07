class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        vector<vector<int>> sorted = points;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
        int arrows = 0;
        long long arrowX = LLONG_MIN; // below any int, so the first balloon always needs an arrow
        for (const auto& p : sorted) {
            if (p[0] > arrowX) { // closed ranges: s == arrowX is still burst
                arrows++;
                arrowX = p[1]; // shoot as far right as this balloon allows
            }
        }
        return arrows;
    }
};
