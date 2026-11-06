struct TrieNode {
    unordered_map<char, TrieNode*> children;
    int count = 0;   // words passing through this node
};

class Solution {
public:
    int prefixCount(vector<string>& words, string pref) {
        TrieNode* root = new TrieNode();
        for (const string& w : words) {   // duplicates are inserted twice, so their counts add up
            TrieNode* node = root;
            for (char ch : w) {
                if (!node->children.count(ch)) node->children[ch] = new TrieNode();
                node = node->children[ch];
                node->count++;
            }
        }
        TrieNode* node = root;
        for (char ch : pref) {
            auto it = node->children.find(ch);
            if (it == node->children.end()) return 0;
            node = it->second;
        }
        return node->count;
    }
};
