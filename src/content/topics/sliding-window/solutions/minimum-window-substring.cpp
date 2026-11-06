class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char, int> need;
        for (char c : t) need[c]++;

        int missing = t.size();         // characters still required
        int left = 0;
        int bestStart = 0, bestLen = INT_MAX;

        for (int right = 0; right < (int) s.size(); right++) {
            char c = s[right];
            if (need[c] > 0) missing--;
            need[c]--;

            while (missing == 0) {      // window covers t → try to shrink it
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                char out = s[left];
                need[out]++;
                if (need[out] > 0) missing++;  // we just removed a required char
                left++;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);
    }
};
