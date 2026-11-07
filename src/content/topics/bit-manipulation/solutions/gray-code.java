class Solution {
    public int[] grayCode(int n) {
        int[] res = new int[1 << n];
        for (int i = 0; i < res.length; i++) res[i] = i ^ (i >> 1);
        return res;
    }
}
