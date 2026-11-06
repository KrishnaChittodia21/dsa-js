struct TrieNode {
    unordered_map<char, TrieNode*> children;
    int sum = 0;
};

class MapSum {
    TrieNode* root = new TrieNode();
    unordered_map<string, int> values;                              // key -> current value

public:
    MapSum() {}

    void insert(string key, int val) {
        int delta = val - values[key];                              // handles overwrite (missing key reads 0)
        values[key] = val;
        TrieNode* node = root;
        for (char ch : key) {
            if (!node->children.count(ch)) node->children[ch] = new TrieNode();
            node = node->children[ch];
            node->sum += delta;                                     // every prefix of key gains delta
        }
    }

    int sum(string prefix) {
        TrieNode* node = root;
        for (char ch : prefix) {
            auto it = node->children.find(ch);
            if (it == node->children.end()) return 0;
            node = it->second;
        }
        return node->sum;
    }
};
