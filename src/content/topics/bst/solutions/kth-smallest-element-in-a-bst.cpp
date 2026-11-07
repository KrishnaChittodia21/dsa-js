class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        vector<TreeNode*> stack;
        TreeNode* node = root;
        while (node || !stack.empty()) {
            while (node) { stack.push_back(node); node = node->left; } // left spine
            node = stack.back();                  // next smallest value
            stack.pop_back();
            if (--k == 0) return node->val;
            node = node->right;
        }
        return -1; // k > n (not possible under the constraints)
    }
};
