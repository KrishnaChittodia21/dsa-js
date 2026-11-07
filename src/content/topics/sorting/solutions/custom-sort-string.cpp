class Solution {
public:
    string customSortString(string order, string s) {
        int count[26] = {0};
        for (char c : s) count[c - 'a']++;

        string out;
        for (char c : order) {                  // letters in the custom order
            int k = c - 'a';
            out.append(count[k], c);
            count[k] = 0;
        }
        for (int k = 0; k < 26; k++) {          // everything else, anywhere
            out.append(count[k], (char)('a' + k));
        }
        return out;
    }
};
