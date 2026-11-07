class Solution {
public:
    int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {
        unordered_map<int, int> ab;                  // sum a + b -> how many pairs
        for (int a : nums1) {
            for (int b : nums2) {
                ab[a + b]++;
            }
        }
        int count = 0;
        for (int c : nums3) {
            for (int d : nums4) {
                auto it = ab.find(-(c + d));         // complement lookup
                if (it != ab.end()) count += it->second;
            }
        }
        return count;
    }
};
