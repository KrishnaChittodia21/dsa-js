class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {0};
        int left = 0, maxFreq = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            int c = s[right] - 'A';
            count[c]++;
            maxFreq = max(maxFreq, count[c]);
            // letters to replace = window length - majority count
            if (right - left + 1 - maxFreq > k) {
                count[s[left] - 'A']--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};
