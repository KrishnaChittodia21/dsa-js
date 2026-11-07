struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEnd = false;
};

class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        // Build a trie of all strings.
        TrieNode* root = new TrieNode();
        for (const string& s : strs) {
            TrieNode* node = root;
            for (char ch : s) {
                if (!node->children.count(ch)) node->children[ch] = new TrieNode();
                node = node->children[ch];
            }
            node->isEnd = true;
        }
        // Follow the single-child chain until a branch or a word end.
        string prefix;
        TrieNode* node = root;
        while (node->children.size() == 1 && !node->isEnd) {
            auto [ch, next] = *node->children.begin();
            prefix += ch;
            node = next;
        }
        return prefix;
    }
};
