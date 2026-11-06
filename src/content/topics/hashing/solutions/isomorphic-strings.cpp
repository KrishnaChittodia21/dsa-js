class Solution {
public:
    bool isIsomorphic(string s, string t) {
        if (s.size() != t.size()) return false;
        unordered_map<char, char> sToT, tToS;
        for (size_t i = 0; i < s.size(); i++) {
            char a = s[i], b = t[i];
            if (sToT.count(a) && sToT[a] != b) return false; // a already maps elsewhere
            if (tToS.count(b) && tToS[b] != a) return false; // b already taken by another char
            sToT[a] = b;
            tToS[b] = a;
        }
        return true;
    }
};
