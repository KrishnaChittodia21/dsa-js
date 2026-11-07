class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;                    // tails[k] = smallest tail of an increasing subsequence of length k + 1
        for (int x : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), x);   // first >= x: strictly increasing
            if (it == tails.end()) tails.push_back(x);
            else *it = x;
        }
        return tails.size();
    }
};
