class Solution {
    public int singleNumber(int[] nums) {
        int ones = 0, twos = 0;            // per-bit counters mod 3
        for (int x : nums) {
            ones = (ones ^ x) & ~twos;     // bits seen 1 (mod 3) times
            twos = (twos ^ x) & ~ones;     // bits seen 2 (mod 3) times
        }
        return ones;
    }
}
