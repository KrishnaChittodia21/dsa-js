class Solution {
public:
    vector<int> nextGreaterElements(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, -1);
        stack<int> st; // indices waiting; values non-increasing
        for (int k = 0; k < 2 * n; k++) {
            int i = k % n;
            while (!st.empty() && nums[st.top()] < nums[i]) {
                res[st.top()] = nums[i];
                st.pop();
            }
            if (k < n) st.push(i); // second lap only answers, never waits
        }
        return res;
    }
};
