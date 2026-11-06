class Solution {
    public int[] singleNumber(int[] nums) {
        int x = 0;
        for (int v : nums) x ^= v;       // x = a ^ b
        int d = x & -x;                  // lowest bit where a and b differ
        int a = 0;
        for (int v : nums) {
            if ((v & d) != 0) a ^= v;    // group with bit d set
        }
        return new int[] {a, x ^ a};
    }
}
