class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> next; // value -> its next greater value in nums2
        stack<int> st;                // values waiting, decreasing bottom -> top
        for (int x : nums2) {
            while (!st.empty() && st.top() < x) {
                next[st.top()] = x;
                st.pop();
            }
            st.push(x);
        }
        vector<int> res;
        for (int v : nums1) {
            auto it = next.find(v);
            res.push_back(it == next.end() ? -1 : it->second);
        }
        return res;
    }
};
