class Solution {
    public int singleNumber(int[] nums) {
        int x = 0;
        for (int v : nums) x ^= v;   // pairs cancel: v ^ v = 0
        return x;
    }
}
