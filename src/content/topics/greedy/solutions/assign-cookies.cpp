class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int child = 0;
        for (size_t cookie = 0; cookie < s.size() && child < (int)g.size(); cookie++) {
            if (s[cookie] >= g[child]) child++; // smallest cookie that satisfies the least greedy child
        }
        return child;                           // number of satisfied children
    }
};
