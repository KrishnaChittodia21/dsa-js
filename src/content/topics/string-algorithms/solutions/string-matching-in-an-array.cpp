class Solution {
    vector<int> buildLps(const string& p) {
        vector<int> lps(p.size(), 0);
        for (int i = 1, len = 0; i < (int) p.size(); i++) {
            while (len > 0 && p[i] != p[len]) len = lps[len - 1];
            if (p[i] == p[len]) len++;
            lps[i] = len;
        }
        return lps;
    }

    bool occurs(const string& text, const string& p, const vector<int>& lps) {
        for (int i = 0, j = 0; i < (int) text.size(); i++) {
            while (j > 0 && text[i] != p[j]) j = lps[j - 1];
            if (text[i] == p[j]) j++;
            if (j == (int) p.size()) return true;
        }
        return false;
    }

public:
    vector<string> stringMatching(vector<string>& words) {
        vector<string> res;
        for (auto& w : words) {
            vector<int> lps = buildLps(w);
            // only strictly longer words can contain w (all words are distinct)
            for (auto& v : words) {
                if (v.size() > w.size() && occurs(v, w, lps)) {
                    res.push_back(w);
                    break;
                }
            }
        }
        return res;
    }
};
