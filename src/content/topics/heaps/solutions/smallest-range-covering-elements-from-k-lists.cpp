class Solution {
public:
    vector<int> smallestRange(vector<vector<int>>& nums) {
        // min-heap of {value, list, index}
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;
        int curMax = INT_MIN;
        for (int i = 0; i < (int) nums.size(); i++) {
            pq.emplace(nums[i][0], i, 0);
            curMax = max(curMax, nums[i][0]);
        }
        vector<int> best = {get<0>(pq.top()), curMax};
        while (true) {
            auto [minVal, i, j] = pq.top();
            pq.pop();
            // long long: the width of a range can pass 2^31
            if ((long long) curMax - minVal < (long long) best[1] - best[0]) best = {minVal, curMax};
            if (j + 1 == (int) nums[i].size()) break; // list i exhausted: cannot cover it any more
            int next = nums[i][j + 1];
            pq.emplace(next, i, j + 1);
            curMax = max(curMax, next);
        }
        return best;
    }
};
