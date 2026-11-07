class Solution {
public:
    int maxEnvelopes(vector<vector<int>>& envelopes) {
        // width ascending; equal widths -> height DESCENDING (so they cannot chain)
        vector<vector<int>> sorted = envelopes;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];
        });

        vector<int> tails;                      // patience sorting on heights
        for (const auto& e : sorted) {
            auto it = lower_bound(tails.begin(), tails.end(), e[1]);   // lower bound -> strictly increasing
            if (it == tails.end()) tails.push_back(e[1]);
            else *it = e[1];
        }
        return tails.size();
    }
};
