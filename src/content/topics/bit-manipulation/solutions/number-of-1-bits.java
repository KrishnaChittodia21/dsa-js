class Solution {
    public int hammingWeight(long n) {
        int x = (int) n;       // the 32-bit pattern of n
        int count = 0;
        while (x != 0) {
            x &= x - 1;        // drop the lowest set bit
            count++;
        }
        return count;
    }
}
