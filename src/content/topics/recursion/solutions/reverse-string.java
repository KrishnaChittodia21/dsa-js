class Solution {
    public void reverseString(char[] s) {
        go(s, 0, s.length - 1);
    }

    private void go(char[] s, int l, int r) {
        if (l >= r) return;                     // base case: nothing (or one char) left
        char t = s[l];                          // fix the two ends
        s[l] = s[r];
        s[r] = t;
        go(s, l + 1, r - 1);                    // trust the call to reverse the middle
    }
}
