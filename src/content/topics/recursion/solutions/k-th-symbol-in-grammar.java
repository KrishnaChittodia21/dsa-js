class Solution {
    public int kthGrammar(int n, int k) {
        if (n == 1) return 0;                   // row 1 is "0"
        int parent = kthGrammar(n - 1, (k + 1) / 2);
        // odd k = left child (copy parent), even k = right child (flip parent)
        return k % 2 == 1 ? parent : 1 - parent;
    }
}
