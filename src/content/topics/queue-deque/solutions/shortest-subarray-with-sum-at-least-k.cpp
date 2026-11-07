class Solution {
public:
    int shortestSubarray(vector<int>& nums, int k) {
        int n = nums.size();
        vector<long long> P(n + 1, 0);  // P[j] = sum of nums[0..j-1]
        for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];

        deque<int> dq;  // candidate start indices, P increasing
        int best = INT_MAX;
        for (int j = 0; j <= n; j++) {
            // Front rule: a valid subarray ends here; later ends can only be longer.
            while (!dq.empty() && P[j] - P[dq.front()] >= k) {
                best = min(best, j - dq.front());
                dq.pop_front();
            }
            // Back rule: j is a later start with a smaller-or-equal prefix -> dominates.
            while (!dq.empty() && P[dq.back()] >= P[j]) dq.pop_back();
            dq.push_back(j);
        }
        return best == INT_MAX ? -1 : best;
    }
};
