class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> lastSeen; // char -> last index where we saw it
        int left = 0;
        int best = 0;
        for (int right = 0; right < (int) s.size(); right++) {
            char ch = s[right];
            // Only a copy INSIDE the window (index >= left) makes it invalid.
            auto it = lastSeen.find(ch);
            if (it != lastSeen.end() && it->second >= left) {
                left = it->second + 1;
            }
            lastSeen[ch] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};
