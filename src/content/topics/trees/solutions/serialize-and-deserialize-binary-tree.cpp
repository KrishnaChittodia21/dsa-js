class Codec {
public:
    // Level-order (BFS) encoding with '#' for missing children — fully iterative.
    string serialize(TreeNode* root) {
        if (root == nullptr) return "";
        vector<string> out;
        vector<TreeNode*> queue{root};
        for (size_t head = 0; head < queue.size(); head++) {
            TreeNode* node = queue[head];
            if (node == nullptr) { out.push_back("#"); continue; }
            out.push_back(to_string(node->val));
            queue.push_back(node->left);                 // nulls are queued too
            queue.push_back(node->right);
        }
        while (out.back() == "#") out.pop_back();       // trailing nulls carry no information
        string data;
        for (size_t i = 0; i < out.size(); i++) data += (i ? "," : "") + out[i];
        return data;
    }

    TreeNode* deserialize(string data) {
        if (data.empty()) return nullptr;
        vector<string> tokens;
        stringstream ss(data);
        for (string t; getline(ss, t, ',');) tokens.push_back(t);
        TreeNode* root = new TreeNode(stoi(tokens[0]));
        vector<TreeNode*> queue{root};
        size_t i = 1;
        for (size_t head = 0; head < queue.size() && i < tokens.size(); head++) {
            TreeNode* node = queue[head];
            // the next two tokens are this node's left and right child
            if (i < tokens.size() && tokens[i] != "#") {
                node->left = new TreeNode(stoi(tokens[i]));
                queue.push_back(node->left);
            }
            i++;
            if (i < tokens.size() && tokens[i] != "#") {
                node->right = new TreeNode(stoi(tokens[i]));
                queue.push_back(node->right);
            }
            i++;
        }
        return root;
    }
};
