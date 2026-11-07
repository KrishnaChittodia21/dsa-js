class Solution {
public:
    int findMaxLength(vector<int>& nums) {
        unordered_map<int, int> first{{0, -1}}; // balance -> first index where it occurred
        int balance = 0, best = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            balance += nums[i] == 1 ? 1 : -1;
            auto it = first.find(balance);
            if (it != first.end()) {
                best = max(best, i - it->second); // (first, i] is balanced
            } else {
                first[balance] = i;               // keep only the earliest
            }
        }
        return best;
    }
};
