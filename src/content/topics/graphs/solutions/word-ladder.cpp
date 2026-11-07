class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> dict(wordList.begin(), wordList.end());
        if (!dict.count(endWord)) return 0;
        dict.erase(beginWord);
        dict.erase(endWord);                    // words left in dict = not yet visited

        unordered_set<string> front{beginWord}, back{endWord};
        int length = 1;                         // words in the sequence so far

        while (!front.empty() && !back.empty()) {
            if (front.size() > back.size()) swap(front, back);   // expand the smaller side
            length++;
            unordered_set<string> next;
            for (const string& word : front) {
                string cand = word;
                for (size_t i = 0; i < cand.size(); i++) {
                    char orig = cand[i];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        cand[i] = ch;
                        if (back.count(cand)) return length;     // the two searches meet
                        if (dict.erase(cand)) next.insert(cand);
                    }
                    cand[i] = orig;
                }
            }
            front = move(next);
        }
        return 0;
    }
};
