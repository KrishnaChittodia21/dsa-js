class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < (int)inorder.size(); i++) idx[inorder[i]] = i;
        return build(preorder, 0, (int)inorder.size() - 1);
    }

private:
    unordered_map<int, int> idx;   // value -> position in inorder
    int p = 0;                     // next root in preorder

    // build the subtree whose values occupy inorder[lo..hi]
    TreeNode* build(vector<int>& preorder, int lo, int hi) {
        if (lo > hi) return nullptr;
        int val = preorder[p++];
        int mid = idx[val];
        TreeNode* node = new TreeNode(val);
        node->left = build(preorder, lo, mid - 1);   // left subtree comes next in preorder
        node->right = build(preorder, mid + 1, hi);
        return node;
    }
};
