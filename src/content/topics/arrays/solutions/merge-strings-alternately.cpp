class Solution {
public:
    string mergeAlternately(string word1, string word2) {
        string out;
        int n = max(word1.size(), word2.size());
        for (int i = 0; i < n; i++) {
            if (i < (int)word1.size()) out += word1[i];
            if (i < (int)word2.size()) out += word2[i];
        }
        return out;
    }
};
