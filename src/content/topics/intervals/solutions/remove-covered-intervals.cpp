class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {
        // start ascending; on equal start, the LONGER interval first (it covers the others)
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];
        });
        int remaining = 0;
        long long maxEnd = LLONG_MIN;
        for (const auto& in : sorted) {
            if (in[1] > maxEnd) { // not covered by anything earlier
                remaining++;
                maxEnd = in[1];
            }
        }
        return remaining;
    }
};
