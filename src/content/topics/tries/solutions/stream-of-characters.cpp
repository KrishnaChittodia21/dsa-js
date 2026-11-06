struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEnd = false;
};

class StreamChecker {
    TrieNode* root = new TrieNode();
    int maxLen = 0;
    string history;

public:
    StreamChecker(vector<string>& words) {
        for (const string& w : words) {
            maxLen = max(maxLen, (int) w.size());
            TrieNode* node = root;
            for (int i = (int) w.size() - 1; i >= 0; i--) {   // insert REVERSED
                char ch = w[i];
                if (!node->children.count(ch)) node->children[ch] = new TrieNode();
                node = node->children[ch];
            }
            node->isEnd = true;
        }
    }

    bool query(string letter) {
        history += letter[0];
        if ((int) history.size() > 2 * maxLen) {               // keep only what can still matter
            history.erase(0, history.size() - maxLen);
        }
        TrieNode* node = root;
        int n = history.size();
        for (int i = n - 1; i >= 0 && i >= n - maxLen; i--) {
            auto it = node->children.find(history[i]);
            if (it == node->children.end()) return false;      // no word ends like this
            node = it->second;
            if (node->isEnd) return true;
        }
        return false;
    }
};
