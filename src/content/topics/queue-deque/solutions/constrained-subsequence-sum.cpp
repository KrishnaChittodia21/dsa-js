class Solution {
public:
    int constrainedSubsetSum(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> best(n);  // best[i] = best sum of a valid subsequence ending at i
        deque<int> dq;        // indices, best[...] decreasing
        int answer = INT_MIN;
        for (int i = 0; i < n; i++) {
            if (!dq.empty() && dq.front() < i - k) dq.pop_front();  // too far back
            int prev = dq.empty() ? 0 : max(0, best[dq.front()]);   // extend or start fresh
            best[i] = nums[i] + prev;
            answer = max(answer, best[i]);
            while (!dq.empty() && best[dq.back()] <= best[i]) dq.pop_back();
            dq.push_back(i);
        }
        return answer;
    }
};
