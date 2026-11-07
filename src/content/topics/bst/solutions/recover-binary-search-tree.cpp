class Solution {
public:
    void recoverTree(TreeNode* root) {
        TreeNode *first = nullptr, *second = nullptr, *prev = nullptr;
        vector<TreeNode*> stack;
        TreeNode* node = root;
        while (node || !stack.empty()) {
            while (node) { stack.push_back(node); node = node->left; }
            node = stack.back();
            stack.pop_back();
            if (prev && prev->val > node->val) { // a drop in the sorted order
                if (!first) first = prev;        // too-big value appears early
                second = node;                   // too-small value appears late
            }
            prev = node;
            node = node->right;
        }
        swap(first->val, second->val);
    }
};
