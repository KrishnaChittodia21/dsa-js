class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.size() != t.size()) return false;
        int count[26] = {};
        for (size_t i = 0; i < s.size(); i++) {
            count[s[i] - 'a']++;          // letters of s add
            count[t[i] - 'a']--;          // letters of t cancel
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
};
