class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        int m = s1.size(), n = s2.size();
        if (m > n) return false;
        int need[26] = {0}, have[26] = {0};
        for (int i = 0; i < m; i++) {
            need[s1[i] - 'a']++;
            have[s2[i] - 'a']++;
        }
        int matches = 0;
        for (int c = 0; c < 26; c++) if (need[c] == have[c]) matches++;

        for (int right = m; right < n; right++) {
            if (matches == 26) return true;
            // letter entering on the right
            int c = s2[right] - 'a';
            if (have[c] == need[c]) matches--;
            have[c]++;
            if (have[c] == need[c]) matches++;
            // letter leaving on the left
            c = s2[right - m] - 'a';
            if (have[c] == need[c]) matches--;
            have[c]--;
            if (have[c] == need[c]) matches++;
        }
        return matches == 26;
    }
};
