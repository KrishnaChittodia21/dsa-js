class Solution {
public:
    string shortestPalindrome(string s) {
        string rev(s.rbegin(), s.rend());
        string t = s + "#" + rev;
        vector<int> lps(t.size(), 0);
        for (int i = 1, len = 0; i < (int) t.size(); i++) {
            while (len > 0 && t[i] != t[len]) len = lps[len - 1];
            if (t[i] == t[len]) len++;
            lps[i] = len;
        }
        int k = lps.back();                             // longest palindromic prefix of s
        return rev.substr(0, s.size() - k) + s;         // = reverse(s.substr(k)) + s
    }
};
