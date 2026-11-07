class Solution {
public:
    void wiggleSort(vector<int>& nums) {
        int n = nums.size();
        if (n < 2) return;
        mt19937 rng(random_device{}());

        // 1. Quickselect: value at sorted index n / 2 (3-way partition, random pivot)
        int k = n / 2;
        int lo = 0, hi = n - 1, median;
        while (true) {
            int pivot = nums[lo + rng() % (hi - lo + 1)];
            int lt = lo, i = lo, gt = hi;
            while (i <= gt) {
                if (nums[i] < pivot) swap(nums[lt++], nums[i++]);
                else if (nums[i] > pivot) swap(nums[i], nums[gt--]);
                else i++;
            }
            if (k < lt) hi = lt - 1;
            else if (k > gt) lo = gt + 1;
            else { median = pivot; break; }
        }

        // 2. 3-way partition over virtual indices: odd slots first, then even slots
        auto idx = [&](int i) { return (1 + 2 * i) % (n | 1); };
        int left = 0, cur = 0, right = n - 1;
        while (cur <= right) {
            int v = nums[idx(cur)];
            if (v > median) swap(nums[idx(left++)], nums[idx(cur++)]);      // large → odd slots
            else if (v < median) swap(nums[idx(cur)], nums[idx(right--)]);  // small → even slots from the end
            else cur++;                                                     // median stays in the gap
        }
    }
};
