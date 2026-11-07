class Solution {
public:
    void reverseString(vector<char>& s) {
        go(s, 0, (int)s.size() - 1);
    }

private:
    void go(vector<char>& s, int l, int r) {
        if (l >= r) return;                     // base case: nothing (or one char) left
        swap(s[l], s[r]);                       // fix the two ends
        go(s, l + 1, r - 1);                    // trust the call to reverse the middle
    }
};
