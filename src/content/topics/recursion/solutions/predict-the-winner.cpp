class Solution {
public:
    bool predictTheWinner(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> memo(n, vector<int>(n));
        vector<vector<bool>> seen(n, vector<bool>(n, false));  // memo[i][j] = best difference for the player to move
        return diff(nums, 0, n - 1, memo, seen) >= 0;           // ties go to player 1
    }

private:
    int diff(vector<int>& nums, int i, int j, vector<vector<int>>& memo, vector<vector<bool>>& seen) {
        if (i == j) return nums[i];             // one number left: take it
        if (seen[i][j]) return memo[i][j];
        int takeLeft = nums[i] - diff(nums, i + 1, j, memo, seen);  // opponent's best counts against me
        int takeRight = nums[j] - diff(nums, i, j - 1, memo, seen);
        seen[i][j] = true;
        return memo[i][j] = max(takeLeft, takeRight);
    }
};
