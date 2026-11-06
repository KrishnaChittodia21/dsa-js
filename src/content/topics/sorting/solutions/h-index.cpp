class Solution {
public:
    int hIndex(vector<int>& citations) {
        vector<int> c = citations;                 // don't mutate input
        sort(c.begin(), c.end(), greater<int>());  // most cited first
        int h = 0;
        while (h < (int)c.size() && c[h] >= h + 1) h++; // top h+1 papers all have >= h+1
        return h;
    }
};
