class Solution {
    vector<int> mx, tag;

    int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return mx[node];
        int mid = (lo + hi) >> 1;
        return max({tag[node], query(2 * node, lo, mid, l, r), query(2 * node + 1, mid + 1, hi, l, r)});
    }

    void raise(int node, int lo, int hi, int l, int r, int h) {
        if (r < lo || hi < l) return;
        mx[node] = max(mx[node], h);         // some cell inside now reaches h
        if (l <= lo && hi <= r) {
            tag[node] = max(tag[node], h);
            return;
        }
        int mid = (lo + hi) >> 1;
        raise(2 * node, lo, mid, l, r, h);
        raise(2 * node + 1, mid + 1, hi, l, r, h);
    }

public:
    vector<int> fallingSquares(vector<vector<int>>& positions) {
        // 1. coordinate compression of all edges
        vector<int> xs;
        for (auto& p : positions) {
            xs.push_back(p[0]);
            xs.push_back(p[0] + p[1]);
        }
        sort(xs.begin(), xs.end());
        xs.erase(unique(xs.begin(), xs.end()), xs.end());
        auto idx = [&](int x) { return int(lower_bound(xs.begin(), xs.end(), x) - xs.begin()); };
        int m = xs.size() - 1;               // number of cells [xs[k], xs[k+1])
        mx.assign(4 * m, 0);                 // max height inside the node
        tag.assign(4 * m, 0);                // every cell of the node is at least this

        vector<int> res;
        int best = 0;
        for (auto& p : positions) {
            int left = p[0], side = p[1];
            int L = idx(left), R = idx(left + side) - 1;  // cells covered by the square
            int h = query(1, 0, m - 1, L, R) + side;
            raise(1, 0, m - 1, L, R, h);
            best = max(best, h);
            res.push_back(best);
        }
        return res;
    }
};
