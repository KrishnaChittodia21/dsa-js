class Solution {
public:
    int maxResult(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> best(n);    // best[i] = best score standing on i
        deque<int> dq;          // indices, best[...] decreasing front → back
        best[0] = nums[0];
        dq.push_back(0);
        for (int i = 1; i < n; i++) {
            if (dq.front() < i - k) dq.pop_front();         // out of jumping range
            best[i] = nums[i] + best[dq.front()];           // come from the best reachable index
            while (!dq.empty() && best[dq.back()] <= best[i]) dq.pop_back();
            dq.push_back(i);
        }
        return best[n - 1];
    }
};
