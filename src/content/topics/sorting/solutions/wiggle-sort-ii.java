class Solution {
    public void wiggleSort(int[] nums) {
        int n = nums.length;
        if (n < 2) return;
        Random rand = new Random();

        // 1. Quickselect: value at sorted index n / 2 (3-way partition, random pivot)
        int k = n / 2;
        int lo = 0, hi = n - 1, median;
        while (true) {
            int pivot = nums[lo + rand.nextInt(hi - lo + 1)];
            int lt = lo, i = lo, gt = hi;
            while (i <= gt) {
                if (nums[i] < pivot) swap(nums, lt++, i++);
                else if (nums[i] > pivot) swap(nums, i, gt--);
                else i++;
            }
            if (k < lt) hi = lt - 1;
            else if (k > gt) lo = gt + 1;
            else { median = pivot; break; }
        }

        // 2. 3-way partition over virtual indices: odd slots first, then even slots
        int m = n | 1;
        int left = 0, cur = 0, right = n - 1;
        while (cur <= right) {
            int v = nums[(1 + 2 * cur) % m];
            if (v > median) swap(nums, (1 + 2 * left++) % m, (1 + 2 * cur++) % m);   // large → odd slots
            else if (v < median) swap(nums, (1 + 2 * cur) % m, (1 + 2 * right--) % m);  // small → even slots from the end
            else cur++;                                                               // median stays in the gap
        }
    }

    private void swap(int[] nums, int i, int j) {
        int t = nums[i];
        nums[i] = nums[j];
        nums[j] = t;
    }
}
