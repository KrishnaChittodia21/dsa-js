class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; }); // earliest end first
        int kept = 0;
        long long lastEnd = LLONG_MIN;
        for (const auto& in : sorted) {
            if (in[0] >= lastEnd) { // touching is fine
                kept++;
                lastEnd = in[1];
            }
        }
        return (int)intervals.size() - kept;
    }
};
