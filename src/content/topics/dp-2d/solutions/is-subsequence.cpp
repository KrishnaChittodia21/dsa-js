class Solution {
public:
    bool isSubsequence(string s, string t) {
        size_t i = 0;                        // next character of s to match
        for (size_t j = 0; j < t.size() && i < s.size(); j++) {
            if (s[i] == t[j]) i++;           // greedy match is always safe
        }
        return i == s.size();
    }
};
