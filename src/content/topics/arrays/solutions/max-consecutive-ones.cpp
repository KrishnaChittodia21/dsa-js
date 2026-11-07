class Solution {
public:
    int findMaxConsecutiveOnes(vector<int>& nums) {
        int best = 0;
        int current = 0;              // length of the run of 1s ending here
        for (int x : nums) {
            current = x == 1 ? current + 1 : 0;
            best = max(best, current); // recording every step handles the last run
        }
        return best;
    }
};
