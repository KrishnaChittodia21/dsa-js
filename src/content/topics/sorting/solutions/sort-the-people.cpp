class Solution {
public:
    vector<string> sortPeople(vector<string>& names, vector<int>& heights) {
        int n = names.size();
        vector<int> idx(n);
        iota(idx.begin(), idx.end(), 0);
        sort(idx.begin(), idx.end(), [&](int i, int j) { return heights[i] > heights[j]; });  // tallest first
        vector<string> out;
        for (int i : idx) out.push_back(names[i]);
        return out;
    }
};
