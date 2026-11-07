class BSTIterator {
    vector<TreeNode*> stack; // unvisited ancestors along one path; top = next smallest

    void pushLeft(TreeNode* node) {
        while (node) {
            stack.push_back(node);
            node = node->left;
        }
    }

public:
    BSTIterator(TreeNode* root) {
        pushLeft(root);
    }

    int next() {
        TreeNode* node = stack.back();
        stack.pop_back();
        pushLeft(node->right); // the successor is the leftmost node of the right subtree
        return node->val;
    }

    bool hasNext() {
        return !stack.empty();
    }
};
