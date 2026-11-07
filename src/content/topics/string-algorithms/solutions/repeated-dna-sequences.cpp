class Solution {
public:
    vector<string> findRepeatedDnaSequences(string s) {
        const int L = 10;
        const int mask = (1 << (2 * L)) - 1; // 20 bits = 0xFFFFF
        unordered_set<int> seen, added;
        vector<string> res;
        int code = 0;

        for (int i = 0; i < (int) s.size(); i++) {
            int val = s[i] == 'A' ? 0 : s[i] == 'C' ? 1 : s[i] == 'G' ? 2 : 3;
            code = ((code << 2) | val) & mask;       // slide: push new letter, drop the oldest
            if (i < L - 1) continue;                 // window not full yet
            if (!seen.insert(code).second && added.insert(code).second) res.push_back(s.substr(i - L + 1, L));
        }
        return res;
    }
};
