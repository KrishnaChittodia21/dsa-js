class Solution {
public:
    vector<string> wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> dict(wordDict.begin(), wordDict.end());
        unordered_map<int, vector<string>> memo; // start index -> sentences for s[start..]
        return sentences(s, 0, dict, memo);
    }

private:
    vector<string> sentences(const string& s, int start, const unordered_set<string>& dict,
                             unordered_map<int, vector<string>>& memo) {
        if (start == (int)s.size()) return {""};  // one way to finish: nothing left
        auto it = memo.find(start);
        if (it != memo.end()) return it->second;
        vector<string> result;
        for (int end = start + 1; end <= (int)s.size(); end++) {
            string word = s.substr(start, end - start);
            if (!dict.count(word)) continue;
            for (const string& tail : sentences(s, end, dict, memo)) {
                result.push_back(tail.empty() ? word : word + " " + tail);
            }
        }
        memo[start] = result;
        return result;
    }
};
