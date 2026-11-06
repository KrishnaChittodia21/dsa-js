class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups; // sorted letters → words
        for (const string& s : strs) {
            string k = s;
            sort(k.begin(), k.end());
            groups[k].push_back(s);
        }
        vector<vector<string>> out;
        for (auto& [k, g] : groups) out.push_back(g);
        return out;
    }
};
