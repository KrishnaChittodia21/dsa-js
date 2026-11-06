class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
        for (size_t i = 1; i < sorted.size(); i++) {
            if (sorted[i][0] < sorted[i - 1][1]) return false; // starts before the previous one ends
        }
        return true;
    }
};
