class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        int m = p.size(), n = s.size();
        vector<int> result;
        if (m > n) return result;
        int need[26] = {0};
        for (char ch : p) need[ch - 'a']++;
        int missing = m;

        for (int right = 0; right < n; right++) {
            int inC = s[right] - 'a';
            if (need[inC] > 0) missing--;   // this letter was still needed
            need[inC]--;

            if (right >= m) {                // keep the window at size m
                int outC = s[right - m] - 'a';
                need[outC]++;
                if (need[outC] > 0) missing++; // we removed a needed letter
            }
            if (right >= m - 1 && missing == 0) result.push_back(right - m + 1);
        }
        return result;
    }
};
