class Solution {
public:
    int findJudge(int n, vector<vector<int>>& trust) {
        vector<int> score(n + 1, 0);               // in-degree minus out-degree
        for (auto& t : trust) {
            score[t[0]]--;                         // a trusts someone → cannot be the judge
            score[t[1]]++;
        }
        for (int p = 1; p <= n; p++) if (score[p] == n - 1) return p;
        return -1;
    }
};
