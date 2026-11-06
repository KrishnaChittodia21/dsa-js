class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;  // indices; nums[...] decreasing from front to back
        vector<int> res;
        for (int i = 0; i < (int)nums.size(); i++) {
            // 1. Older, smaller-or-equal values can never be a maximum again.
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
            dq.push_back(i);
            // 2. The front may have slid out of the window.
            if (dq.front() <= i - k) dq.pop_front();
            // 3. Front = maximum of the current window.
            if (i >= k - 1) res.push_back(nums[dq.front()]);
        }
        return res;
    }
};
