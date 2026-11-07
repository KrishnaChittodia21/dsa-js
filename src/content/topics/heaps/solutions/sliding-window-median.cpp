class Solution {
    priority_queue<int> low;                                // smaller half
    priority_queue<int, vector<int>, greater<int>> high;    // larger half
    unordered_map<int, int> delayed;                        // value -> copies logically deleted
    int lowSize = 0, highSize = 0;                          // live elements only

    template <class Heap>
    void prune(Heap& heap) {
        while (!heap.empty() && delayed[heap.top()] > 0) {
            delayed[heap.top()]--;
            heap.pop();
        }
    }

    void rebalance() {
        if (lowSize > highSize + 1) {
            high.push(low.top()); low.pop(); lowSize--; highSize++; prune(low);
        } else if (highSize > lowSize) {
            low.push(high.top()); high.pop(); highSize--; lowSize++; prune(high);
        }
    }

    void add(int x) {
        if (low.empty() || x <= low.top()) { low.push(x); lowSize++; }
        else { high.push(x); highSize++; }
        rebalance();
    }

    void remove(int x) {
        delayed[x]++;
        if (x <= low.top()) { lowSize--; if (x == low.top()) prune(low); }
        else { highSize--; if (x == high.top()) prune(high); }
        rebalance();
    }

public:
    vector<double> medianSlidingWindow(vector<int>& nums, int k) {
        low = {}; high = {}; delayed.clear(); lowSize = highSize = 0;
        vector<double> out;
        for (int i = 0; i < (int) nums.size(); i++) {
            add(nums[i]);
            if (i >= k) remove(nums[i - k]);
            if (i >= k - 1) {
                // long long: the sum of two ints can overflow
                out.push_back(k % 2 == 1 ? low.top() : ((long long) low.top() + high.top()) / 2.0);
            }
        }
        return out;
    }
};
