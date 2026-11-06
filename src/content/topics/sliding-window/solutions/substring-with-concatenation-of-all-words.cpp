class Solution {
public:
    vector<int> findSubstring(string s, vector<string>& words) {
        int L = words[0].size(), m = words.size(), n = s.size();
        unordered_map<string, int> need;
        for (const string& w : words) need[w]++;
        vector<int> result;

        for (int offset = 0; offset < L; offset++) {
            unordered_map<string, int> seen;
            int left = offset, used = 0;
            for (int j = offset; j + L <= n; j += L) {
                string w = s.substr(j, L);
                if (!need.count(w)) {                  // impossible word → restart after it
                    seen.clear();
                    used = 0;
                    left = j + L;
                    continue;
                }
                seen[w]++;
                used++;
                while (seen[w] > need[w]) {            // too many copies of w → shrink
                    seen[s.substr(left, L)]--;
                    used--;
                    left += L;
                }
                if (used == m) {                       // window holds exactly the multiset
                    result.push_back(left);
                    seen[s.substr(left, L)]--;
                    used--;
                    left += L;
                }
            }
        }
        sort(result.begin(), result.end());
        return result;
    }
};
