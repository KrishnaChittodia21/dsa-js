class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> out;
        int s = newInterval[0], e = newInterval[1];
        int i = 0, n = intervals.size();

        // 1. entirely before the new interval
        while (i < n && intervals[i][1] < s) out.push_back(intervals[i++]);

        // 2. overlapping (or touching) — absorb into [s, e]
        while (i < n && intervals[i][0] <= e) {
            s = min(s, intervals[i][0]);
            e = max(e, intervals[i][1]);
            i++;
        }
        out.push_back({s, e});

        // 3. entirely after
        while (i < n) out.push_back(intervals[i++]);
        return out;
    }
};
